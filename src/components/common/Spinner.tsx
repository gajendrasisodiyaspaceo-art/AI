import { memo } from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md'
  label?: string
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
}

export default memo(function Spinner({ size = 'sm', label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-violet-500 border-t-transparent animate-spin`}
      />
      {label && <span className="text-xs text-white/40">{label}</span>}
    </div>
  )
})
