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

  // Signup success screen
  if (signupSuccess) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center animate-fade-in">
        <div style={{ width: '100%', maxWidth: '296px', padding: '0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          {/* Success icon */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(34, 197, 94, 0.10)',
              border: '1px solid rgba(34, 197, 94, 0.20)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              We sent a confirmation link to{' '}
              <span style={{ color: 'var(--accent)' }}>{email}</span>.
              Click the link to activate your account.
            </p>
          </div>

          <Button variant="secondary" fullWidth size="lg" onClick={toggleMode}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center animate-fade-in">
      <div style={{ width: '100%', maxWidth: '296px', padding: '0 32px' }}>

        {/* Logo section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          {/* Icon */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              InterviewAI
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}

          {/* Error banner */}
          {displayError && (
            <div
              className="flex items-center"
              style={{
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                fontSize: '12px',
                color: '#f87171',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

          {/* Submit button */}
          <div style={{ marginTop: '8px' }}>
            <Button
              type="submit"
              variant="gradient"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </form>

        {/* Footer toggle */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '24px',
          }}
        >
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="hover:underline"
            style={{
              color: 'var(--accent-light)',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
            }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
