import { memo, useMemo } from 'react'
import { Select } from '../../common'
import type { AudioDevice } from '../hooks/useSettings'

interface AudioSectionProps {
  device: string
  devices: AudioDevice[]
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export default memo(function AudioSection({ device, devices, onChange }: AudioSectionProps) {
  const options = useMemo(() => [
    { value: 'default', label: 'Default Microphone' },
    ...devices.map(d => ({ value: d.deviceId, label: d.label })),
  ], [devices])

  return (
    <div>
      <Select
        label="AUDIO DEVICE"
        value={device}
        onChange={onChange}
        options={options}
      />
      <p className="mt-1 text-[10px] text-white/30">
        WebSpeech engine always uses the system default microphone.
      </p>
    </div>
  )
})
