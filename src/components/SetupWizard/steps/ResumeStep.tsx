import { memo } from 'react'

interface ResumeStepProps {
  resumeUploaded: boolean
  resumePreview: string
  onUpload: () => void
}

export default memo(function ResumeStep({
  resumeUploaded,
  resumePreview,
  onUpload,
}: ResumeStepProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <h2 className="text-sm font-medium text-white/90">Resume (Optional)</h2>
        <p className="text-sm text-white/45 mt-1 leading-relaxed">
          Upload your resume to get personalized answers based on your experience.
        </p>
      </div>

      {!resumeUploaded ? (
        <button
          onClick={onUpload}
          className="w-full p-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-violet-500/[0.04] hover:border-violet-500/25 transition-all text-center group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-white/20 group-hover:text-violet-400/50 transition-colors">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm text-white/50 mt-2">Click to upload resume</p>
          <p className="text-xs text-white/25 mt-0.5">Supports PDF and TXT files</p>
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-xs text-emerald-400 font-medium">Resume uploaded</p>
          </div>
          <p className="text-xs text-white/40 mt-1.5 line-clamp-3 leading-relaxed">{resumePreview}</p>
        </div>
      )}
    </div>
  )
})
