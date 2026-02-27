import { memo } from 'react'

interface OpacitySectionProps {
  opacity: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default memo(function OpacitySection({ opacity, onChange }: OpacitySectionProps) {
  const percent = Math.round(opacity * 100)
  const fillPercent = ((opacity - 0.3) / 0.7) * 100

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-xs font-medium text-white/35 uppercase tracking-wider">
          Opacity
        </label>
        <span className="text-xs font-medium text-white/90">{percent}%</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.05"
          value={opacity}
          onChange={onChange}
          className="w-full opacity-slider"
        />
        {/* Gradient fill overlay */}
        <div
          className="absolute top-1/2 left-0 h-1.5 rounded-full pointer-events-none -translate-y-1/2 bg-gradient-to-r from-violet-500 to-indigo-500"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  )
})
