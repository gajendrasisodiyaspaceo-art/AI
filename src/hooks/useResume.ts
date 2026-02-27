import { useState, useCallback, useEffect } from 'react'

interface UseResumeReturn {
  resumeText: string
  isUploading: boolean
  error: string | null
  uploadResume: () => Promise<void>
  deleteResume: () => Promise<void>
  hasResume: boolean
}

export function useResume(): UseResumeReturn {
  const [resumeText, setResumeText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadResume = useCallback(async () => {
    try {
      const text = await window.electronAPI.getResume()
      setResumeText(text || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load resume'
      setError(message)
    }
  }, [])

  const uploadResume = useCallback(async () => {
    try {
      setIsUploading(true)
      setError(null)
      const text = await window.electronAPI.uploadResume()
      if (text) {
        setResumeText(text)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload resume'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deleteResume = useCallback(async () => {
    try {
      setError(null)
      await window.electronAPI.deleteResume()
      setResumeText('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete resume'
      setError(message)
    }
  }, [])

  // Load resume on mount
  useEffect(() => {
    loadResume()
  }, [loadResume])

  return {
    resumeText,
    isUploading,
    error,
    uploadResume,
    deleteResume,
    hasResume: resumeText.length > 0,
  }
}
