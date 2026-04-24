import { memo } from 'react'
import { Select } from '../../common'

interface TranscriptionSectionProps {
  engine: 'webspeech' | 'whisper'
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const transcriptionOptions = [
  { value: 'webspeech', label: 'WebSpeech (browser built-in)' },
  { value: 'whisper', label: 'Whisper (via Groq — requires API key)' },
]

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export default memo(function TranscriptionSection({ engine, onChange }: TranscriptionSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Select
        label="TRANSCRIPTION ENGINE"
        value={engine}
        onChange={onChange}
        options={transcriptionOptions}
      />
      {isElectron && engine === 'webspeech' && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.15)',
          fontSize: '11px',
          color: '#f59e0b',
          lineHeight: '1.5',
        }}>
          ⚠️ WebSpeech requires a code-signed build to work on macOS. Switch to <strong>Whisper</strong> for reliable listening in this app.
        </div>
      )}
      {engine === 'whisper' && (
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.15)',
          fontSize: '11px',
          color: '#a78bfa',
          lineHeight: '1.5',
        }}>
          ✓ Whisper uses your Groq API key. Audio is sent in 5-second chunks for transcription.
        </div>
      )}
    </div>
  )
})
