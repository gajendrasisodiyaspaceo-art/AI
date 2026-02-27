import { useState, useRef, useCallback } from 'react'
import { TranscriptionService } from '@/services/transcriptionService'

interface UseTranscriptionOptions {
  onFinalTranscript?: (text: string) => void
}

interface UseTranscriptionReturn {
  transcript: string
  finalTranscript: string
  isTranscribing: boolean
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
}

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<TranscriptionService | null>(null)
  const onFinalTranscriptRef = useRef(options.onFinalTranscript)
  onFinalTranscriptRef.current = options.onFinalTranscript

  const start = useCallback(async (): Promise<boolean> => {
    setError(null)
    const service = new TranscriptionService()
    serviceRef.current = service

    const started = await service.start({
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setFinalTranscript((prev) => prev + (prev ? ' ' : '') + text)
          setTranscript('')
          onFinalTranscriptRef.current?.(text)
        } else {
          setTranscript(text)
        }
      },
      onError: (err: string) => {
        setError(err)
      },
    })

    if (started) {
      setIsTranscribing(true)
    }
    return started
  }, [])

  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop()
      serviceRef.current = null
    }
    setIsTranscribing(false)
    setTranscript('')
  }, [])

  return { transcript, finalTranscript, isTranscribing, error, start, stop }
}
