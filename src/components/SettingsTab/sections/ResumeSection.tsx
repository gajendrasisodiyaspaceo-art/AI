import { memo } from 'react'
import { Button } from '../../common'

interface ResumeSectionProps {
  resumePreview: string
  onUpload: () => void
  onDelete: () => void
}

export default memo(function ResumeSection({ resumePreview, onUpload, onDelete }: ResumeSectionProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/35 uppercase tracking-wider px-0.5">
        Resume
      </label>
      {resumePreview ? (
        <div className="space-y-1.5">
          <div className="surface rounded-xl p-2.5 text-xs text-white/50 max-h-20 overflow-y-auto leading-relaxed">
            {resumePreview.slice(0, 500)}
            {resumePreview.length > 500 && '...'}
          </div>
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm" fullWidth onClick={onUpload}>
              Replace
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={onUpload}
          className="w-full py-3 border border-dashed border-white/15 rounded-xl text-xs text-white/40 hover:text-white/60 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all"
        >
          <div className="flex flex-col items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Resume (PDF/TXT)</span>
          </div>
        </button>
      )}
    </div>
  )
})
