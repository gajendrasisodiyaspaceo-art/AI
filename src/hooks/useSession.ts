import { useState, useCallback, useEffect } from 'react'
import type { Session, QAPair } from '@/types'

interface UseSessionReturn {
  currentSession: Session | null
  isActive: boolean
  sessions: Session[]
  startSession: () => Promise<void>
  endSession: () => Promise<void>
  addQAPair: (question: string, answer: string, source: QAPair['source']) => Promise<void>
  loadSessions: () => Promise<void>
}

export function useSession(): UseSessionReturn {
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])

  const loadSessions = useCallback(async () => {
    try {
      const allSessions = await window.electronAPI.getSessions()
      setSessions(allSessions)
    } catch {
      // Silently fail - sessions will be empty
    }
  }, [])

  const startSession = useCallback(async () => {
    try {
      const session = await window.electronAPI.createSession()
      setCurrentSession(session)
      setSessions((prev) => [...prev, session])
    } catch {
      // Failed to create session
    }
  }, [])

  const endSession = useCallback(async () => {
    if (!currentSession) return
    try {
      const ended = await window.electronAPI.endSession(currentSession.id)
      if (ended) {
        setCurrentSession(null)
        setSessions((prev) =>
          prev.map((s) => (s.id === ended.id ? ended : s))
        )
      }
    } catch {
      // Failed to end session
    }
  }, [currentSession])

  const addQAPair = useCallback(
    async (question: string, answer: string, source: QAPair['source']) => {
      if (!currentSession) return
      try {
        const newPair: QAPair = {
          id: Date.now().toString(),
          question,
          answer,
          timestamp: Date.now(),
          source,
        }
        const updated: Session = {
          ...currentSession,
          qaPairs: [...currentSession.qaPairs, newPair],
        }
        await window.electronAPI.updateSession(updated)
        setCurrentSession(updated)
        setSessions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        )
      } catch {
        // Failed to add Q&A pair
      }
    },
    [currentSession]
  )

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    currentSession,
    isActive: currentSession !== null && !currentSession.endTime,
    sessions,
    startSession,
    endSession,
    addQAPair,
    loadSessions,
  }
}
