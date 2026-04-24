import { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, dialog, screen, systemPreferences, shell, session } from 'electron'
import path from 'path'
import fs from 'fs'

// Allow WebSpeech API to access audio in Electron's renderer
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Simple JSON file store (replaces electron-store which is ESM-only)
class JsonStore {
  private filePath: string
  private data: Record<string, unknown>

  constructor(defaults: Record<string, unknown>) {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'config.json')
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      const saved = JSON.parse(raw)
      // Deep merge: ensure new default keys (like groqApiKey) are added to existing config
      this.data = { ...defaults }
      for (const key of Object.keys(saved)) {
        if (
          typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key]) &&
          typeof this.data[key] === 'object' && this.data[key] !== null && !Array.isArray(this.data[key])
        ) {
          this.data[key] = { ...(this.data[key] as Record<string, unknown>), ...(saved[key] as Record<string, unknown>) }
        } else {
          this.data[key] = saved[key]
        }
      }
    } catch {
      this.data = { ...defaults }
    }
  }

  get(key: string): unknown {
    const keys = key.split('.')
    let val: unknown = this.data
    for (const k of keys) {
      if (val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[k]
      } else {
        return undefined
      }
    }
    return val
  }

  set(key: string, value: unknown): void {
    const keys = key.split('.')
    let obj: Record<string, unknown> = this.data
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
        obj[keys[i]] = {}
      }
      obj = obj[keys[i]] as Record<string, unknown>
    }
    obj[keys[keys.length - 1]] = value
    this.save()
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
    } catch {
      // Silent fail on write errors
    }
  }
}

let store: JsonStore

let mainWindow: BrowserWindow | null = null
let isMiniMode = false
let normalBounds = { width: 400, height: 600, x: 0, y: 0 }

const DIST = path.join(__dirname, '../dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: screenWidth - 420,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(DIST, 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-stealth')
  })
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-mini')
  })
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('shortcut', 'toggle-listening')
  })
}

function registerIPC() {
  // Settings
  ipcMain.handle('settings:get', () => {
    return store.get('settings')
  })

  ipcMain.handle('settings:set', (_, key: string, value: unknown) => {
    store.set(`settings.${key}`, value)
  })

  // Audio sources
  ipcMain.handle('audio:getSources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })
    return sources.map((s) => ({ id: s.id, name: s.name }))
  })

  // Screen capture
  ipcMain.handle('screen:capture', async () => {
    // Check macOS screen recording permission
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('screen')
      if (status === 'denied' || status === 'restricted') {
        return {
          success: false,
          error: 'screen-permission-denied',
          message: 'Screen recording permission required. Grant access in System Preferences > Privacy & Security > Screen Recording, then restart the app.'
        }
      }
    }

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      })
      if (sources.length > 0) {
        return { success: true, dataUrl: sources[0].thumbnail.toDataURL() }
      }
      return { success: false, error: 'no-sources', message: 'No screen sources found.' }
    } catch (err) {
      return {
        success: false,
        error: 'capture-failed',
        message: err instanceof Error ? err.message : 'Failed to capture screen.'
      }
    }
  })

  // Stealth mode
  ipcMain.handle('stealth:enable', () => {
    mainWindow?.setContentProtection(true)
    store.set('settings.stealthMode', true)
  })

  ipcMain.handle('stealth:disable', () => {
    mainWindow?.setContentProtection(false)
    store.set('settings.stealthMode', false)
  })

  ipcMain.handle('stealth:setMiniMode', (_, enabled: boolean) => {
    if (!mainWindow) return
    if (enabled && !isMiniMode) {
      const bounds = mainWindow.getBounds()
      normalBounds = { width: bounds.width, height: bounds.height, x: bounds.x, y: bounds.y }
      mainWindow.setSize(280, 120)
      mainWindow.setAlwaysOnTop(true, 'floating')
      isMiniMode = true
    } else if (!enabled && isMiniMode) {
      mainWindow.setBounds(normalBounds)
      isMiniMode = false
    }
  })

  ipcMain.handle('stealth:setOpacity', (_, opacity: number) => {
    mainWindow?.setOpacity(opacity)
  })

  // Sessions
  ipcMain.handle('session:create', () => {
    const session = {
      id: Date.now().toString(),
      startTime: Date.now(),
      qaPairs: [],
    }
    const sessions = (store.get('sessions') || []) as unknown[]
    sessions.push(session)
    store.set('sessions', sessions)
    return session
  })

  ipcMain.handle('session:end', (_, id: string) => {
    const sessions = (store.get('sessions') || []) as Array<{ id: string; endTime?: number }>
    const session = sessions.find((s) => s.id === id)
    if (session) {
      session.endTime = Date.now()
      store.set('sessions', sessions)
    }
    return session
  })

  ipcMain.handle('session:getAll', () => {
    return store.get('sessions') || []
  })

  ipcMain.handle('session:getById', (_, id: string) => {
    const sessions = (store.get('sessions') || []) as Array<{ id: string }>
    return sessions.find((s) => s.id === id) || null
  })

  ipcMain.handle('session:update', (_, session: { id: string }) => {
    const sessions = (store.get('sessions') || []) as Array<{ id: string }>
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx !== -1) {
      sessions[idx] = session
      store.set('sessions', sessions)
    }
  })

  // Resume
  ipcMain.handle('resume:upload', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      filters: [
        { name: 'Documents', extensions: ['pdf', 'txt'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return ''

    const filePath = result.filePaths[0]
    const ext = path.extname(filePath).toLowerCase()

    let text = ''
    if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf-8')
    } else if (ext === '.pdf') {
      try {
        const pdfParse = require('pdf-parse')
        const buffer = fs.readFileSync(filePath)
        const data = await pdfParse(buffer)
        text = data.text
      } catch {
        text = '[Error parsing PDF]'
      }
    }

    store.set('settings.resumeText', text)
    return text
  })

  ipcMain.handle('resume:get', () => {
    const settings = store.get('settings') as { resumeText?: string } | undefined
    return settings?.resumeText || ''
  })

  ipcMain.handle('resume:delete', () => {
    store.set('settings.resumeText', '')
  })

  // App controls
  ipcMain.on('app:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('app:close', () => {
    mainWindow?.close()
  })

  // Open external URL in default browser
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    try {
      await shell.openExternal(url)
    } catch (err) {
      console.error('[openExternal] Failed to open URL:', url, err)
    }
  })

  ipcMain.handle('app:getAvailableModels', async (_, provider?: string) => {
    if (provider === 'ollama') {
      try {
        const http = require('http')
        const data: Buffer[] = await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:11434/api/tags', (res: import('http').IncomingMessage) => {
            const chunks: Buffer[] = []
            res.on('data', (chunk: Buffer) => chunks.push(chunk))
            res.on('end', () => resolve(chunks))
            res.on('error', reject)
          })
          req.on('error', reject)
          req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
        })
        const body = JSON.parse(Buffer.concat(data).toString())
        if (body.models && Array.isArray(body.models)) {
          return body.models.map((m: { name: string }) => ({ name: m.name }))
        }
        return []
      } catch {
        return []
      }
    }
    return [
      { name: 'llama-3.3-70b-versatile' },
      { name: 'llama-3.1-8b-instant' },
      { name: 'mixtral-8x7b-32768' },
    ]
  })
}

async function requestPermissionsOnStartup() {
  if (process.platform !== 'darwin') return

  // Microphone — ask immediately if not granted
  const micStatus = systemPreferences.getMediaAccessStatus('microphone')
  if (micStatus === 'not-determined') {
    await systemPreferences.askForMediaAccess('microphone')
  }

  // Camera (needed for some Electron internals with WebSpeech)
  const camStatus = systemPreferences.getMediaAccessStatus('camera')
  if (camStatus === 'not-determined') {
    await systemPreferences.askForMediaAccess('camera')
  }

  // Screen recording — trigger the permission prompt by attempting a capture
  const screenStatus = systemPreferences.getMediaAccessStatus('screen')
  if (screenStatus === 'not-determined' || screenStatus === 'denied') {
    // Attempting getSources triggers macOS to show the Screen Recording prompt
    desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1, height: 1 },
    }).catch(() => {})
  }
}

app.whenReady().then(() => {
  store = new JsonStore({
    settings: {
      audioDevice: 'default',
      aiModel: 'llama-3.3-70b-versatile',
      groqApiKey: '',
      aiProvider: 'groq',
      transcriptionEngine: 'webspeech',
      stealthMode: false,
      autoCapture: false,
      autoCaptureInterval: 30,
      opacity: 1.0,
      resumeText: '',
      hasCompletedSetup: false,
    },
    sessions: [],
  })

  // Grant microphone + screen permissions so WebSpeech API works in Electron
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'screen']
    callback(allowed.includes(permission))
  })

  // Also handle permission checks (for already-granted permissions)
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'microphone', 'audioCapture', 'screen']
    return allowed.includes(permission)
  })

  createWindow()
  registerShortcuts()
  registerIPC()

  // Request OS-level permissions on startup so they're ready before the user needs them
  requestPermissionsOnStartup()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
