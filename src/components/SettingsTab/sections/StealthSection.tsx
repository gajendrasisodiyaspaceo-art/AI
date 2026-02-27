import { memo } from 'react'

interface StealthSectionProps {
  stealthMode: boolean
  onToggle: () => void
}

export default memo(function StealthSection({ stealthMode, onToggle }: StealthSectionProps) {
  return (
    <div className="flex items-center justify-between py-1 px-0.5">
      <div>
        <span className="text-sm font-medium text-white/90">Stealth Mode</span>
        <p className="text-xs text-slate-400 mt-0.5">Hide from screen recordings</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-9 h-[18px] rounded-full relative transition-all duration-300 flex-shrink-0 ${
          stealthMode
            ? 'bg-violet-600 shadow-sm shadow-violet-600/40'
            : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-[2px] w-3.5 h-3.5 rounded-full shadow-sm transition-all duration-300 ${
            stealthMode ? 'left-[18px] bg-white' : 'left-[2px] bg-white/40'
          }`}
        />
      </button>
    </div>
  )
})
