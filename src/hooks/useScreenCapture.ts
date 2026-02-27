import { useState, useRef, useCallback, useEffect } from 'react'

interface UseScreenCaptureReturn {
  screenshot: string | null
  isCapturing: boolean
  error: string | null
  captureScreen: () => Promise<string | null>
  startAutoCapture: (intervalMs?: number) => void
  stopAutoCapture: () => void
  isAutoCapturing: boolean
}

export function useScreenCapture(): UseScreenCaptureReturn {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const captureScreen = useCallback(async (): Promise<string | null> => {
    try {
      setIsCapturing(true)
      setError(null)
      const result = await window.electronAPI.captureScreen()

      if (result.success && result.dataUrl) {
        setScreenshot(result.dataUrl)
        return result.dataUrl
      }

      // Structured error from main process
      setError(result.message || 'Failed to capture screen')
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture screen'
      setError(message)
      return null
    } finally {
      setIsCapturing(false)
    }
  }, [])

  const startAutoCapture = useCallback((intervalMs: number = 30000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsAutoCapturing(true)
    // Capture immediately, then at interval
    captureScreen()
    intervalRef.current = setInterval(() => {
      captureScreen()
    }, intervalMs)
  }, [captureScreen])

  const stopAutoCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsAutoCapturing(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    screenshot,
    isCapturing,
    error,
    captureScreen,
    startAutoCapture,
    stopAutoCapture,
    isAutoCapturing,
  }
}
