import { useState, useCallback, useEffect } from 'react'

interface UseStealthReturn {
  isStealthEnabled: boolean
  isMiniMode: boolean
  opacity: number
  enableStealth: () => Promise<void>
  disableStealth: () => Promise<void>
  toggleStealth: () => Promise<void>
  toggleMiniMode: () => Promise<void>
  setOpacity: (value: number) => Promise<void>
}

export function useStealth(): UseStealthReturn {
  const [isStealthEnabled, setIsStealthEnabled] = useState(false)
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [opacity, setOpacityState] = useState(1.0)

  const enableStealth = useCallback(async () => {
    await window.electronAPI.enableStealth()
    setIsStealthEnabled(true)
  }, [])

  const disableStealth = useCallback(async () => {
    await window.electronAPI.disableStealth()
    setIsStealthEnabled(false)
  }, [])

  const toggleStealth = useCallback(async () => {
    if (isStealthEnabled) {
      await disableStealth()
    } else {
      await enableStealth()
    }
  }, [isStealthEnabled, enableStealth, disableStealth])

  const toggleMiniMode = useCallback(async () => {
    const newValue = !isMiniMode
    await window.electronAPI.setMiniMode(newValue)
    setIsMiniMode(newValue)
  }, [isMiniMode])

  const setOpacity = useCallback(async (value: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, value))
    await window.electronAPI.setOpacity(clamped)
    setOpacityState(clamped)
  }, [])

  // Listen for keyboard shortcut events from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onShortcut((action: string) => {
      if (action === 'toggle-stealth') {
        if (isStealthEnabled) {
          disableStealth()
        } else {
          enableStealth()
        }
      } else if (action === 'toggle-mini') {
        toggleMiniMode()
      }
    })

    return cleanup
  }, [isStealthEnabled, enableStealth, disableStealth, toggleMiniMode])

  // Load initial state from settings
  useEffect(() => {
    window.electronAPI.getSettings().then((settings) => {
      setIsStealthEnabled(settings.stealthMode)
      setOpacityState(settings.opacity)
    })
  }, [])

  return {
    isStealthEnabled,
    isMiniMode,
    opacity,
    enableStealth,
    disableStealth,
    toggleStealth,
    toggleMiniMode,
    setOpacity,
  }
}
