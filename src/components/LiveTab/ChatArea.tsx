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
    <div className={`flex-1 overflow-y-auto scroll-smooth ${qaPairs.length === 0 ? 'p-5' : 'p-4'}`}>
      {qaPairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center" style={{ animation: 'pulse-glow 3s infinite' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#emptyGrad)" strokeWidth="1.5">
              <defs>
                <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-white/70">Ready to assist</p>
            <p className="text-xs text-white/40 leading-relaxed">Start listening or type a question below</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1 px-4">
            <span className="text-[11px] text-white/25 px-2.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]">Ask about your interview</span>
            <span className="text-[11px] text-white/25 px-2.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]">Practice questions</span>
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
