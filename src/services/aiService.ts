import type { AIModel, AIProvider } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate'
const OLLAMA_TAGS_URL = 'http://localhost:11434/api/tags'

const SYSTEM_PROMPT =
  'You are an expert interview coach and assistant. Help the candidate answer interview questions effectively. ' +
  'For behavioral questions, suggest using the STAR method (Situation, Task, Action, Result). ' +
  'For technical questions, provide clear explanations with code examples when appropriate. ' +
  'Keep answers concise but comprehensive. ' +
  'If resume context is provided, reference relevant experience.'

export async function* generateAnswer(
  question: string,
  context?: string,
  model = 'llama-3.3-70b-versatile',
  resumeText?: string,
  apiKey?: string,
  provider: AIProvider = 'groq'
): AsyncGenerator<string> {
  if (provider === 'groq') {
    yield* generateGroq(question, context, model, resumeText, apiKey)
  } else {
    yield* generateOllama(question, context, model, resumeText)
  }
}

async function* generateGroq(
  question: string,
  context?: string,
  model = 'llama-3.3-70b-versatile',
  resumeText?: string,
  apiKey?: string
): AsyncGenerator<string> {
  if (!apiKey) {
    throw new Error('Groq API key is required. Please add your API key in Settings.')
  }

  let userMessage = ''

  if (resumeText) {
    userMessage += `Resume Context:\n${resumeText}\n\n`
  }

  if (context) {
    userMessage += `Conversation Context:\n${context}\n\n`
  }

  userMessage += `Interview Question: ${question}\n\nProvide a strong answer:`

  let response: Response
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        stream: true,
      }),
    })
  } catch {
    throw new Error('Cannot connect to Groq API. Please check your internet connection.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Groq API key. Please check your key in Settings.')
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.')
    }
    if (response.status === 404) {
      throw new Error(`Model "${model}" not found on Groq.`)
    }
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
        try {
          const parsed = JSON.parse(trimmed.slice(6))
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

async function* generateOllama(
  question: string,
  context?: string,
  model = 'llama3.2',
  resumeText?: string
): AsyncGenerator<string> {
  let prompt = ''

  if (resumeText) {
    prompt += `Resume Context:\n${resumeText}\n\n`
  }

  if (context) {
    prompt += `Conversation Context:\n${context}\n\n`
  }

  prompt += `Interview Question: ${question}\n\nProvide a strong answer:`

  let response: Response
  try {
    response = await fetch(OLLAMA_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: SYSTEM_PROMPT,
        stream: true,
      }),
    })
  } catch {
    throw new Error('Cannot connect to Ollama. Make sure Ollama is running on localhost:11434.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Model "${model}" not found. Run: ollama pull ${model}`)
    }
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        try {
          const parsed = JSON.parse(trimmed)
          if (parsed.response) {
            yield parsed.response
          }
          if (parsed.done) return
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim())
        if (parsed.response) {
          yield parsed.response
        }
      } catch {
        // Skip malformed JSON
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function getModels(provider: AIProvider = 'groq'): Promise<AIModel[]> {
  if (provider === 'ollama') {
    try {
      const response = await fetch(OLLAMA_TAGS_URL)
      if (!response.ok) return []
      const data = await response.json()
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: { name: string }) => ({ name: m.name }))
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
}

export async function checkConnection(apiKey?: string, provider: AIProvider = 'groq'): Promise<boolean> {
  if (provider === 'ollama') {
    try {
      const response = await fetch(OLLAMA_TAGS_URL)
      return response.ok
    } catch {
      return false
    }
  }
  if (!apiKey) return false
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    return response.ok
  } catch {
    return false
  }
}
