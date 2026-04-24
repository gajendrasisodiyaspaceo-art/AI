import { useState, useRef, useCallback, useEffect } from 'react'
import { detectQuestion } from '@/services/questionDetector'

const COOLDOWN_MS = 1500
const DUPLICATE_WINDOW_MS = 60000

function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim()
  const bLower = b.toLowerCase().trim()
  if (aLower === bLower) return 1

  const aWords = new Set(aLower.split(/\s+/))
  const bWords = new Set(bLower.split(/\s+/))
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)))
  const union = new Set([...aWords, ...bWords])
  return intersection.size / union.size
}

interface DetectedQuestion {
  id: string
  text: string
  timestamp: number
}

interface UseQuestionDetectorReturn {
  detectedQuestions: DetectedQuestion[]
  clearQuestions: () => void
}

export function useQuestionDetector(transcriptText: string): UseQuestionDetectorReturn {
  const [detectedQuestions, setDetectedQuestions] = useState<DetectedQuestion[]>([])
  const lastDetectionTime = useRef(0)
  const processedRef = useRef<Set<string>>(new Set())
  const pendingRef = useRef<string | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detectedQuestionsRef = useRef(detectedQuestions)
  detectedQuestionsRef.current = detectedQuestions

  useEffect(() => {
    if (!transcriptText.trim()) return

    const tryProcess = (text: string, questions: DetectedQuestion[]) => {
      if (!detectQuestion(text)) return

      const now = Date.now()
      const isDuplicate = questions.some(
        (q) => now - q.timestamp < DUPLICATE_WINDOW_MS && similarity(q.text, text) > 0.85
      )
      if (isDuplicate) return

      const textKey = text.toLowerCase().trim()
      if (processedRef.current.has(textKey)) return
      processedRef.current.add(textKey)

      lastDetectionTime.current = now

      const newQuestion: DetectedQuestion = {
        id: `q-${now}-${Math.random().toString(36).slice(2, 8)}`,
        text: text.trim(),
        timestamp: now,
      }

      setDetectedQuestions((prev) => [...prev, newQuestion])
    }

    const now = Date.now()
    const elapsed = now - lastDetectionTime.current

    if (elapsed < COOLDOWN_MS) {
      pendingRef.current = transcriptText
      if (!pendingTimerRef.current) {
        pendingTimerRef.current = setTimeout(() => {
          pendingTimerRef.current = null
          const pending = pendingRef.current
          pendingRef.current = null
          if (pending) {
            tryProcess(pending, detectedQuestionsRef.current)
          }
        }, COOLDOWN_MS - elapsed)
      }
      return
    }

    tryProcess(transcriptText, detectedQuestions)
  }, [transcriptText, detectedQuestions])

  const clearQuestions = useCallback(() => {
    setDetectedQuestions([])
    processedRef.current.clear()
    pendingRef.current = null
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }
  }, [])

  return { detectedQuestions, clearQuestions }
}
