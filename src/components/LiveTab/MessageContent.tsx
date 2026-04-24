import { memo, useMemo, lazy, Suspense } from 'react'

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism-light').then(mod => ({
    default: mod.default ?? mod,
  }))
)

import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TextSegment {
  type: 'text' | 'code'
  content: string
  language?: string
}

function parseMessage(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trimEnd(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

export default memo(function MessageContent({ text }: { text: string }) {
  const segments = useMemo(() => parseMessage(text), [text])

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <div key={i} className="my-1.5 rounded-lg overflow-hidden text-xs">
            <Suspense
              fallback={
                <pre className="p-2.5 rounded-lg bg-black/50 text-xs text-white/60">
                  {seg.content}
                </pre>
              }
            >
              <SyntaxHighlighter
                language={seg.language}
                style={atomDark}
                customStyle={{
                  margin: 0,
                  padding: '10px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  borderRadius: '8px',
                  background: '#0A0A0B',
                  border: '1px solid #2A2A2E',
                }}
              >
                {seg.content}
              </SyntaxHighlighter>
            </Suspense>
          </div>
        ) : (
          <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
        )
      )}
    </>
  )
})
