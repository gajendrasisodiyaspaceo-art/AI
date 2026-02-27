import { memo, type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'gradient'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-600/20 rounded-2xl',
  secondary:
    'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white/80 rounded-2xl',
  danger:
    'bg-red-500/[0.06] hover:bg-red-500/15 border border-red-500/15 text-red-400/80 hover:text-red-400 rounded-2xl',
  gradient:
    'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-600/25 rounded-2xl',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-5 py-3',
}

export default memo(function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium transition-all
        disabled:opacity-30 disabled:cursor-not-allowed
        flex items-center justify-center gap-1.5
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
})
