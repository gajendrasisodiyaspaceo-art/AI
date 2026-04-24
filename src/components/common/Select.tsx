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
        <label className="text-[10px] font-medium text-[#6B6B70] uppercase tracking-[1px] px-0.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full rounded-lg px-3.5 text-[13px] text-white outline-none
          focus:border-[#8B5CF6]/40 transition-colors cursor-pointer h-11
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-glass)' }}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-[11px] text-[#6B6B70] px-0.5">{helperText}</p>
      )}
    </div>
  )
})
