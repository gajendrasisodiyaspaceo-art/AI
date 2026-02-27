import { memo } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
}

export default memo(function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="surface rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white/80">{label}</span>
          {description && (
            <p className="text-xs text-white/35 mt-0.5">{description}</p>
          )}
        </div>
        <button
          onClick={onChange}
          className={`w-9 h-5 rounded-full relative transition-all duration-300 ${
            checked
              ? 'bg-violet-600 shadow-sm shadow-violet-600/40'
              : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${
              checked ? 'left-[17px]' : 'left-[3px]'
            }`}
          />
        </button>
      </div>
    </div>
  )
})
