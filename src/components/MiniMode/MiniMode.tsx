import { useState, memo } from 'react'

interface MiniModeProps {
  latestAnswer: string
  onCloseMiniMode: () => void
  onCopy: () => void
}

export default memo(function MiniMode({ latestAnswer, onCloseMiniMode, onCopy }: MiniModeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const displayText = latestAnswer || 'Waiting for answer...'

  return (
    <div
      className="h-full w-full flex flex-col app-shell rounded-lg overflow-hidden select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <svg width="6" height="6" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-white/40 tracking-wide">InterviewAI</span>
        </div>
        <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-0.5 rounded-md text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all"
            title="Copy answer"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onCloseMiniMode}
            className="text-xs px-2 py-0.5 rounded-md text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all font-medium"
            title="Exit mini mode"
          >
            Expand
          </button>
        </div>
      </div>

      {/* Answer content */}
      <div
        className="flex-1 px-2.5 py-2 overflow-y-auto text-xs leading-relaxed text-white/70"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {displayText}
      </div>
    </div>
  )
})
