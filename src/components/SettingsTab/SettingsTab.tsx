import { useCallback, useState } from 'react'
import { Spinner } from '../common'
import { useSettings } from './hooks/useSettings'
import AIStatusCard from './sections/AIStatusCard'
import AIProviderSection from './sections/AIProviderSection'
import APIKeySection from './sections/APIKeySection'
import OllamaInfoSection from './sections/OllamaInfoSection'
import AIModelSection from './sections/AIModelSection'
import AudioSection from './sections/AudioSection'
import TranscriptionSection from './sections/TranscriptionSection'
import StealthSection from './sections/StealthSection'
import OpacitySection from './sections/OpacitySection'
import ResumeSection from './sections/ResumeSection'
import ShortcutsSection from './sections/ShortcutsSection'
import AccountSection from './sections/AccountSection'
import type { UserSubscription } from '../../types'
import type { User } from '@supabase/supabase-js'

interface SettingsTabProps {
  subscription: {
    subscription: UserSubscription
    isPro: boolean
    error?: string | null
    openCheckout: () => Promise<void>
    openPortal: () => Promise<void>
  }
  auth: {
    user: User | null
    isAuthenticated: boolean
    signOut: () => Promise<void>
  }
}

export default function SettingsTab({ subscription: sub, auth }: SettingsTabProps) {
  const {
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
  } = useSettings()

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => updateSetting('aiModel', e.target.value),
    [updateSetting]
  )

  const handleAudioChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => updateSetting('audioDevice', e.target.value),
    [updateSetting]
  )

  const handleTranscriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      updateSetting('transcriptionEngine', e.target.value as 'webspeech' | 'whisper'),
    [updateSetting]
  )

  const toggleApiKeyVisibility = useCallback(() => setShowApiKey(prev => !prev), [setShowApiKey])

  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner label="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" style={{ padding: 'var(--sp-page)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-section)' }}>
      <AIStatusCard aiStatus={aiStatus} provider={provider} />
      <AIProviderSection provider={provider} onChange={handleProviderChange} />

      {provider === 'groq' && (
        <APIKeySection
          apiKey={settings.groqApiKey}
          showApiKey={showApiKey}
          onChange={handleApiKeyChange}
          onToggleShow={toggleApiKeyVisibility}
        />
      )}

      {provider === 'ollama' && (
        <OllamaInfoSection models={models} aiStatus={aiStatus} />
      )}

      <AIModelSection model={settings.aiModel} models={models} onChange={handleModelChange} />
      <AudioSection device={settings.audioDevice} devices={audioDevices} onChange={handleAudioChange} />
      <TranscriptionSection engine={settings.transcriptionEngine} onChange={handleTranscriptionChange} />
      <StealthSection stealthMode={settings.stealthMode} onToggle={handleStealthToggle} />
      <OpacitySection opacity={settings.opacity} onChange={handleOpacityChange} />
      <ResumeSection resumePreview={resumePreview} onUpload={handleUploadResume} onDelete={handleDeleteResume} />
      <ShortcutsSection />

      {/* Account & Subscription */}
      <AccountSection
        email={auth.user?.email || ''}
        subscription={sub.subscription}
        isPro={sub.isPro}
        error={sub.error}
        onUpgrade={sub.openCheckout}
        onManageSubscription={sub.openPortal}
        onLogout={auth.signOut}
      />
    </div>
  )
}
