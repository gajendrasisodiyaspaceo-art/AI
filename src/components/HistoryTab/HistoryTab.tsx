import { useState, useEffect, useCallback } from 'react'
import { Spinner } from '../common'
import type { Session } from '../../types'

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(start: number, end?: number): string {
  const ms = (end || Date.now()) - start
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (minutes < 1) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

export default function HistoryTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await window.electronAPI.getSessions()
        const sorted = [...data].sort((a, b) => b.startTime - a.startTime)
        setSessions(sorted)
      } catch {
        // Failed to load
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }, [])

  const handleDelete = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation()
      try {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
          await window.electronAPI.updateSession({ ...session, endTime: -1 })
        }
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (expandedId === sessionId) setExpandedId(null)
      } catch {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      }
    },
    [sessions, expandedId]
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="sm" label="Loading sessions..." />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="h-full overflow-y-auto" style={{ padding: 'var(--sp-page)' }}>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-14 h-14 rounded-full bg-[#1F1F23] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#4A4A4E]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[13px] text-[#6B6B70]">No sessions yet</p>
            <p className="text-[11px] text-[#4A4A4E] mt-0.5">Start an interview to see history here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" style={{ padding: 'var(--sp-page)' }}>
      {sessions.map(session => {
        const isExpanded = expandedId === session.id
        const questionCount = session.qaPairs?.length || 0

        return (
          <div key={session.id} className="animate-fade-in border-b border-[#2A2A2E] last:border-b-0">
            {/* Session card header */}
            <button
              onClick={() => toggleExpand(session.id)}
              className="w-full py-3.5 px-0 text-left hover:bg-[#1F1F23]/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-white truncate">
                    {formatDate(session.startTime)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B6B70]">
                    <span className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDuration(session.startTime, session.endTime)}
                    </span>
                    <span className="text-[#4A4A4E]">&middot;</span>
                    <span>{questionCount} {questionCount === 1 ? 'question' : 'questions'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => handleDelete(e, session.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A4A4E] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete session"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`text-[#6B6B70] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded Q&A pairs */}
            {isExpanded && session.qaPairs && session.qaPairs.length > 0 && (
              <div className="mb-3 ml-3 space-y-1.5 border-l-2 border-[#2A2A2E] pl-3">
                {session.qaPairs.map((pair, idx) => (
                  <div key={pair.id || idx} className="space-y-1 animate-fade-in">
                    <div className="text-xs text-[#ADADB0] rounded-lg px-2.5 py-1.5 border border-[#2A2A2E]" style={{ background: '#1F1F23' }}>
                      <span className="text-[#8B5CF6] text-[10px] uppercase tracking-[1px] font-medium">Q</span>
                      <p className="mt-0.5">{pair.question}</p>
                    </div>
                    <div className="text-xs text-[#8B8B90] rounded-lg px-2.5 py-1.5 border border-[#2A2A2E]" style={{ background: '#141417' }}>
                      <span className="text-[#8B5CF6] text-[10px] uppercase tracking-[1px] font-medium">A</span>
                      <p className="mt-0.5">
                        {pair.answer.length > 200
                          ? pair.answer.slice(0, 200) + '...'
                          : pair.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && (!session.qaPairs || session.qaPairs.length === 0) && (
              <div className="mb-3 ml-3 border-l-2 border-[#2A2A2E] pl-3 py-2 text-xs text-[#4A4A4E]">
                No questions recorded in this session
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
