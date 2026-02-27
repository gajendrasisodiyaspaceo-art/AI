import { createWorker, Worker } from 'tesseract.js'
import type { OCRResult } from '@/types'

const CODING_KEYWORDS = [
  'function', 'class', 'def', 'return', 'for', 'while', 'if', 'else',
  'algorithm', 'complexity', 'implement', 'input', 'output',
  'array', 'string', 'tree', 'graph', 'node',
  'O(n)', 'time complexity', 'space complexity',
  'int', 'void', 'public', 'private', 'static',
  'const', 'let', 'var', 'import', 'export',
  'print', 'console', 'log', 'sorted', 'sort',
  'linked list', 'binary', 'hash', 'stack', 'queue',
  'recursive', 'iteration', 'traverse', 'pointer',
]

let workerInstance: Worker | null = null

async function getWorker(): Promise<Worker> {
  if (!workerInstance) {
    workerInstance = await createWorker('eng')
  }
  return workerInstance
}

function detectCodingProblem(text: string): { isCodingProblem: boolean; confidence: number } {
  const lowerText = text.toLowerCase()
  let matchCount = 0

  for (const keyword of CODING_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchCount++
    }
  }

  // Check for code-like patterns: braces, semicolons, arrows, etc.
  const codePatterns = [
    /[{}\[\]();]/,          // brackets and semicolons
    /=>|->|::/,             // arrow functions, pointers
    /\b\w+\(.*\)/,          // function calls
    /^\s*(\/\/|#|\/\*)/m,   // comments
    /\b(int|str|bool|float|double)\b/i, // type annotations
  ]

  let patternMatches = 0
  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      patternMatches++
    }
  }

  const totalSignals = matchCount + patternMatches
  const confidence = Math.min(totalSignals / 8, 1)
  const isCodingProblem = totalSignals >= 3

  return { isCodingProblem, confidence }
}

export async function extractText(imageDataUrl: string): Promise<OCRResult> {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageDataUrl)
  const text = data.text.trim()
  const { isCodingProblem, confidence } = detectCodingProblem(text)

  return {
    text,
    isCodingProblem,
    confidence,
  }
}

export async function terminateWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
