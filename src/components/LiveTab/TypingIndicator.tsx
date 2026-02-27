import { memo } from 'react'

export default memo(function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      <span className="typing-dot w-1 h-1 rounded-full bg-violet-400/70" />
      <span className="typing-dot w-1 h-1 rounded-full bg-violet-400/70" />
      <span className="typing-dot w-1 h-1 rounded-full bg-violet-400/70" />
    </span>
  )
})
