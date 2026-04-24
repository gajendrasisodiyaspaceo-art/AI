import { memo } from 'react'

interface StatusBarProps {
  isActive: boolean
  isTranscribing: boolean
  aiStatus: 'connected' | 'disconnected' | 'checking'
  questionsRemaining?: number
  isPro?: boolean
}

const aiConfig = {
  connected: { label: 'AI Connected', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
  disconnected: { label: 'Disconnected', dotClass: 'bg-red-400', textClass: 'text-red-400' },
  checking: { label: 'Checking', dotClass: 'bg-amber-400 animate-pulse', textClass: 'text-amber-400' },
} as const

export default memo(function StatusBar({ isActive, isTranscribing, aiStatus, questionsRemaining, isPro }: StatusBarProps) {
  const ai = aiConfig[aiStatus]

  return (
    <div
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: '32px',
        paddingLeft: 'var(--sp-page)',
        paddingRight: 'var(--sp-page)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Listening status */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <span
            className={`rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#6B6B70]'}`}
            style={{ width: '6px', height: '6px' }}
          />
          <span className={isActive ? 'text-emerald-400' : 'text-[#6B6B70]'}>
            {isActive ? 'Listening' : 'Idle'}
          </span>
        </span>

        {isTranscribing && (
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <span className="bg-[#8B5CF6] animate-pulse rounded-full" style={{ width: '6px', height: '6px' }} />
            <span className="text-[#8B5CF6]">Transcribing</span>
          </span>
        )}
      </div>

      {/* Usage for free users */}
      {isPro === false && questionsRemaining !== undefined && (
        <span className={`text-[11px] ${
          questionsRemaining === 0 ? 'text-red-400' : 'text-[#6B6B70]'
        }`}>
          {questionsRemaining}/10
        </span>
      )}

      {/* AI status */}
      <span className="inline-flex items-center gap-1.5 text-[11px]">
        <span className={`rounded-full ${ai.dotClass}`} style={{ width: '6px', height: '6px' }} />
        <span className={ai.textClass}>{ai.label}</span>
      </span>
    </div>
  )
})
