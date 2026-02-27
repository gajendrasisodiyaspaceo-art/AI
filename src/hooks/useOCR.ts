import { useState, useCallback, useEffect } from 'react'
import type { OCRResult } from '@/types'
import { extractText, terminateWorker } from '@/services/ocrService'

interface UseOCRReturn {
  ocrResult: OCRResult | null
  isProcessing: boolean
  error: string | null
  processImage: (imageDataUrl: string) => Promise<OCRResult | null>
}

export function useOCR(): UseOCRReturn {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImage = useCallback(async (imageDataUrl: string): Promise<OCRResult | null> => {
    try {
      setIsProcessing(true)
      setError(null)
      const result = await extractText(imageDataUrl)
      setOcrResult(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR processing failed'
      setError(message)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      terminateWorker()
    }
  }, [])

  return { ocrResult, isProcessing, error, processImage }
}
