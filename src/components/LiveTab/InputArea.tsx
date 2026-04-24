import { memo } from 'react'

interface InputAreaProps {
  manualInput: string
  onManualInputChange: (value: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onScreenCapture: () => void
  onToggleListening?: () => void
  isActive?: boolean
  isCapturing?: boolean
  screenCaptureError?: string | null
  transcriptionError?: string | null
  canScreenCapture?: boolean
  canAskQuestion?: boolean
  questionsRemaining?: number
  isPro?: boolean
  onUpgrade?: () => void
  checkoutError?: string | null
  configError?: string | null
  onGoToSettings?: () => void
}

export default memo(function InputArea({
  manualInput,
  onManualInputChange,
  onSubmit,
  onKeyDown,
  onScreenCapture,
  onToggleListening,
  isActive = false,
  isCapturing = false,
  screenCaptureError = null,
  transcriptionError = null,
  canScreenCapture,
  canAskQuestion,
  questionsRemaining,
  isPro,
  onUpgrade,
  checkoutError,
  configError = null,
  onGoToSettings,
}: InputAreaProps) {

  return (
    <div
      className="flex-shrink-0"
      style={{
        paddingTop: '12px',
        paddingLeft: 'var(--sp-page)',
        paddingRight: 'var(--sp-page)',
        paddingBottom: 'var(--sp-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Error banners */}
      {screenCaptureError && (
        <div className="flex items-center gap-2 rounded-lg text-red-400 text-xs" style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{screenCaptureError}</span>
        </div>
      )}
      {transcriptionError && (
        <div className="flex items-center gap-2 rounded-lg text-red-400 text-xs" style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1">{transcriptionError}</span>
          {transcriptionError.includes('Settings') && onGoToSettings && (
            <button
              onClick={onGoToSettings}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
            >
              Open Settings
            </button>
          )}
        </div>
      )}
      {configError && (
        <div className="flex items-center gap-2 rounded-lg text-amber-400 text-xs" style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1">{configError}</span>
          {onGoToSettings && (
            <button
              onClick={onGoToSettings}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
            >
              Open Settings
            </button>
          )}
        </div>
      )}
      {checkoutError && (
        <div className="flex items-center gap-2 rounded-lg text-red-400 text-xs" style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{checkoutError}</span>
        </div>
      )}
      {canAskQuestion === false && (
        <div className="flex items-center justify-between rounded-lg" style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <span className="text-xs text-amber-400 font-medium">Daily limit reached</span>
          <button
            onClick={onUpgrade}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Input container */}
      <div
        className="input-row flex items-center rounded-xl border"
        style={{
          height: '44px',
          padding: '0 4px 0 8px',
          background: 'var(--bg-sidebar)',
          borderColor: isActive ? 'rgba(139,92,246,0.5)' : manualInput.trim() ? 'var(--border-active)' : 'var(--border-glass)',
        }}
      >
        {/* Screen capture button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={onScreenCapture}
            disabled={isCapturing || canScreenCapture === false}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
              canScreenCapture === false
                ? 'text-[#4A4A4E] cursor-not-allowed'
                : isCapturing
                  ? 'text-[#8B5CF6] animate-pulse cursor-wait'
                  : 'text-[#4A4A4E] hover:text-[#6B6B70] hover:bg-white/[0.04]'
            }`}
            title={canScreenCapture === false ? 'Pro feature' : isCapturing ? 'Capturing...' : 'Capture Screen'}
          >
            {isCapturing ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          {canScreenCapture === false && (
            <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[8px] font-bold leading-none bg-[#8B5CF6] text-white">
              PRO
            </span>
          )}
        </div>

        {/* Mic button */}
        {onToggleListening && (
          <button
            onClick={onToggleListening}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${
              isActive
                ? 'text-[#8B5CF6]'
                : 'text-[#4A4A4E] hover:text-[#6B6B70] hover:bg-white/[0.04]'
            }`}
            style={isActive ? {
              background: 'rgba(139,92,246,0.15)',
              boxShadow: '0 0 12px rgba(139,92,246,0.3)',
              animation: 'pulse-glow 2s infinite',
            } : undefined}
            title={isActive ? 'Stop listening' : 'Start listening'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? '2.2' : '1.8'}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              {!isActive && <line x1="12" y1="19" x2="12" y2="22" />}
            </svg>
          </button>
        )}

        {/* Text input */}
        <input
          type="text"
          value={manualInput}
          onChange={e => onManualInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isActive ? 'Listening...' : 'Type a question...'}
          className="flex-1 min-w-0 bg-transparent text-[13px] text-white placeholder-[#4A4A4E] outline-none"
          style={{ height: '100%', padding: '0 8px' }}
        />

        {/* Ask button */}
        <button
          onClick={onSubmit}
          disabled={!manualInput.trim()}
          className={`flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
            manualInput.trim()
              ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white active:scale-95'
              : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
          }`}
          style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
        >
          Ask
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {isPro === false && questionsRemaining !== undefined && (
        <div className="text-center" style={{ marginTop: '-4px', marginBottom: '-4px' }}>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {questionsRemaining === 0 ? 'No questions remaining today' : `${questionsRemaining}/10 questions remaining today`}
          </span>
        </div>
      )}

    </div>
  )
})
