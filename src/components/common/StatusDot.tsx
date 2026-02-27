import { memo } from 'react'

type StatusType = 'success' | 'error' | 'warning' | 'idle'

interface StatusDotProps {
  status: StatusType
  pulse?: boolean
  size?: 'sm' | 'md'
}

const statusColors: Record<StatusType, string> = {
  success: 'bg-emerald-400 shadow-sm shadow-emerald-400/50',
  error: 'bg-red-400 shadow-sm shadow-red-400/50',
  warning: 'bg-amber-400',
  idle: 'bg-white/20',
}

const sizeClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
}

export default memo(function StatusDot({ status, pulse, size = 'sm' }: StatusDotProps) {
  return (
    <span
      className={`
        ${sizeClasses[size]} rounded-full transition-all
        ${statusColors[status]}
        ${pulse ? 'animate-pulse' : ''}
      `.trim().replace(/\s+/g, ' ')}
    />
  )
})
