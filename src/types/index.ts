export type AIProvider = 'groq' | 'ollama'

export interface QAPair {
  id: string
  question: string
  answer: string
  timestamp: number
  source: 'audio' | 'manual' | 'ocr'
  isStreaming?: boolean
}

export interface Session {
  id: string
  startTime: number
  endTime?: number
  qaPairs: QAPair[]
  summary?: string
}

export interface Settings {
  audioDevice: string
  aiModel: string
  groqApiKey: string
  aiProvider: AIProvider
  transcriptionEngine: 'webspeech' | 'whisper'
  stealthMode: boolean
  autoCapture: boolean
  autoCaptureInterval: number
  opacity: number
  resumeText: string
  hasCompletedSetup: boolean
}

export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence: number
}

export interface AIResponse {
  text: string
  done: boolean
  model: string
  error?: string
}

export interface AIModel {
  name: string
}

export interface OCRResult {
  text: string
  isCodingProblem: boolean
  confidence: number
}

export interface ScreenCaptureResult {
  success: boolean
  dataUrl?: string
  error?: string
  message?: string
}

export interface ElectronAPI {
  // Settings
  getSettings: () => Promise<Settings>
  setSetting: (key: string, value: unknown) => Promise<void>

  // Audio
  getAudioSources: () => Promise<Array<{ id: string; name: string }>>

  // Screen capture
  captureScreen: () => Promise<ScreenCaptureResult>

  // Stealth
  enableStealth: () => Promise<void>
  disableStealth: () => Promise<void>
  setMiniMode: (enabled: boolean) => Promise<void>
  setOpacity: (opacity: number) => Promise<void>

  // Sessions
  createSession: () => Promise<Session>
  endSession: (id: string) => Promise<Session>
  getSessions: () => Promise<Session[]>
  getSession: (id: string) => Promise<Session | null>
  updateSession: (session: Session) => Promise<void>

  // Resume
  uploadResume: () => Promise<string>
  getResume: () => Promise<string>
  deleteResume: () => Promise<void>

  // App
  minimize: () => void
  close: () => void
  getAvailableModels: (provider?: AIProvider) => Promise<AIModel[]>

  // External URLs
  openExternal: (url: string) => Promise<void>

  // Window
  onShortcut: (callback: (action: string) => void) => () => void
}

export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired'

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  stripeCustomerId: string | null
}

export interface UserSubscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface DailyUsage {
  questionCount: number
  date: string
}

export const PLAN_LIMITS = {
  free: {
    dailyQuestions: 10,
    ocrEnabled: false,
    screenCaptureEnabled: false,
  },
  pro: {
    dailyQuestions: Infinity,
    ocrEnabled: true,
    screenCaptureEnabled: true,
  },
} as const

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
