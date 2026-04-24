import { memo } from 'react'

interface StealthSectionProps {
  stealthMode: boolean
  onToggle: () => void
}

export default memo(function StealthSection({ stealthMode, onToggle }: StealthSectionProps) {
  return (
    <div className="flex items-center justify-between py-1 px-0.5">
      <div>
        <span className="text-[13px] font-medium text-white">Stealth Mode</span>
        <p className="text-[11px] text-[#6B6B70] mt-0.5">Hide from screen recordings</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ${
          stealthMode
            ? 'bg-[#8B5CF6]'
            : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-[2px] w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
            stealthMode ? 'left-[22px] bg-white' : 'left-[2px] bg-white/40'
          }`}
        />
      </button>
    </div>
  )
})
