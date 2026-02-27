import { memo } from 'react'
import type { AIProvider } from '../../../types'
import type { ApiKeyStatus, OllamaStatus } from '../hooks/useSetupWizard'
import { Spinner } from '../../common'

interface AIEngineStepProps {
  provider: AIProvider
  apiKey: string
  apiKeyStatus: ApiKeyStatus
  showApiKey: boolean
  ollamaStatus: OllamaStatus
  onProviderChange: (provider: AIProvider) => void
  onApiKeyChange: (value: string) => void
  onShowApiKeyToggle: () => void
  onValidateApiKey: () => void
  onCheckOllama: () => void
}

export default memo(function AIEngineStep({
  provider,
  apiKey,
  apiKeyStatus,
  showApiKey,
  ollamaStatus,
  onProviderChange,
  onApiKeyChange,
  onShowApiKeyToggle,
  onValidateApiKey,
  onCheckOllama,
}: AIEngineStepProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-medium text-white/90">AI Engine</h2>
        <p className="text-sm text-white/45 mt-1 leading-relaxed">
          Choose your AI provider
        </p>
      </div>

      {/* Provider radio cards */}
      <div className="space-y-2">
        <label
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            provider === 'groq'
              ? 'bg-[var(--bg-surface)] border-violet-500/40'
              : 'bg-[var(--bg-surface)] border-white/[0.08] hover:bg-white/[0.04]'
          }`}
        >
          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            provider === 'groq' ? 'border-violet-500' : 'border-white/20'
          }`}>
            {provider === 'groq' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-white/85">Groq Cloud</span>
            <p className="text-xs text-white/45 mt-0.5">Fast cloud-based inference</p>
          </div>
          <input
            type="radio"
            name="provider"
            value="groq"
            checked={provider === 'groq'}
            onChange={() => onProviderChange('groq')}
            className="sr-only"
          />
        </label>

        <label
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            provider === 'ollama'
              ? 'bg-[var(--bg-surface)] border-violet-500/40'
              : 'bg-[var(--bg-surface)] border-white/[0.08] hover:bg-white/[0.04]'
          }`}
        >
          <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            provider === 'ollama' ? 'border-violet-500' : 'border-white/20'
          }`}>
            {provider === 'ollama' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-white/85">Ollama Local</span>
            <p className="text-xs text-white/45 mt-0.5">Run models locally on your machine</p>
          </div>
          <input
            type="radio"
            name="provider"
            value="ollama"
            checked={provider === 'ollama'}
            onChange={() => onProviderChange('ollama')}
            className="sr-only"
          />
        </label>
      </div>

      {/* Groq config */}
      {provider === 'groq' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/35 uppercase tracking-wider px-0.5">
            API KEY
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/40 transition-colors font-mono"
            />
            <button
              onClick={onShowApiKeyToggle}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showApiKey ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-xs text-white/25 px-0.5">
            Get your API key from console.groq.com
          </p>

          <button
            onClick={onValidateApiKey}
            disabled={!apiKey.trim() || apiKeyStatus === 'checking'}
            className="text-xs px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {apiKeyStatus === 'checking' ? 'Validating...' : 'Validate'}
          </button>

          <ApiKeyStatusCard status={apiKeyStatus} />
        </div>
      )}

      {/* Ollama config */}
      {provider === 'ollama' && (
        <div className="space-y-2">
          <button
            onClick={onCheckOllama}
            disabled={ollamaStatus === 'checking'}
            className="text-xs px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {ollamaStatus === 'checking' ? 'Checking...' : 'Check Ollama Connection'}
          </button>

          <OllamaStatusCard status={ollamaStatus} />
        </div>
      )}
    </div>
  )
})

function ApiKeyStatusCard({ status }: { status: ApiKeyStatus }) {
  if (status === 'idle') return null

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      status === 'valid'
        ? 'bg-emerald-500/[0.06] border-emerald-500/20'
        : status === 'invalid'
          ? 'bg-red-500/[0.06] border-red-500/20'
          : 'bg-white/[0.03] border-white/[0.06]'
    }`}>
      {status === 'checking' && (
        <Spinner size="sm" label="Validating API key..." />
      )}
      {status === 'valid' && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-emerald-400 font-medium">API key is valid</p>
        </div>
      )}
      {status === 'invalid' && (
        <div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-xs text-red-400 font-medium">Invalid API key</p>
          </div>
          <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
            Please check your key and try again.
          </p>
        </div>
      )}
    </div>
  )
}

function OllamaStatusCard({ status }: { status: OllamaStatus }) {
  if (status === 'idle') return null

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      status === 'connected'
        ? 'bg-emerald-500/[0.06] border-emerald-500/20'
        : status === 'disconnected'
          ? 'bg-red-500/[0.06] border-red-500/20'
          : 'bg-white/[0.03] border-white/[0.06]'
    }`}>
      {status === 'checking' && (
        <Spinner size="sm" label="Checking Ollama..." />
      )}
      {status === 'connected' && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-emerald-400 font-medium">Ollama is running</p>
        </div>
      )}
      {status === 'disconnected' && (
        <div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-xs text-red-400 font-medium">Ollama not reachable</p>
          </div>
          <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
            Make sure Ollama is installed and running on localhost:11434.
          </p>
        </div>
      )}
    </div>
  )
}
