import { memo } from 'react'

interface InputAreaProps {
  manualInput: string
  onManualInputChange: (value: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onScreenCapture: () => void
  onToggleListening: () => void
  isActive: boolean
  isCapturing?: boolean
  screenCaptureError?: string | null
  transcriptionError?: string | null
  canScreenCapture?: boolean
  canAskQuestion?: boolean
  questionsRemaining?: number
  isPro?: boolean
  onUpgrade?: () => void
  checkoutError?: string | null
}

// Mic wave animation bars
function MicWave() {
  return (
    <div className="flex items-center gap-[3px] h-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="mic-wave-bar w-[3px] h-full rounded-full bg-white/80"
          style={{ transformOrigin: 'center' }}
        />
      ))}
    </div>
  )
}

export default memo(function InputArea({
  manualInput,
  onManualInputChange,
  onSubmit,
  onKeyDown,
  onScreenCapture,
  onToggleListening,
  isActive,
  isCapturing = false,
  screenCaptureError = null,
  transcriptionError = null,
  canScreenCapture,
  canAskQuestion,
  questionsRemaining,
  isPro,
  onUpgrade,
  checkoutError,
}: InputAreaProps) {
  return (
    <div className="p-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {screenCaptureError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{screenCaptureError}</span>
        </div>
      )}
      {transcriptionError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{transcriptionError}</span>
        </div>
      )}
      {checkoutError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{checkoutError}</span>
        </div>
      )}
      {canAskQuestion === false && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs text-amber-400 font-medium">Daily limit reached</span>
          <button
            onClick={onUpgrade}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Input container with glass effect */}
      <div
        className="flex items-center gap-1.5 rounded-2xl px-1.5 py-1.5 border transition-all duration-200"
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          borderColor: manualInput.trim() ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Screen capture button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={onScreenCapture}
            disabled={isCapturing || canScreenCapture === false}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              canScreenCapture === false
                ? 'text-white/15 cursor-not-allowed'
                : isCapturing
                  ? 'text-violet-400 animate-pulse cursor-wait'
                  : 'text-white/30 hover:text-violet-400 hover:bg-violet-500/10'
            }`}
            title={canScreenCapture === false ? 'Pro feature' : isCapturing ? 'Capturing...' : 'Capture Screen'}
          >
            {isCapturing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          {canScreenCapture === false && (
            <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded text-[8px] font-bold leading-none bg-violet-600 text-white">
              PRO
            </span>
          )}
        </div>

        {/* Text input */}
        <input
          type="text"
          value={manualInput}
          onChange={e => onManualInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a question..."
          className="flex-1 min-w-0 bg-transparent py-2 text-sm text-white placeholder-white/25 outline-none"
        />

        {/* Ask button */}
        <button
          onClick={onSubmit}
          disabled={!manualInput.trim()}
          className={`h-9 px-4 flex items-center gap-1.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
            manualInput.trim()
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-600/25 active:scale-95'
              : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
          }`}
        >
          Ask
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {isPro === false && questionsRemaining !== undefined && (
        <div className="text-center">
          <span className="text-xs text-white/25">
            {questionsRemaining === 0 ? 'No questions remaining today' : `${questionsRemaining}/10 questions remaining today`}
          </span>
        </div>
      )}

      {/* Listen button */}
      <button
        onClick={onToggleListening}
        className={`w-full h-[52px] flex items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/25'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 hover:shadow-xl hover:shadow-violet-600/35 hover:scale-[1.01] active:scale-[0.99]'
        }`}
        style={isActive ? { animation: 'pulse-red 2s infinite' } : undefined}
      >
        {isActive ? (
          <>
            <MicWave />
            <span>Stop Listening</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            <span>Start Listening</span>
          </>
        )}
      </button>
    </div>
  )
})
