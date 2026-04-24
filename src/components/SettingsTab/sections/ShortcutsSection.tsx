import { memo } from 'react'

const shortcuts = [
  ['Toggle Listening', 'Cmd+Shift+S'],
  ['Toggle Stealth', 'Cmd+Shift+H'],
  ['Mini Mode', 'Cmd+Shift+M'],
  ['Screen Capture', 'Cmd+Shift+C'],
]

export default memo(function ShortcutsSection() {
  return (
    <div className="space-y-3">
      <span className="text-[13px] font-semibold text-white">Keyboard Shortcuts</span>
      <div className="space-y-2">
        {shortcuts.map(([label, shortcut]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-[#ADADB0]">{label}</span>
            <span className="text-[11px] font-medium text-[#6B6B70]">{shortcut}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
