import { memo } from 'react'
import { Select } from '../../common'

interface TranscriptionSectionProps {
  engine: 'webspeech' | 'whisper'
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const transcriptionOptions = [
  { value: 'webspeech', label: 'WebSpeech' },
  { value: 'whisper', label: 'Whisper (coming soon)', disabled: true },
]

export default memo(function TranscriptionSection({ engine, onChange }: TranscriptionSectionProps) {
  return (
    <Select
      label="TRANSCRIPTION ENGINE"
      value={engine}
      onChange={onChange}
      options={transcriptionOptions}
    />
  )
})
