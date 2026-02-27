import { memo } from 'react'

export default memo(function TitleBar() {
  return (
    <div className="drag-region flex items-center justify-between h-11 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/25">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-white/90">InterviewAI</span>
      </div>
      <div className="flex items-center gap-1.5 no-drag">
        <button
          onClick={() => window.electronAPI.minimize()}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/[0.08] text-white/30 hover:text-white/60 active:scale-90"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1.2" rx="0.6" />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI.close()}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/20 text-white/30 hover:text-red-400 active:scale-90"
          title="Close"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1.5" y1="1.5" x2="7.5" y2="7.5" />
            <line x1="7.5" y1="1.5" x2="1.5" y2="7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
})
