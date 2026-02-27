import { memo } from 'react'
import { Card } from '../../common'

const shortcuts = [
  ['Toggle Listening', 'Cmd+Shift+S'],
  ['Toggle Stealth', 'Cmd+Shift+H'],
  ['Mini Mode', 'Cmd+Shift+M'],
  ['Screen Capture', 'Cmd+Shift+C'],
]

export default memo(function ShortcutsSection() {
  return (
    <Card className="space-y-2">
      <span className="text-xs font-medium text-white/70">Keyboard Shortcuts</span>
      <div className="text-xs space-y-1.5">
        {shortcuts.map(([label, shortcut]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-white/40">{label}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/60 font-mono text-xs">
              {shortcut}
            </kbd>
          </div>
        ))}
      </div>
    </Card>
  )
})
