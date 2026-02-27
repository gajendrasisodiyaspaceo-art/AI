import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import TabBar from './components/TabBar/TabBar'
import { Spinner, ErrorBoundary } from './components/common'
import MiniMode from './components/MiniMode/MiniMode'
import AuthScreen from './components/AuthScreen/AuthScreen'
import { useAuth } from './hooks/useAuth'
import { useSubscription } from './hooks/useSubscription'

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
  const { user, loading: authLoading, error: authError, isAuthenticated, signIn, signUp, signOut, clearError } = useAuth()
  const subscriptionState = useSubscription()

  const [activeTab, setActiveTab] = useState<TabId>('live')
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null)
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [latestAnswer, setLatestAnswer] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    const checkSetup = async () => {
      try {
        const settings = await window.electronAPI.getSettings()
        setHasCompletedSetup(settings.hasCompletedSetup)
      } catch {
        setHasCompletedSetup(false)
      }
    }
    checkSetup()
  }, [isAuthenticated])

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

  if (authLoading) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        error={authError}
        loading={authLoading}
        onClearError={clearError}
      />
    )
  }

  if (hasCompletedSetup === null) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    )
  }

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

  if (isMiniMode) {
    return (
      <MiniMode
        latestAnswer={latestAnswer}
        onCloseMiniMode={handleExitMiniMode}
        onCopy={handleCopyAnswer}
      />
    )
  }

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
                userEmail={user?.email || ''}
                subscription={subscriptionState}
                onLogout={signOut}
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
