import { memo } from 'react'
import { StatusDot } from '../../common'
import type { AIProvider } from '../../../types'

interface AIStatusCardProps {
  aiStatus: 'connected' | 'disconnected' | 'checking'
  provider: AIProvider
}

const statusMap = {
  connected: { dot: 'success' as const, label: 'AI Connected' },
  disconnected: { dot: 'error' as const, label: 'Not Connected' },
  checking: { dot: 'warning' as const, label: 'Checking...' },
}

export default memo(function AIStatusCard({ aiStatus, provider }: AIStatusCardProps) {
  const { dot, label } = statusMap[aiStatus]
  const providerLabel = provider === 'groq' ? 'Using Groq Cloud' : 'Using Ollama Local'

  return (
    <div className="rounded-lg p-3" style={{ background: '#141417' }}>
      <div className="flex items-center gap-2.5">
        <StatusDot status={dot} size="md" pulse={aiStatus === 'checking'} />
        <div>
          <span className="text-[13px] font-medium text-white">{label}</span>
          <p className="text-[11px] text-[#6B6B70] mt-0.5">{providerLabel}</p>
        </div>
      </div>
    </div>
  )
})
