interface TranscriptionCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onError: (error: string) => void
}

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown

function getSpeechRecognition(): SpeechRecognitionType | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

// Errors that should NOT trigger auto-restart
const FATAL_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'language-not-supported',
])

// ─── WebSpeech Transcription ─────────────────────────────────────────────────

export class TranscriptionService {
  private recognition: InstanceType<SpeechRecognitionType & (new () => unknown)> | null = null
  private callbacks: TranscriptionCallbacks | null = null
  private shouldBeListening = false
  private consecutiveErrors = 0
  private maxRetries = 5
  private permissionStream: MediaStream | null = null

  async start(callbacks: TranscriptionCallbacks): Promise<boolean> {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      callbacks.onError('Speech recognition is not supported in this browser')
      return false
    }

    this.callbacks = callbacks
    this.shouldBeListening = true
    this.consecutiveErrors = 0

    // Open mic via getUserMedia and KEEP the stream alive while WebSpeech is running.
    // Electron blocks WebSpeech audio-capture if no active getUserMedia stream exists.
    try {
      this.permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      callbacks.onError('Microphone permission denied. Grant access in System Preferences > Privacy & Security > Microphone.')
      this.shouldBeListening = false
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition = new (SpeechRecognition as any)()
    const recognition = this.recognition as any

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      // Reset error counter on successful result
      this.consecutiveErrors = 0

      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.callbacks?.onResult(finalTranscript, true)
      }
      if (interimTranscript) {
        this.callbacks?.onResult(interimTranscript, false)
      }
    }

    recognition.onerror = (event: any) => {
      // Benign errors — ignore silently
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }

      // Fatal errors — stop retrying
      if (FATAL_ERRORS.has(event.error)) {
        this.shouldBeListening = false
        this.callbacks?.onError(event.error)
        return
      }

      // audio-capture in Electron = WebSpeech blocked by OS (unsigned app)
      if (event.error === 'audio-capture') {
        this.consecutiveErrors++
        if (this.consecutiveErrors >= this.maxRetries) {
          this.shouldBeListening = false
          this.callbacks?.onError(
            'WebSpeech is not supported in this build. Go to Settings → Transcription Engine → switch to Whisper (requires Groq API key).'
          )
        }
        return
      }

      // Transient errors (network, etc.) — allow retry but track count
      this.consecutiveErrors++
      if (this.consecutiveErrors >= this.maxRetries) {
        this.shouldBeListening = false
        this.callbacks?.onError(`Speech recognition failed after ${this.maxRetries} retries: ${event.error}`)
      } else {
        this.callbacks?.onError(event.error)
      }
    }

    recognition.onend = () => {
      if (this.shouldBeListening) {
        try {
          recognition.start()
        } catch {
          // Already started, ignore
        }
      }
    }

    try {
      recognition.start()
      return true
    } catch {
      callbacks.onError('Failed to start speech recognition')
      return false
    }
  }

  stop(): void {
    this.shouldBeListening = false
    if (this.recognition) {
      try {
        (this.recognition as any).stop()
      } catch {
        // Already stopped
      }
      this.recognition = null
    }
    // Release the permission stream
    if (this.permissionStream) {
      this.permissionStream.getTracks().forEach((t) => t.stop())
      this.permissionStream = null
    }
    this.callbacks = null
  }

  async restart(): Promise<void> {
    if (this.callbacks) {
      const callbacks = this.callbacks
      this.stop()
      await this.start(callbacks)
    }
  }

  get isListening(): boolean {
    return this.shouldBeListening
  }
}

export const transcriptionService = new TranscriptionService()

// ─── Whisper Transcription (via Groq audio API) ───────────────────────────────

const WHISPER_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3'
const CHUNK_INTERVAL_MS = 5000 // send a chunk every 5 seconds

export class WhisperTranscriptionService {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private callbacks: TranscriptionCallbacks | null = null
  private shouldBeListening = false
  private chunkTimer: ReturnType<typeof setTimeout> | null = null
  private apiKey: string
  private deviceId?: string

  constructor(apiKey: string, deviceId?: string) {
    this.apiKey = apiKey
    this.deviceId = deviceId
  }

  async start(callbacks: TranscriptionCallbacks): Promise<boolean> {
    if (!this.apiKey) {
      callbacks.onError('Groq API key is required for Whisper transcription. Add it in Settings.')
      return false
    }

    try {
      const audioConstraints: MediaTrackConstraints = this.deviceId && this.deviceId !== 'default'
        ? { deviceId: { exact: this.deviceId } }
        : true as unknown as MediaTrackConstraints
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
    } catch {
      callbacks.onError('Microphone permission denied. Grant access in System Preferences > Privacy & Security > Microphone.')
      return false
    }

    this.callbacks = callbacks
    this.shouldBeListening = true
    this.chunks = []

    // Pick a supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : ''

    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined)

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.onstop = async () => {
      if (this.chunks.length === 0) return

      const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' })
      this.chunks = []

      await this.transcribeChunk(blob)

      // Schedule next chunk if still listening
      if (this.shouldBeListening) {
        this.startChunk()
      }
    }

    this.startChunk()
    return true
  }

  private startChunk(): void {
    if (!this.mediaRecorder || !this.shouldBeListening) return

    try {
      this.mediaRecorder.start()
    } catch {
      // Already recording
      return
    }

    this.chunkTimer = setTimeout(() => {
      if (this.mediaRecorder?.state === 'recording') {
        this.mediaRecorder.stop()
      }
    }, CHUNK_INTERVAL_MS)
  }

  private async transcribeChunk(blob: Blob): Promise<void> {
    if (!this.callbacks) return

    try {
      const formData = new FormData()
      // Groq requires the file to have an audio extension
      formData.append('file', blob, 'audio.webm')
      formData.append('model', WHISPER_MODEL)
      formData.append('response_format', 'text')
      formData.append('language', 'en')

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.callbacks?.onError('Invalid Groq API key. Check Settings.')
          return
        }
        if (response.status === 429) {
          this.callbacks?.onError('Whisper rate limit hit. Retrying next chunk...')
          return
        }
        const text = await response.text()
        this.callbacks?.onError(`Whisper API error ${response.status}: ${text}`)
        return
      }

      const text = (await response.text()).trim()
      if (text) {
        this.callbacks?.onResult(text, true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Whisper transcription failed'
      this.callbacks?.onError(message)
    }
  }

  stop(): void {
    this.shouldBeListening = false

    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer)
      this.chunkTimer = null
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {
        // Already stopped
      }
    }

    this.stream?.getTracks().forEach((t) => t.stop())
    this.mediaRecorder = null
    this.stream = null
    this.chunks = []
    this.callbacks = null
  }

  get isListening(): boolean {
    return this.shouldBeListening
  }
}
