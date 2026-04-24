import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import TabBar from './components/TabBar/TabBar'
import { Spinner, ErrorBoundary } from './components/common'
import MiniMode from './components/MiniMode/MiniMode'
import AuthScreen from './components/AuthScreen/AuthScreen'
import { useSubscription } from './hooks/useSubscription'
import { useAuth } from './hooks/useAuth'

const LiveTab = lazy(() => import('./components/LiveTab/LiveTab'))
const SettingsTab = lazy(() => import('./components/SettingsTab/SettingsTab'))
const HistoryTab = lazy(() => import('./components/HistoryTab/HistoryTab'))
const SetupWizard = lazy(() => import('./components/SetupWizard/SetupWizard'))

type TabId = 'live' | 'settings' | 'history'

function TabFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <Spinner size="sm" label="Loading..." />
    </div>
  )
}

function App() {
  const subscriptionState = useSubscription()
  const auth = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('live')
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null)
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [latestAnswer, setLatestAnswer] = useState('')

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const settings = await window.electronAPI.getSettings()
        setHasCompletedSetup(settings.hasCompletedSetup)
      } catch {
        setHasCompletedSetup(false)
      }
    }
    checkSetup()
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onShortcut((action: string) => {
      switch (action) {
        case 'toggle-mini':
          setIsMiniMode(prev => {
            const newVal = !prev
            window.electronAPI.setMiniMode(newVal)
            return newVal
          })
          break
      }
    })
    return () => { unsubscribe() }
  }, [])

  const handleSetupComplete = useCallback(() => {
    setHasCompletedSetup(true)
  }, [])

  const handleCopyAnswer = useCallback(() => {
    navigator.clipboard.writeText(latestAnswer)
  }, [latestAnswer])

  const handleExitMiniMode = useCallback(() => {
    setIsMiniMode(false)
    window.electronAPI.setMiniMode(false)
  }, [])

  // Loading setup status
  if (hasCompletedSetup === null) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    )
  }

  // Setup wizard
  if (!hasCompletedSetup) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell">
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <SetupWizard onComplete={handleSetupComplete} />
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  }

  // Auth gate — must sign in before using the app
  if (!auth.loading && !auth.isAuthenticated) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell">
        <TitleBar />
        <AuthScreen
          onSignIn={auth.signIn}
          onSignUp={auth.signUp}
          error={auth.error}
          loading={auth.loading}
          onClearError={auth.clearError}
        />
      </div>
    )
  }

  // Mini mode
  if (isMiniMode) {
    return (
      <MiniMode
        latestAnswer={latestAnswer}
        onCloseMiniMode={handleExitMiniMode}
        onCopy={handleCopyAnswer}
      />
    )
  }

  // Main app
  return (
    <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col">
      <TitleBar />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ErrorBoundary>
        <div className="flex-1 overflow-hidden animate-fade-in" key={activeTab}>
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'live' && (
              <LiveTab
                onLatestAnswer={setLatestAnswer}
                subscription={subscriptionState}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                subscription={subscriptionState}
                auth={auth}
              />
            )}
            {activeTab === 'history' && <HistoryTab />}
          </Suspense>
        </div>
      </ErrorBoundary>
    </div>
  )
}

export default App
