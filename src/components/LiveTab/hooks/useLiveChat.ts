import { useState, useEffect, useRef, useCallback } from 'react'
import { useVoiceInput } from '../../../hooks/useVoiceInput'
import type { VoiceState } from '../../../hooks/useVoiceInput'
import { useAIAnswer } from '../../../hooks/useAIAnswer'
import { useScreenCapture } from '../../../hooks/useScreenCapture'
import { useOCR } from '../../../hooks/useOCR'
import { useSession } from '../../../hooks/useSession'
import { checkConnection } from '../../../services/aiService'
import type { QAPair, Settings } from '../../../types'

interface UseLiveChatOptions {
  onLatestAnswer?: (answer: string) => void
  trackQuestion?: () => Promise<boolean>
}

export type { VoiceState }

export function useLiveChat({ onLatestAnswer, trackQuestion }: UseLiveChatOptions = {}) {
  const [transcriptionEngine, setTranscriptionEngine] = useState<'webspeech' | 'whisper'>('webspeech')
  const [groqApiKey, setGroqApiKey] = useState<string>('')
  const [audioDevice, setAudioDevice] = useState<string | undefined>(undefined)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load transcription settings once on mount
  useEffect(() => {
    window.electronAPI.getSettings().then((s: Settings) => {
      const savedEngine = (s.transcriptionEngine as 'webspeech' | 'whisper') || 'webspeech'
      const key = s.groqApiKey || ''
      // In Electron, auto-use Whisper when API key is available (WebSpeech is unreliable in Electron)
      const engine = !!window.electronAPI && key ? 'whisper' : savedEngine
      setTranscriptionEngine(engine)
      setGroqApiKey(key)
      setAudioDevice(s.audioDevice && s.audioDevice !== 'default' ? s.audioDevice : undefined)
      setSettingsLoaded(true)
    }).catch(() => {
      setSettingsLoaded(true)
    })
  }, [])

  const [manualInput, setManualInput] = useState('')

  // Push-to-record voice input: transcribed text goes into the input field
  const { voiceState, error: voiceError, toggleVoice } = useVoiceInput({
    engine: transcriptionEngine,
    apiKey: groqApiKey,
    deviceId: audioDevice,
    // WebSpeech: append each recognized sentence live
    onTranscript: useCallback((text: string) => {
      setManualInput(prev => prev ? prev + ' ' + text : text)
    }, []),
    // Whisper: replace entire input with accurate full transcription on stop
    onReplace: useCallback((text: string) => {
      setManualInput(text)
    }, []),
  })

  const { askQuestion, answer, isStreaming, error: aiError } = useAIAnswer()
  const { captureScreen, screenshot, isCapturing, error: screenCaptureError } = useScreenCapture()
  const { processImage, ocrResult } = useOCR()
  const { addQAPair } = useSession()

  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [aiStatus, setAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const currentQaPairIdRef = useRef<string | null>(null)
  const generationRef = useRef(0)

  // Derive configError from aiError
  const configError = aiError?.includes('not configured') ? aiError : null

  // Helper: add a limit-reached QA pair
  const addLimitReachedPair = useCallback((question: string, source: 'audio' | 'manual' | 'ocr') => {
    const id = crypto.randomUUID()
    const pair: QAPair = {
      id,
      question,
      answer: 'Daily question limit reached. Upgrade to Pro for unlimited questions.',
      timestamp: Date.now(),
      source,
      isStreaming: false,
    }
    setQaPairs(prev => [...prev, pair])
  }, [])

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

  // Stream answer updates
  useEffect(() => {
    const currentId = currentQaPairIdRef.current
    if (!currentId) return

    const gen = generationRef.current

    if (aiError && !isStreaming) {
      if (generationRef.current !== gen) return
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

    if (generationRef.current !== gen) return
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
      const question = ocrResult.isCodingProblem
        ? `Solve this coding problem:\n${ocrResult.text}`
        : ocrResult.text

      if (trackQuestion) {
        const allowed = await trackQuestion()
        if (!allowed) {
          addLimitReachedPair(question, 'ocr')
          return
        }
      }

      generationRef.current += 1
      const id = crypto.randomUUID()
      currentQaPairIdRef.current = id

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
  }, [ocrResult, askQuestion, trackQuestion, addLimitReachedPair])

  const handleManualSubmit = useCallback(async () => {
    const trimmed = manualInput.trim()
    if (!trimmed) return

    if (trackQuestion) {
      const allowed = await trackQuestion()
      if (!allowed) {
        addLimitReachedPair(trimmed, 'manual')
        setManualInput('')
        return
      }
    }

    generationRef.current += 1
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
  }, [manualInput, askQuestion, trackQuestion, addLimitReachedPair])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleManualSubmit()
      }
    },
    [handleManualSubmit]
  )

  // Wire up Cmd+Shift+S shortcut to toggle voice input
  useEffect(() => {
    const cleanup = window.electronAPI.onShortcut((action: string) => {
      if (action === 'toggle-listening') {
        toggleVoice()
      }
    })
    return cleanup
  }, [toggleVoice])

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
      generationRef.current += 1
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

  const isActive = voiceState === 'listening'
  const isTranscribing = voiceState === 'processing'

  return {
    // State
    qaPairs,
    manualInput,
    voiceState,
    voiceError,
    isActive,
    isTranscribing,
    transcriptionError: voiceError,
    aiStatus,
    copiedId,
    isCapturing,
    screenCaptureError,
    settingsLoaded,
    configError,

    // Refs
    chatEndRef,

    // Setters
    setManualInput,

    // Handlers
    toggleVoice,
    toggleListening: toggleVoice,
    handleManualSubmit,
    handleKeyDown,
    handleCopy,
    handleRegenerate,
    handleScreenCapture,
  }
}
