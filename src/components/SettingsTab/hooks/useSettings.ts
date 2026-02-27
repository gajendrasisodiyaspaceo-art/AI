import { useState, useEffect, useCallback } from 'react'
import type { Settings, AIModel, AIProvider } from '../../../types'
import { checkConnection, getModels } from '../../../services/aiService'

export interface AudioDevice {
  deviceId: string
  label: string
}

export const GROQ_MODELS: AIModel[] = [
  { name: 'llama-3.3-70b-versatile' },
  { name: 'llama-3.1-8b-instant' },
  { name: 'mixtral-8x7b-32768' },
]

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [aiStatus, setAiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [resumePreview, setResumePreview] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [models, setModels] = useState<AIModel[]>(GROQ_MODELS)

  useEffect(() => {
    const load = async () => {
      try {
        const s = await window.electronAPI.getSettings()
        setSettings(s)
      } catch {
        // Settings not available yet
      }
    }
    load()
  }, [])

  useEffect(() => {
    const enumerate = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}` }))
        setAudioDevices(audioInputs)
      } catch {
        // No permission or no devices
      }
    }
    enumerate()
  }, [])

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      try {
        await window.electronAPI.setSetting(key, value)
        setSettings(prev => (prev ? { ...prev, [key]: value } : prev))
      } catch {
        // Save failed
      }
    },
    []
  )

  useEffect(() => {
    if (!settings) return
    const provider = settings.aiProvider || 'groq'
    const checkAI = async () => {
      setAiStatus('checking')
      const valid = await checkConnection(settings.groqApiKey, provider)
      setAiStatus(valid ? 'connected' : 'disconnected')
    }
    checkAI()
  }, [settings?.groqApiKey, settings?.aiProvider])

  useEffect(() => {
    if (!settings) return
    const provider = settings.aiProvider || 'groq'
    const loadModels = async () => {
      const fetched = await getModels(provider)
      const list = fetched.length > 0 ? fetched : (provider === 'groq' ? GROQ_MODELS : [])
      setModels(list)
      if (list.length > 0 && !list.some(m => m.name === settings.aiModel)) {
        updateSetting('aiModel', list[0].name)
      }
    }
    loadModels()
  }, [settings?.aiProvider])

  useEffect(() => {
    const loadResume = async () => {
      try {
        const text = await window.electronAPI.getResume()
        setResumePreview(text || '')
      } catch {
        // No resume
      }
    }
    loadResume()
  }, [])

  const handleProviderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value as AIProvider
      updateSetting('aiProvider', val)
    },
    [updateSetting]
  )

  const handleApiKeyChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      updateSetting('groqApiKey', val)
    },
    [updateSetting]
  )

  const handleUploadResume = useCallback(async () => {
    try {
      const text = await window.electronAPI.uploadResume()
      if (text) {
        setResumePreview(text)
        updateSetting('resumeText', text)
      }
    } catch {
      // Upload failed
    }
  }, [updateSetting])

  const handleDeleteResume = useCallback(async () => {
    try {
      await window.electronAPI.deleteResume()
      setResumePreview('')
      updateSetting('resumeText', '')
    } catch {
      // Delete failed
    }
  }, [updateSetting])

  const handleStealthToggle = useCallback(async () => {
    if (!settings) return
    const newValue = !settings.stealthMode
    if (newValue) {
      await window.electronAPI.enableStealth()
    } else {
      await window.electronAPI.disableStealth()
    }
    updateSetting('stealthMode', newValue)
  }, [settings, updateSetting])

  const handleOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      updateSetting('opacity', val)
      window.electronAPI.setOpacity(val)
    },
    [updateSetting]
  )

  const provider: AIProvider = settings?.aiProvider || 'groq'

  return {
    settings,
    audioDevices,
    aiStatus,
    resumePreview,
    showApiKey,
    setShowApiKey,
    models,
    provider,
    updateSetting,
    handleProviderChange,
    handleApiKeyChange,
    handleUploadResume,
    handleDeleteResume,
    handleStealthToggle,
    handleOpacityChange,
  }
}
