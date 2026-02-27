import { memo } from 'react'
import { Card } from '../../common'
import type { AIModel } from '../../../types'

interface OllamaInfoSectionProps {
  models: AIModel[]
  aiStatus: 'connected' | 'disconnected' | 'checking'
}

export default memo(function OllamaInfoSection({ models, aiStatus }: OllamaInfoSectionProps) {
  return (
    <Card>
      <p className="text-xs text-white/50 leading-relaxed">
        Ollama runs locally on your machine. Make sure Ollama is running at{' '}
        <span className="font-mono text-violet-400/70">localhost:11434</span>.
      </p>
      {models.length === 0 && aiStatus === 'connected' && (
        <p className="text-xs text-amber-400/70 mt-1.5">
          No models found. Pull a model with: <span className="font-mono">ollama pull llama3.2</span>
        </p>
      )}
    </Card>
  )
})
