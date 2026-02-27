import { memo, useMemo } from 'react'
import { Select } from '../../common'
import type { AIModel } from '../../../types'

interface AIModelSectionProps {
  model: string
  models: AIModel[]
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export default memo(function AIModelSection({ model, models, onChange }: AIModelSectionProps) {
  const options = useMemo(() => {
    if (models.length === 0) {
      return [{ value: '', label: 'No models available', disabled: true }]
    }
    return models.map(m => ({ value: m.name, label: m.name }))
  }, [models])

  return (
    <Select
      label="AI MODEL"
      value={model}
      onChange={onChange}
      options={options}
    />
  )
})
