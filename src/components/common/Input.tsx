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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label
            className="font-medium uppercase"
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              paddingLeft: '2px',
            }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`input-field w-full outline-none ${error ? 'input-error' : ''} ${rightElement ? 'pr-10' : ''} ${className}`}
            style={{
              height: '44px',
              borderRadius: '12px',
              padding: '0 14px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              border: error
                ? '1px solid rgba(239, 68, 68, 0.35)'
                : '1px solid var(--border-glass)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            {...rest}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p style={{ fontSize: '11px', color: 'var(--danger)', paddingLeft: '2px' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p style={{ fontSize: '11px', color: 'var(--text-disabled)', paddingLeft: '2px' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  })
)
