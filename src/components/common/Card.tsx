import { memo, type HTMLAttributes, type ReactNode } from 'react'

type CardVariant = 'surface' | 'glass'
type CardPadding = 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  children: ReactNode
}

const paddingClasses: Record<CardPadding, string> = {
  sm: 'p-2.5',
  md: 'p-3',
  lg: 'p-4',
}

export default memo(function Card({
  variant = 'surface',
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-lg ${paddingClasses[padding]} ${className}`.trim()}
      style={{ background: '#141417' }}
      {...rest}
    >
      {children}
    </div>
  )
})
