import { useLiveChat } from './hooks/useLiveChat'
import StatusBar from './StatusBar'
import ChatArea from './ChatArea'
import InputArea from './InputArea'

interface LiveTabProps {
  onLatestAnswer?: (answer: string) => void
  subscription: {
    isPro: boolean
    questionsRemaining: number
    canAskQuestion: boolean
    canScreenCapture: boolean
    error?: string | null
    trackQuestion: () => Promise<boolean>
    openCheckout: () => Promise<void>
  }
}

export default function LiveTab({ onLatestAnswer, subscription }: LiveTabProps) {
  const {
    qaPairs,
    manualInput,
    isActive,
    aiStatus,
    copiedId,
    isTranscribing,
    isCapturing,
    screenCaptureError,
    transcriptionError,
    chatEndRef,
    setManualInput,
    toggleListening,
    handleManualSubmit,
    handleKeyDown,
    handleCopy,
    handleRegenerate,
    handleScreenCapture,
  } = useLiveChat({
    onLatestAnswer,
    trackQuestion: subscription.trackQuestion,
    canAskQuestion: subscription.canAskQuestion,
  })

  return (
    <div className="flex flex-col h-full">
      <StatusBar
        isActive={isActive}
        isTranscribing={isTranscribing}
        aiStatus={aiStatus}
        questionsRemaining={subscription.questionsRemaining}
        isPro={subscription.isPro}
      />
      <ChatArea
        qaPairs={qaPairs}
        copiedId={copiedId}
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
        chatEndRef={chatEndRef}
      />
      <InputArea
        manualInput={manualInput}
        onManualInputChange={setManualInput}
        onSubmit={handleManualSubmit}
        onKeyDown={handleKeyDown}
        onScreenCapture={handleScreenCapture}
        onToggleListening={toggleListening}
        isActive={isActive}
        isCapturing={isCapturing}
        screenCaptureError={screenCaptureError}
        transcriptionError={transcriptionError}
        canScreenCapture={subscription.canScreenCapture}
        canAskQuestion={subscription.canAskQuestion}
        questionsRemaining={subscription.questionsRemaining}
        isPro={subscription.isPro}
        onUpgrade={subscription.openCheckout}
        checkoutError={subscription.error}
      />
    </div>
  )
}
