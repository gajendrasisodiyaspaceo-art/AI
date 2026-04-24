import { useState, useRef, useCallback } from 'react'
import { TranscriptionService, WhisperTranscriptionService } from '@/services/transcriptionService'

interface UseTranscriptionOptions {
  onFinalTranscript?: (text: string) => void
  engine?: 'webspeech' | 'whisper'
  apiKey?: string
  deviceId?: string
}

interface UseTranscriptionReturn {
  transcript: string
  finalTranscript: string
  latestSegment: string
  isTranscribing: boolean
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
}

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionReturn {
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [latestSegment, setLatestSegment] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<TranscriptionService | WhisperTranscriptionService | null>(null)
  const onFinalTranscriptRef = useRef(options.onFinalTranscript)
  onFinalTranscriptRef.current = options.onFinalTranscript

  const start = useCallback(async (): Promise<boolean> => {
    setError(null)
    setLatestSegment('')
    setFinalTranscript('')

    // Pick service based on engine option
    const engine = options.engine ?? 'webspeech'
    const service =
      engine === 'whisper'
        ? new WhisperTranscriptionService(options.apiKey ?? '', options.deviceId)
        : new TranscriptionService()

    serviceRef.current = service

    const started = await service.start({
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setFinalTranscript((prev) => prev + (prev ? ' ' : '') + text)
          setLatestSegment(text)
          setTranscript('')
          setError(null) // Clear any previous transient errors on successful result
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
  }, [options.engine, options.apiKey, options.deviceId])

  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop()
      serviceRef.current = null
    }
    setIsTranscribing(false)
    setTranscript('')
  }, [])

  return { transcript, finalTranscript, latestSegment, isTranscribing, error, start, stop }
}
