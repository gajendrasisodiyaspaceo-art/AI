import { memo } from 'react'

interface StatusBarProps {
  isActive: boolean
  isTranscribing: boolean
  aiStatus: 'connected' | 'disconnected' | 'checking'
  questionsRemaining?: number
  isPro?: boolean
}

const aiConfig = {
  connected: { label: 'AI Connected', dotClass: 'bg-emerald-400', chipClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  disconnected: { label: 'Disconnected', dotClass: 'bg-red-400', chipClass: 'bg-red-500/10', textClass: 'text-red-400' },
  checking: { label: 'Checking', dotClass: 'bg-amber-400 animate-pulse', chipClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
} as const

export default memo(function StatusBar({ isActive, isTranscribing, aiStatus, questionsRemaining, isPro }: StatusBarProps) {
  const ai = aiConfig[aiStatus]

  return (
    <div className="flex items-center justify-between h-9 px-4">
      {/* Listening status chip */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400/90'
              : 'bg-white/[0.04] text-white/40'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`} />
          {isActive ? 'Listening' : 'Idle'}
        </span>

        {isTranscribing && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Transcribing
          </span>
        )}
      </div>

      {/* Usage pill for free users */}
      {isPro === false && questionsRemaining !== undefined && (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
          questionsRemaining === 0
            ? 'bg-red-500/10 text-red-400'
            : 'bg-white/[0.04] text-white/40'
        }`}>
          {questionsRemaining}/10
        </span>
      )}

      {/* AI status chip — right aligned */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${ai.chipClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${ai.dotClass}`} />
        <span className={ai.textClass}>{ai.label}</span>
      </span>
    </div>
  )
})
