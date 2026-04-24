import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing'

const WHISPER_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3'
const MAX_RECORDING_MS = 120_000 // 2 min auto-stop
const LIVE_UPDATE_INTERVAL_MS = 4_000 // send audio to Whisper every 4s for live text
const WEBSPEECH_MAX_RESTARTS = 5
const WEBSPEECH_RESTART_DELAY_MS = 300

interface UseVoiceInputOptions {
  engine?: 'webspeech' | 'whisper'
  apiKey?: string
  deviceId?: string
  onTranscript: (text: string) => void
  onReplace?: (text: string) => void
}

interface UseVoiceInputReturn {
  voiceState: VoiceState
  error: string | null
  toggleVoice: () => void
}

function getSpeechRecognition(): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

export function useVoiceInput({
  engine = 'webspeech',
  apiKey,
  deviceId,
  onTranscript,
  onReplace,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [error, setError] = useState<string | null>(null)

  const stateRef = useRef<VoiceState>('idle')
  const onTranscriptRef = useRef(onTranscript)
  const onReplaceRef = useRef(onReplace)
  onTranscriptRef.current = onTranscript
  onReplaceRef.current = onReplace

  const engineRef = useRef(engine)
  const apiKeyRef = useRef(apiKey)
  const deviceIdRef = useRef(deviceId)
  engineRef.current = engine
  apiKeyRef.current = apiKey
  deviceIdRef.current = deviceId

  const recognitionRef = useRef<unknown>(null)
  const permStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restartCountRef = useRef(0)
  const finalTextRef = useRef('')
  const isSendingRef = useRef(false)

  const stopRef = useRef<() => Promise<void>>(async () => {})

  const updateState = useCallback((s: VoiceState) => {
    stateRef.current = s
    setVoiceState(s)
  }, [])

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (liveTimerRef.current) { clearInterval(liveTimerRef.current); liveTimerRef.current = null }
    if (recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (recognitionRef.current as any).stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }
    if (permStreamRef.current) {
      permStreamRef.current.getTracks().forEach(t => t.stop())
      permStreamRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop() } catch { /* already stopped */ }
    }
    recorderRef.current = null
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop())
      audioStreamRef.current = null
    }
    chunksRef.current = []
    restartCountRef.current = 0
    finalTextRef.current = ''
    isSendingRef.current = false
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  /** Send ALL accumulated audio to Whisper and replace input text with result */
  const transcribeAudio = useCallback(async (blobs: Blob[], mimeType: string, key: string): Promise<string | null> => {
    if (blobs.length === 0) return null
    const blob = new Blob(blobs, { type: mimeType || 'audio/webm' })
    if (blob.size < 5000) return null // too short

    const fd = new FormData()
    fd.append('file', blob, 'audio.webm')
    fd.append('model', WHISPER_MODEL)
    fd.append('response_format', 'text')
    fd.append('language', 'en')

    const resp = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    })

    if (!resp.ok) {
      if (resp.status === 401) throw new Error('Invalid Groq API key')
      if (resp.status === 429 || resp.status === 400) return null // skip silently
      throw new Error(`Whisper error: ${resp.status}`)
    }

    return (await resp.text()).trim() || null
  }, [])

  const toggleVoice = useCallback(async () => {
    if (stateRef.current === 'processing') return

    if (stateRef.current === 'listening') {
      await stopRef.current()
      return
    }

    setError(null)
    const eng = engineRef.current
    const key = apiKeyRef.current
    const devId = deviceIdRef.current

    if (eng === 'whisper') {
      // ── Whisper: growing-window live transcription ──
      if (!key) {
        setError('Groq API key required for Whisper. Add it in Settings.')
        return
      }

      chunksRef.current = []

      let stream: MediaStream
      try {
        const constraints: MediaTrackConstraints =
          devId && devId !== 'default'
            ? { deviceId: { exact: devId } }
            : (true as unknown as MediaTrackConstraints)
        stream = await navigator.mediaDevices.getUserMedia({ audio: constraints })
      } catch {
        setError('Microphone permission denied')
        return
      }
      audioStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorderRef.current = recorder

      // Growing-window: send ALL accumulated audio every 4s for live updates
      const sendLiveUpdate = async () => {
        if (isSendingRef.current || stateRef.current !== 'listening') return
        // Copy all chunks (don't clear — growing window)
        const allChunks = [...chunksRef.current]
        if (allChunks.length === 0) return

        isSendingRef.current = true
        try {
          const text = await transcribeAudio(allChunks, recorder.mimeType || mimeType, key)
          if (text && stateRef.current === 'listening' && onReplaceRef.current) {
            onReplaceRef.current(text)
          }
        } catch {
          // Silently skip live update errors — final send on stop will be accurate
        } finally {
          isSendingRef.current = false
        }
      }

      stopRef.current = async () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
        if (liveTimerRef.current) { clearInterval(liveTimerRef.current); liveTimerRef.current = null }
        updateState('processing')

        const rec = recorderRef.current
        if (rec && rec.state !== 'inactive') {
          await Promise.race([
            new Promise<void>(resolve => { rec.onstop = () => resolve(); rec.stop() }),
            new Promise<void>(resolve => setTimeout(resolve, 5000)),
          ])
        }

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop())
          audioStreamRef.current = null
        }

        // Final send: complete audio for most accurate transcription
        const allChunks = [...chunksRef.current]
        chunksRef.current = []
        recorderRef.current = null

        if (allChunks.length > 0) {
          try {
            const text = await transcribeAudio(allChunks, rec?.mimeType || mimeType, key)
            if (text) {
              if (onReplaceRef.current) onReplaceRef.current(text)
              else onTranscriptRef.current(text)
            } else {
              setError('No speech detected')
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Transcription failed')
          }
        } else {
          setError('No audio recorded')
        }

        updateState('idle')
      }

      recorder.start(1000) // collect data every 1s
      updateState('listening')
      timerRef.current = setTimeout(() => stopRef.current(), MAX_RECORDING_MS)

      // Start live updates every 4 seconds
      liveTimerRef.current = setInterval(sendLiveUpdate, LIVE_UPDATE_INTERVAL_MS)

    } else {
      // ── WebSpeech: fallback for when no API key ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = getSpeechRecognition() as any
      if (!SR) {
        setError('Speech recognition not supported. Add Groq API key in Settings for Whisper.')
        return
      }

      restartCountRef.current = 0
      finalTextRef.current = ''

      try {
        permStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        setError('Microphone permission denied')
        return
      }

      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTextRef.current += (finalTextRef.current ? ' ' : '') + transcript.trim()
            restartCountRef.current = 0
          } else {
            interim += transcript
          }
        }
        const display = finalTextRef.current + (interim ? (finalTextRef.current ? ' ' : '') + interim.trim() : '')
        if (display && onReplaceRef.current) {
          onReplaceRef.current(display)
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission denied')
          cleanup()
          updateState('idle')
          return
        }
        if (event.error === 'audio-capture') {
          setError('Mic not available. Add Groq API key in Settings for Whisper.')
          cleanup()
          updateState('idle')
        }
      }

      recognition.onend = () => {
        if (stateRef.current === 'listening') {
          restartCountRef.current += 1
          if (restartCountRef.current <= WEBSPEECH_MAX_RESTARTS) {
            setTimeout(() => {
              if (stateRef.current === 'listening' && recognitionRef.current) {
                try { recognition.start() } catch { /* already started */ }
              }
            }, WEBSPEECH_RESTART_DELAY_MS)
          } else {
            cleanup()
            updateState('idle')
          }
        }
      }

      recognitionRef.current = recognition

      stopRef.current = async () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
        updateState('idle')
        if (recognitionRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          try { (recognitionRef.current as any).stop() } catch { /* already stopped */ }
          recognitionRef.current = null
        }
        if (permStreamRef.current) {
          permStreamRef.current.getTracks().forEach(t => t.stop())
          permStreamRef.current = null
        }
        if (finalTextRef.current && onReplaceRef.current) {
          onReplaceRef.current(finalTextRef.current)
        }
        finalTextRef.current = ''
        restartCountRef.current = 0
      }

      try {
        recognition.start()
        updateState('listening')
        timerRef.current = setTimeout(() => stopRef.current(), MAX_RECORDING_MS)
      } catch {
        setError('Failed to start speech recognition. Add Groq API key in Settings for Whisper.')
        cleanup()
      }
    }
  }, [cleanup, updateState, transcribeAudio])

  return { voiceState, error, toggleVoice }
}
