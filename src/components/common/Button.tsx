import { memo, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'gradient'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

export default memo(function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    borderRadius: '12px',
    fontWeight: 500,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    width: fullWidth ? '100%' : undefined,
  }

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '12px' },
    md: { height: '36px', padding: '0 16px', fontSize: '13px' },
    lg: { height: '44px', padding: '0 20px', fontSize: '14px' },
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--bg-surface)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-glass)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.06)',
      color: 'rgba(239, 68, 68, 0.8)',
      border: '1px solid rgba(239, 68, 68, 0.15)',
    },
    gradient: {
      background: 'linear-gradient(180deg, #9061F9, #7C3AED)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.30), 0 1px 2px rgba(0, 0, 0, 0.2)',
      fontWeight: 600,
    },
  }

  return (
    <button
      className={`${variant === 'primary' ? 'hover:bg-[#7C3AED]' : ''} ${variant === 'secondary' ? 'hover:bg-[#2A2A2E] hover:text-white' : ''} ${variant === 'danger' ? 'hover:bg-red-500/15 hover:text-red-400' : ''} active:scale-[0.98] ${className}`}
      disabled={disabled}
      style={{ ...baseStyle, ...sizeStyles[size], ...variantStyles[variant], ...style }}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
})
