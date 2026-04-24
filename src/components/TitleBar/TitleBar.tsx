import { memo } from 'react'

export default memo(function TitleBar() {
  return (
    <div
      className="drag-region flex items-center justify-between flex-shrink-0"
      style={{
        height: '44px',
        paddingLeft: 'var(--sp-page)',
        paddingRight: 'var(--sp-page)',
        background: 'var(--bg-sidebar)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <span className="text-[13px] font-semibold text-white">InterviewAI</span>
      </div>
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.electronAPI.minimize()}
          className="flex items-center justify-center text-[#6B6B70] hover:text-[#ADADB0] hover:bg-white/[0.04] active:scale-90"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
          title="Minimize"
        >
          <span className="text-sm leading-none">—</span>
        </button>
        <button
          onClick={() => window.electronAPI.close()}
          className="flex items-center justify-center text-[#6B6B70] hover:text-red-400 hover:bg-red-500/[0.08] active:scale-90"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
          title="Close"
        >
          <span className="text-base leading-none">×</span>
        </button>
      </div>
    </div>
  )
})
