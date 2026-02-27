import { memo, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  helperText?: string
}

export default memo(function Select({
  label,
  options,
  helperText,
  className = '',
  ...rest
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-white/35 uppercase tracking-wider px-0.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5
          text-sm text-white/90 outline-none focus:border-violet-500/40
          transition-colors cursor-pointer h-10
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-xs text-white/30 px-0.5">{helperText}</p>
      )}
    </div>
  )
})
