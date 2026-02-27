const QUESTION_STARTERS = [
  'what', 'how', 'why', 'when', 'where', 'who',
  'can', 'could', 'would', 'should',
  'is', 'are', 'do', 'does', 'did',
  'will', 'have', 'has',
]

const INTERVIEW_PATTERNS = [
  'tell me about',
  'explain',
  'describe',
  'walk me through',
  'what would you',
  'how would you',
  'give me an example',
]

const MIN_WORD_COUNT = 5

export function detectQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  const words = trimmed.split(/\s+/)
  if (words.length < MIN_WORD_COUNT) return false

  if (trimmed.endsWith('?')) return true

  const lower = trimmed.toLowerCase()

  for (const pattern of INTERVIEW_PATTERNS) {
    if (lower.startsWith(pattern)) return true
  }

  const firstWord = words[0].toLowerCase()
  return QUESTION_STARTERS.includes(firstWord)
}
