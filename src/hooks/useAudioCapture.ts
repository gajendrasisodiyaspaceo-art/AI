import { useState, useRef, useCallback } from 'react'

interface UseAudioCaptureOptions {
  deviceId?: string
}

interface UseAudioCaptureReturn {
  stream: MediaStream | null
  isCapturing: boolean
  error: string | null
  startCapture: () => Promise<void>
  stopCapture: () => void
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      setError(null)

      const constraints: MediaStreamConstraints = {
        audio: options.deviceId
          ? { deviceId: { exact: options.deviceId } }
          : true,
        video: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsCapturing(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture audio'
      setError(message)
      setIsCapturing(false)
    }
  }, [options.deviceId])

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsCapturing(false)
  }, [])

  return { stream, isCapturing, error, startCapture, stopCapture }
}
