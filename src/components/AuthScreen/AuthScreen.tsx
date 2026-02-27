import { useState, useCallback } from 'react'
import { Button, Input } from '../common'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<boolean>
  onSignUp: (email: string, password: string) => Promise<boolean>
  error: string | null
  loading: boolean
  onClearError: () => void
}

export default function AuthScreen({ onSignIn, onSignUp, error, loading, onClearError }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'signup' : 'login')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLocalError(null)
    setSignupSuccess(false)
    onClearError()
  }, [onClearError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match')
        return
      }
      const success = await onSignUp(email, password)
      if (success) {
        setSignupSuccess(true)
      }
    } else {
      await onSignIn(email, password)
    }
  }, [email, password, confirmPassword, mode, onSignIn, onSignUp])

  const displayError = localError || error

  if (signupSuccess) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/70">Check your email</h2>
            <p className="text-xs text-white/40 mt-2">
              We sent a confirmation link to <span className="text-violet-400">{email}</span>. Click the link to activate your account.
            </p>
          </div>
          <Button variant="secondary" fullWidth onClick={toggleMode}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/80">InterviewAI</h1>
            <p className="text-xs text-white/40 mt-1">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}

          {displayError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-xs text-white/35">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
