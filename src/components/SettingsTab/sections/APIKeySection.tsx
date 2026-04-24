import { memo } from 'react'
import { Input } from '../../common'

interface APIKeySectionProps {
  apiKey: string
  showApiKey: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onToggleShow: () => void
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default memo(function APIKeySection({ apiKey, showApiKey, onChange, onToggleShow }: APIKeySectionProps) {
  return (
    <div className="space-y-1.5">
      <Input
        label="GROQ API KEY"
        type={showApiKey ? 'text' : 'password'}
        value={apiKey}
        onChange={onChange}
        placeholder="gsk_..."
        className="font-mono text-xs"
        rightElement={
          <button
            onClick={onToggleShow}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <EyeIcon open={showApiKey} />
          </button>
        }
      />
      <p className="text-[11px] text-[#4A4A4E] px-0.5">
        Free key from{' '}
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors"
          onClick={(e) => {
            e.preventDefault()
            window.open('https://console.groq.com', '_blank')
          }}
        >
          console.groq.com
        </a>
      </p>
    </div>
  )
})
