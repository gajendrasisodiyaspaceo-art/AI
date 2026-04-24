import { memo } from 'react'
import type { QAPair } from '../../types'
import MessageContent from './MessageContent'
import TypingIndicator from './TypingIndicator'

interface ChatMessageProps {
  pair: QAPair
  copiedId: string | null
  onCopy: (pair: QAPair) => void
  onRegenerate: (pair: QAPair) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// AI avatar icon
function AIAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#8B5CF6] flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )
}

// User avatar icon
function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1F1F23] border border-[#2A2A2E] flex items-center justify-center flex-shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ADADB0" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  )
}

export default memo(function ChatMessage({ pair, copiedId, onCopy, onRegenerate }: ChatMessageProps) {
  return (
    <div className="space-y-3 animate-fade-in chat-bubble-group">
      {/* User question — right aligned */}
      <div className="flex items-end gap-2 justify-end">
        <div className="max-w-[85%]">
          <div
            className="bg-[#8B5CF6] text-white rounded-2xl rounded-br-md px-4 py-3 text-[13px]"
          >
            <p className="leading-relaxed">{pair.question}</p>
          </div>
          <div className="flex justify-end mt-1 pr-1">
            <span className="text-[11px] text-[#4A4A4E]">{formatTime(pair.timestamp)}</span>
          </div>
        </div>
        <UserAvatar />
      </div>

      {/* AI answer — left aligned */}
      <div className="flex items-end gap-2 justify-start">
        <AIAvatar />
        <div className="max-w-[85%]">
          <div
            className="rounded-2xl rounded-bl-md px-4 py-3 text-[13px] text-[#ADADB0] border border-[#2A2A2E]"
            style={{ background: '#1F1F23' }}
          >
            {pair.isStreaming && !pair.answer ? (
              <TypingIndicator />
            ) : pair.answer.startsWith('Error:') ? (
              <div className="flex items-start gap-2 text-red-400/80">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-sm leading-relaxed">{pair.answer}</span>
              </div>
            ) : (
              <div className="leading-relaxed">
                <MessageContent text={pair.answer} />
              </div>
            )}
          </div>
          {/* Timestamp + action buttons (hover only) */}
          <div className="flex items-center gap-2 mt-1 pl-1">
            <span className="text-[11px] text-[#4A4A4E]">{formatTime(pair.timestamp)}</span>
            {!pair.isStreaming && pair.answer && !pair.answer.startsWith('Error:') && (
              <div className="chat-actions flex items-center gap-0.5">
                <button
                  onClick={() => onCopy(pair)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[#6B6B70] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                  title="Copy answer"
                >
                  {copiedId === pair.id ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onRegenerate(pair)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[#6B6B70] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                  title="Regenerate answer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}, (prev, next) =>
  prev.pair.id === next.pair.id &&
  prev.pair.answer === next.pair.answer &&
  prev.pair.isStreaming === next.pair.isStreaming &&
  prev.copiedId === next.copiedId
)
