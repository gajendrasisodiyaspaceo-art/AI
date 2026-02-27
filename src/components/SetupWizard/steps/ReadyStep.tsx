import { memo } from 'react'
import type { AIProvider } from '../../../types'
import type { ApiKeyStatus, OllamaStatus } from '../hooks/useSetupWizard'

interface ReadyStepProps {
  provider: AIProvider
  apiKeyStatus: ApiKeyStatus
  ollamaStatus: OllamaStatus
  selectedDevice: string
  resumeUploaded: boolean
}

export default memo(function ReadyStep({
  provider,
  apiKeyStatus,
  ollamaStatus,
  selectedDevice,
  resumeUploaded,
}: ReadyStepProps) {
  const aiSummaryLabel = provider === 'groq' ? 'AI (Groq Cloud)' : 'AI (Ollama Local)'
  const aiSummaryValue =
    provider === 'groq'
      ? apiKeyStatus === 'valid' ? 'Connected' : 'Not configured'
      : ollamaStatus === 'connected' ? 'Connected' : 'Not checked'
  const aiSummaryOk =
    provider === 'groq' ? apiKeyStatus === 'valid' : ollamaStatus === 'connected'

  const summaryItems = [
    {
      label: aiSummaryLabel,
      value: aiSummaryValue,
      ok: aiSummaryOk,
    },
    {
      label: 'Audio',
      value: selectedDevice ? 'Configured' : 'Default',
      ok: true,
    },
    {
      label: 'Resume',
      value: resumeUploaded ? 'Uploaded' : 'Skipped',
      ok: resumeUploaded,
    },
  ]

  return (
    <div className="space-y-4 text-center pt-4 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white/90">Ready to Go!</h2>
        <p className="text-xs text-white/45 mt-1">
          You can change any of these settings later.
        </p>
      </div>
      <div className="text-left p-3 rounded-xl surface space-y-2 mt-4">
        {summaryItems.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-white/40">{item.label}</span>
            <span className={item.ok ? 'text-emerald-400' : 'text-amber-400/70'}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
