import { memo } from 'react'

interface StepIndicatorProps {
  currentStep: number
  stepTitles: string[]
}

export default memo(function StepIndicator({ currentStep, stepTitles }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {stepTitles.map((_, i) => {
        const s = i + 1
        const isComplete = s < currentStep
        const isActive = s === currentStep
        return (
          <div key={s} className="flex items-center">
            {/* Dot */}
            {isComplete ? (
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex items-center justify-center">
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : isActive ? (
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/20" />
            )}
            {/* Connecting line */}
            {i < stepTitles.length - 1 && (
              <div className={`w-6 h-px mx-0.5 ${s < currentStep ? 'bg-violet-500' : 'bg-white/20'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
})
