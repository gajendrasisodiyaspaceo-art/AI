import { Button } from '../common'
import { useSetupWizard } from './hooks/useSetupWizard'
import StepIndicator from './StepIndicator'
import AIEngineStep from './steps/AIEngineStep'
import AudioStep from './steps/AudioStep'
import ResumeStep from './steps/ResumeStep'
import ReadyStep from './steps/ReadyStep'

interface SetupWizardProps {
  onComplete: () => void
}

const stepTitles = ['AI Engine', 'Audio', 'Resume', 'Ready']

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const {
    step,
    provider,
    apiKey,
    apiKeyStatus,
    showApiKey,
    ollamaStatus,
    audioDevices,
    selectedDevice,
    resumeUploaded,
    resumePreview,
    setProvider,
    setSelectedDevice,
    handleApiKeyChange,
    toggleShowApiKey,
    validateApiKey,
    checkOllama,
    handleResumeUpload,
    handleComplete,
    nextStep,
    prevStep,
  } = useSetupWizard(onComplete)

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <h1 className="text-sm font-semibold text-white/90">Setup</h1>
          </div>
          <StepIndicator currentStep={step} stepTitles={stepTitles} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {step === 1 && (
          <AIEngineStep
            provider={provider}
            apiKey={apiKey}
            apiKeyStatus={apiKeyStatus}
            showApiKey={showApiKey}
            ollamaStatus={ollamaStatus}
            onProviderChange={setProvider}
            onApiKeyChange={handleApiKeyChange}
            onShowApiKeyToggle={toggleShowApiKey}
            onValidateApiKey={validateApiKey}
            onCheckOllama={checkOllama}
          />
        )}
        {step === 2 && (
          <AudioStep
            audioDevices={audioDevices}
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
          />
        )}
        {step === 3 && (
          <ResumeStep
            resumeUploaded={resumeUploaded}
            resumePreview={resumePreview}
            onUpload={handleResumeUpload}
          />
        )}
        {step === 4 && (
          <ReadyStep
            provider={provider}
            apiKeyStatus={apiKeyStatus}
            ollamaStatus={ollamaStatus}
            selectedDevice={selectedDevice}
            resumeUploaded={resumeUploaded}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 flex items-center gap-2 border-t border-white/[0.06] flex-shrink-0">
        {step > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={prevStep}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            }
          >
            Back
          </Button>
        )}

        {step < 4 ? (
          <Button
            variant="gradient"
            size="sm"
            onClick={nextStep}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            }
          >
            Next
          </Button>
        ) : (
          <Button variant="gradient" size="sm" onClick={handleComplete}>
            Get Started
          </Button>
        )}
      </div>
    </div>
  )
}
