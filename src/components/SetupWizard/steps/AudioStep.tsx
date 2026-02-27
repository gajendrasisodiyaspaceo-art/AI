import { memo } from 'react'
import type { AudioDevice } from '../hooks/useSetupWizard'

interface AudioStepProps {
  audioDevices: AudioDevice[]
  selectedDevice: string
  onDeviceChange: (deviceId: string) => void
}

export default memo(function AudioStep({
  audioDevices,
  selectedDevice,
  onDeviceChange,
}: AudioStepProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-sm font-medium text-white/90">Audio Input</h2>
        <p className="text-sm text-white/45 mt-1 leading-relaxed">
          Select the microphone to capture interview audio.
        </p>
      </div>

      <div className="space-y-1.5">
        {audioDevices.length === 0 ? (
          <p className="text-xs text-white/35 p-3 surface rounded-xl">
            No audio devices found. Please connect a microphone.
          </p>
        ) : (
          audioDevices.map((device) => (
            <label
              key={device.deviceId}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                selectedDevice === device.deviceId
                  ? 'bg-violet-500/[0.08] border-violet-500/25'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedDevice === device.deviceId
                  ? 'border-violet-500'
                  : 'border-white/20'
              }`}>
                {selectedDevice === device.deviceId && (
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                )}
              </div>
              <span className="text-sm text-white/70 truncate">{device.label}</span>
              <input
                type="radio"
                name="audioDevice"
                value={device.deviceId}
                checked={selectedDevice === device.deviceId}
                onChange={(e) => onDeviceChange(e.target.value)}
                className="sr-only"
              />
            </label>
          ))
        )}
      </div>
    </div>
  )
})
