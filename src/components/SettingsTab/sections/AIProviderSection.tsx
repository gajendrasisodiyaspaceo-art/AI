import { memo } from 'react'
import { Select } from '../../common'
import type { AIProvider } from '../../../types'

interface AIProviderSectionProps {
  provider: AIProvider
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const providerOptions = [
  { value: 'groq', label: 'Groq Cloud' },
  { value: 'ollama', label: 'Ollama Local' },
]

export default memo(function AIProviderSection({ provider, onChange }: AIProviderSectionProps) {
  return (
    <Select
      label="AI PROVIDER"
      value={provider}
      onChange={onChange}
      options={providerOptions}
    />
  )
})
