import { type RefObject } from 'react'
import type { QAPair } from '../../types'
import ChatMessage from './ChatMessage'

interface ChatAreaProps {
  qaPairs: QAPair[]
  copiedId: string | null
  onCopy: (pair: QAPair) => void
  onRegenerate: (pair: QAPair) => void
  chatEndRef: RefObject<HTMLDivElement | null>
}

export default function ChatArea({ qaPairs, copiedId, onCopy, onRegenerate, chatEndRef }: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto scroll-smooth" style={{ padding: 'var(--sp-page)' }}>
      {qaPairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in" style={{ gap: '20px' }}>
          {/* Mic icon */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(109,40,217,0.10))',
              border: '1px solid rgba(139,92,246,0.20)',
              animation: 'pulse-glow 3s infinite',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>

          {/* Text */}
          <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p className="text-[18px] font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
              Ready to assist
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Tap the mic or type a question below
            </p>
          </div>

          {/* Suggestion pills */}
          <div className="flex flex-wrap justify-center" style={{ gap: '10px', marginTop: '4px' }}>
            <span
              className="text-[12px] cursor-default transition-colors duration-200 hover:text-[#ADADB0]"
              style={{
                color: 'var(--text-tertiary)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border-glass)',
              }}
            >
              Ask about your interview
            </span>
            <span
              className="text-[12px] cursor-default transition-colors duration-200 hover:text-[#ADADB0]"
              style={{
                color: 'var(--text-tertiary)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid var(--border-glass)',
              }}
            >
              Practice questions
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {qaPairs.map((pair, idx) => (
            <div key={pair.id}>
              {idx > 0 && (
                <div className="border-t border-white/[0.04] my-4" />
              )}
              <ChatMessage
                pair={pair}
                copiedId={copiedId}
                onCopy={onCopy}
                onRegenerate={onRegenerate}
              />
            </div>
          ))}
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  )
}
