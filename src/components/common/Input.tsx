import { forwardRef, memo, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  rightElement?: ReactNode
}

export default memo(
  forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, helperText, error, rightElement, className = '', ...rest },
    ref
  ) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-medium text-white/35 uppercase tracking-wider px-0.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-sm text-white
              placeholder-white/25 outline-none transition-colors
              ${error ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/[0.08] focus:border-violet-500/40'}
              ${rightElement ? 'pr-10' : ''}
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            {...rest}
          />
          {rightElement && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400/80 px-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-white/30 px-0.5">{helperText}</p>
        )}
      </div>
    )
  })
)
