import { useState, useRef, useCallback, useEffect } from 'react'
import { generateAnswer } from '@/services/aiService'
import type { Settings } from '@/types'

interface UseAIAnswerReturn {
  answer: string
  isStreaming: boolean
  error: string | null
  askQuestion: (question: string, context?: string) => Promise<void>
  regenerate: () => Promise<void>
  copyToClipboard: () => Promise<boolean>
  clearAnswer: () => void
}

export function useAIAnswer(): UseAIAnswerReturn {
  const [answer, setAnswer] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastQuestionRef = useRef<string>('')
  const lastContextRef = useRef<string | undefined>(undefined)
  const abortRef = useRef(false)
  const settingsRef = useRef<Settings | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        settingsRef.current = await window.electronAPI.getSettings()
      } catch {
        // Settings not available
      }
    }
    loadSettings()
  }, [])

  const askQuestion = useCallback(
    async (question: string, context?: string) => {
      lastQuestionRef.current = question
      lastContextRef.current = context
      abortRef.current = false

      setAnswer('')
      setError(null)
      setIsStreaming(true)

      try {
        // Reload settings each time to get latest API key and model
        const settings = await window.electronAPI.getSettings()
        settingsRef.current = settings

        // Pre-flight: check API key is configured
        if ((settings.aiProvider || 'groq') === 'groq' && !settings.groqApiKey) {
          throw new Error('Groq API key not configured. Go to Settings to add your API key.')
        }

        const stream = generateAnswer(
          question,
          context,
          settings.aiModel,
          settings.resumeText,
          settings.groqApiKey,
          settings.aiProvider
        )
        let accumulated = ''

        for await (const token of stream) {
          if (abortRef.current) break
          accumulated += token
          setAnswer(accumulated)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate answer'
        setError(message)
      } finally {
        setIsStreaming(false)
      }
    },
    []
  )

  const regenerate = useCallback(async () => {
    if (lastQuestionRef.current) {
      await askQuestion(lastQuestionRef.current, lastContextRef.current)
    }
  }, [askQuestion])

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!answer) return false
    try {
      await navigator.clipboard.writeText(answer)
      return true
    } catch {
      return false
    }
  }, [answer])

  const clearAnswer = useCallback(() => {
    abortRef.current = true
    setAnswer('')
    setError(null)
    setIsStreaming(false)
  }, [])

  return { answer, isStreaming, error, askQuestion, regenerate, copyToClipboard, clearAnswer }
}
