import { useState, useEffect, useCallback } from 'react'
import { checkConnection, getModels } from '../../../services/aiService'
import type { AIProvider } from '../../../types'

type Step = 1 | 2 | 3 | 4

export interface AudioDevice {
  deviceId: string
  label: string
}

export type ApiKeyStatus = 'idle' | 'checking' | 'valid' | 'invalid'
export type OllamaStatus = 'idle' | 'checking' | 'connected' | 'disconnected'

export function useSetupWizard(onComplete: () => void) {
  const [step, setStep] = useState<Step>(1)

  const [provider, setProvider] = useState<AIProvider>('groq')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>('idle')
  const [showApiKey, setShowApiKey] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('idle')

  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')

  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [resumePreview, setResumePreview] = useState('')

  // Load existing settings on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const settings = await window.electronAPI.getSettings()
        if (settings.aiProvider) {
          setProvider(settings.aiProvider)
        }
        if (settings.groqApiKey) {
          setApiKey(settings.groqApiKey)
          setApiKeyStatus('checking')
          const valid = await checkConnection(settings.groqApiKey, 'groq')
          setApiKeyStatus(valid ? 'valid' : 'invalid')
        }
      } catch {
        // Settings not available yet
      }
    }
    loadExisting()
  }, [])

  // Enumerate audio devices when step 2 is active
  useEffect(() => {
    if (step === 2) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const audioInputs = devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
            }))
          setAudioDevices(audioInputs)
          if (audioInputs.length > 0 && !selectedDevice) {
            setSelectedDevice(audioInputs[0].deviceId)
          }
        })
        .catch(() => {
          setAudioDevices([])
        })
    }
  }, [step, selectedDevice])

  const validateApiKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setApiKeyStatus('checking')
    const valid = await checkConnection(apiKey.trim(), 'groq')
    setApiKeyStatus(valid ? 'valid' : 'invalid')
    if (valid) {
      await window.electronAPI.setSetting('groqApiKey', apiKey.trim())
    }
  }, [apiKey])

  const checkOllama = useCallback(async () => {
    setOllamaStatus('checking')
    const ok = await checkConnection(undefined, 'ollama')
    setOllamaStatus(ok ? 'connected' : 'disconnected')
  }, [])

  const handleResumeUpload = useCallback(async () => {
    try {
      const text = await window.electronAPI.uploadResume()
      if (text) {
        setResumeUploaded(true)
        setResumePreview(text.slice(0, 200) + (text.length > 200 ? '...' : ''))
      }
    } catch {
      // Upload canceled or failed
    }
  }, [])

  const handleComplete = useCallback(async () => {
    await window.electronAPI.setSetting('aiProvider', provider)
    if (provider === 'ollama') {
      const ollamaModels = await getModels('ollama')
      if (ollamaModels.length > 0) {
        await window.electronAPI.setSetting('aiModel', ollamaModels[0].name)
      }
    } else {
      await window.electronAPI.setSetting('aiModel', 'llama-3.3-70b-versatile')
    }
    await window.electronAPI.setSetting('audioDevice', selectedDevice || 'default')
    await window.electronAPI.setSetting('hasCompletedSetup', true)
    onComplete()
  }, [provider, selectedDevice, onComplete])

  const nextStep = useCallback(() => {
    if (step < 4) setStep((step + 1) as Step)
  }, [step])

  const prevStep = useCallback(() => {
    if (step > 1) setStep((step - 1) as Step)
  }, [step])

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value)
    setApiKeyStatus('idle')
  }, [])

  const toggleShowApiKey = useCallback(() => {
    setShowApiKey((prev) => !prev)
  }, [])

  return {
    step,
    provider,
    apiKey,
    apiKeyStatus,
    showApiKey,
    ollamaStatus,
    audioDevices,
    selectedDevice,
    resumeUploaded,
    resumePreview,
    setProvider,
    setSelectedDevice,
    handleApiKeyChange,
    toggleShowApiKey,
    validateApiKey,
    checkOllama,
    handleResumeUpload,
    handleComplete,
    nextStep,
    prevStep,
  }
}
