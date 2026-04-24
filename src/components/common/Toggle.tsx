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
          <span className="text-[13px] font-medium text-white">{label}</span>
          {description && (
            <p className="text-[11px] text-[#6B6B70] mt-0.5">{description}</p>
          )}
        </div>
        <button
          onClick={onChange}
          className={`w-11 h-6 rounded-full relative transition-all duration-300 ${
            checked
              ? 'bg-[#8B5CF6]'
              : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
              checked ? 'left-[22px]' : 'left-[2px]'
            }`}
          />
        </button>
      </div>
    </div>
  )
})
