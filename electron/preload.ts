import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),

  // Audio
  getAudioSources: () => ipcRenderer.invoke('audio:getSources'),

  // Screen capture
  captureScreen: () => ipcRenderer.invoke('screen:capture'),

  // Stealth
  enableStealth: () => ipcRenderer.invoke('stealth:enable'),
  disableStealth: () => ipcRenderer.invoke('stealth:disable'),
  setMiniMode: (enabled: boolean) => ipcRenderer.invoke('stealth:setMiniMode', enabled),
  setOpacity: (opacity: number) => ipcRenderer.invoke('stealth:setOpacity', opacity),

  // Sessions
  createSession: () => ipcRenderer.invoke('session:create'),
  endSession: (id: string) => ipcRenderer.invoke('session:end', id),
  getSessions: () => ipcRenderer.invoke('session:getAll'),
  getSession: (id: string) => ipcRenderer.invoke('session:getById', id),
  updateSession: (session: unknown) => ipcRenderer.invoke('session:update', session),

  // Resume
  uploadResume: () => ipcRenderer.invoke('resume:upload'),
  getResume: () => ipcRenderer.invoke('resume:get'),
  deleteResume: () => ipcRenderer.invoke('resume:delete'),

  // App controls
  minimize: () => ipcRenderer.send('app:minimize'),
  close: () => ipcRenderer.send('app:close'),
  getAvailableModels: (provider?: string) => ipcRenderer.invoke('app:getAvailableModels', provider),

  // External URLs
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Shortcuts
  onShortcut: (callback: (action: string) => void) => {
    const handler = (_: unknown, action: string) => callback(action)
    ipcRenderer.on('shortcut', handler)
    return () => {
      ipcRenderer.removeListener('shortcut', handler)
    }
  },
})
