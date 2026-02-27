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

export class TranscriptionService {
  private recognition: InstanceType<SpeechRecognitionType & (new () => unknown)> | null = null
  private callbacks: TranscriptionCallbacks | null = null
  private shouldBeListening = false

  async start(callbacks: TranscriptionCallbacks): Promise<boolean> {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      callbacks.onError('Speech recognition is not supported in this browser')
      return false
    }

    this.callbacks = callbacks
    this.shouldBeListening = true

    // Await microphone permission before starting recognition
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
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
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }
      this.callbacks?.onError(event.error)
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
