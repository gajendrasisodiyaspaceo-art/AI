import { useState, useRef, useCallback, useEffect } from 'react'
import { detectQuestion } from '@/services/questionDetector'

const COOLDOWN_MS = 3000

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

  useEffect(() => {
    if (!transcriptText.trim()) return

    const now = Date.now()
    if (now - lastDetectionTime.current < COOLDOWN_MS) return

    if (!detectQuestion(transcriptText)) return

    const isDuplicate = detectedQuestions.some(
      (q) => similarity(q.text, transcriptText) > 0.7
    )
    if (isDuplicate) return

    const textKey = transcriptText.toLowerCase().trim()
    if (processedRef.current.has(textKey)) return
    processedRef.current.add(textKey)

    lastDetectionTime.current = now

    const newQuestion: DetectedQuestion = {
      id: `q-${now}-${Math.random().toString(36).slice(2, 8)}`,
      text: transcriptText.trim(),
      timestamp: now,
    }

    setDetectedQuestions((prev) => [...prev, newQuestion])
  }, [transcriptText, detectedQuestions])

  const clearQuestions = useCallback(() => {
    setDetectedQuestions([])
    processedRef.current.clear()
  }, [])

  return { detectedQuestions, clearQuestions }
}
