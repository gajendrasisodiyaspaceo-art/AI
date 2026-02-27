import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranscription } from '../../../hooks/useTranscription'
import { useQuestionDetector } from '../../../hooks/useQuestionDetector'
import { useAIAnswer } from '../../../hooks/useAIAnswer'
import { useScreenCapture } from '../../../hooks/useScreenCapture'
import { useOCR } from '../../../hooks/useOCR'
import { useSession } from '../../../hooks/useSession'
import { checkConnection } from '../../../services/aiService'
import type { QAPair, Settings } from '../../../types'

interface UseLiveChatOptions {
  onLatestAnswer?: (answer: string) => void
  trackQuestion?: () => Promise<boolean>
  canAskQuestion?: boolean
}

export function useLiveChat({ onLatestAnswer, trackQuestion, canAskQuestion }: UseLiveChatOptions = {}) {
  const { transcript, finalTranscript, isTranscribing, error: transcriptionError, start: startTranscription, stop: stopTranscription } = useTranscription()
  const { detectedQuestions } = useQuestionDetector(finalTranscript)
  const { askQuestion, answer, isStreaming, error: aiError } = useAIAnswer()
  const { captureScreen, screenshot, isCapturing, error: screenCaptureError } = useScreenCapture()
  const { processImage, ocrResult } = useOCR()
  const { currentSession, startSession, endSession, addQAPair } = useSession()

  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [manualInput, setManualInput] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [aiStatus, setAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const processedQuestionsRef = useRef<Set<string>>(new Set())
  const currentQaPairIdRef = useRef<string | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaPairs, answer])

  // Check AI connection status
  useEffect(() => {
    const checkAI = async () => {
      try {
        const settings: Settings = await window.electronAPI.getSettings()
        const provider = settings.aiProvider || 'groq'
        if (provider === 'groq') {
          setAiStatus(settings.groqApiKey ? 'connected' : 'disconnected')
        } else {
          const ok = await checkConnection(undefined, 'ollama')
          setAiStatus(ok ? 'connected' : 'disconnected')
        }
      } catch {
        setAiStatus('disconnected')
      }
    }
    checkAI()
  }, [])

  // Process detected questions from audio
  useEffect(() => {
    if (!detectedQuestions || detectedQuestions.length === 0) return

    const latest = detectedQuestions[detectedQuestions.length - 1]
    const questionText = latest.text
    if (processedQuestionsRef.current.has(latest.id)) return
    processedQuestionsRef.current.add(latest.id)

    ;(async () => {
      if (trackQuestion) {
        const allowed = await trackQuestion()
        if (!allowed) return
      }

      const id = crypto.randomUUID()
      currentQaPairIdRef.current = id
      const newPair: QAPair = {
        id,
        question: questionText,
        answer: '',
        timestamp: Date.now(),
        source: 'audio',
        isStreaming: true,
      }
      setQaPairs(prev => [...prev, newPair])
      askQuestion(questionText)
    })()
  }, [detectedQuestions, askQuestion, trackQuestion])

  // Stream answer updates
  useEffect(() => {
    const currentId = currentQaPairIdRef.current
    if (!currentId) return

    if (aiError && !isStreaming) {
      setQaPairs(prev =>
        prev.map(pair =>
          pair.id === currentId
            ? { ...pair, answer: `Error: ${aiError}`, isStreaming: false }
            : pair
        )
      )
      return
    }

    if (!answer && isStreaming) return

    setQaPairs(prev =>
      prev.map(pair =>
        pair.id === currentId
          ? { ...pair, answer: answer || '', isStreaming }
          : pair
      )
    )

    if (!isStreaming && answer && currentId) {
      const found = qaPairs.find(p => p.id === currentId)
      if (found) {
        addQAPair(found.question, answer, found.source)
      }
      onLatestAnswer?.(answer)
    }
  }, [answer, isStreaming, aiError])

  // Screen capture handler
  const handleScreenCapture = useCallback(async () => {
    await captureScreen()
  }, [captureScreen])

  // Process screenshot through OCR
  useEffect(() => {
    if (!screenshot) return
    processImage(screenshot)
  }, [screenshot, processImage])

  // Process OCR result into a question
  useEffect(() => {
    if (!ocrResult || !ocrResult.text) return

    ;(async () => {
      if (trackQuestion) {
        const allowed = await trackQuestion()
        if (!allowed) return
      }

      const id = crypto.randomUUID()
      currentQaPairIdRef.current = id
      const question = ocrResult.isCodingProblem
        ? `Solve this coding problem:\n${ocrResult.text}`
        : ocrResult.text

      const newPair: QAPair = {
        id,
        question,
        answer: '',
        timestamp: Date.now(),
        source: 'ocr',
        isStreaming: true,
      }
      setQaPairs(prev => [...prev, newPair])
      askQuestion(question)
    })()
  }, [ocrResult, askQuestion, trackQuestion])

  const toggleListening = useCallback(async () => {
    if (isActive) {
      stopTranscription()
      endSession()
      setIsActive(false)
    } else {
      startSession()
      const started = await startTranscription()
      if (started) {
        setIsActive(true)
      }
    }
  }, [isActive, startTranscription, stopTranscription, startSession, endSession])

  const handleManualSubmit = useCallback(async () => {
    const trimmed = manualInput.trim()
    if (!trimmed) return

    if (trackQuestion) {
      const allowed = await trackQuestion()
      if (!allowed) return
    }

    const id = crypto.randomUUID()
    currentQaPairIdRef.current = id
    const newPair: QAPair = {
      id,
      question: trimmed,
      answer: '',
      timestamp: Date.now(),
      source: 'manual',
      isStreaming: true,
    }
    setQaPairs(prev => [...prev, newPair])
    setManualInput('')
    askQuestion(trimmed)
  }, [manualInput, askQuestion, trackQuestion])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleManualSubmit()
      }
    },
    [handleManualSubmit]
  )

  // Wire up Cmd+Shift+S shortcut from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onShortcut((action: string) => {
      if (action === 'toggle-listening') {
        toggleListening()
      }
    })
    return cleanup
  }, [toggleListening])

  const handleCopy = useCallback(
    (pair: QAPair) => {
      navigator.clipboard.writeText(pair.answer)
      setCopiedId(pair.id)
      setTimeout(() => setCopiedId(null), 1500)
    },
    []
  )

  const handleRegenerate = useCallback(
    (pair: QAPair) => {
      currentQaPairIdRef.current = pair.id
      setQaPairs(prev =>
        prev.map(p =>
          p.id === pair.id ? { ...p, answer: '', isStreaming: true } : p
        )
      )
      askQuestion(pair.question)
    },
    [askQuestion]
  )

  return {
    // State
    qaPairs,
    manualInput,
    isActive,
    aiStatus,
    copiedId,
    isTranscribing,
    isCapturing,
    screenCaptureError,
    transcriptionError,

    // Refs
    chatEndRef,

    // Setters
    setManualInput,

    // Handlers
    toggleListening,
    handleManualSubmit,
    handleKeyDown,
    handleCopy,
    handleRegenerate,
    handleScreenCapture,
  }
}
