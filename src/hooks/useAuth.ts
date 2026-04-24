import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ user, loading: false, error: null })
    }).catch(() => {
      setState({ user: null, loading: false, error: null })
    })

    let sub: { unsubscribe: () => void } | null = null
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setState(prev => ({ ...prev, user: session?.user ?? null, loading: false }))
      })
      sub = subscription
    } catch {
      // Supabase unreachable
    }

    return () => { sub?.unsubscribe() }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: formatAuthError(error) }))
        return false
      }
      setState(prev => ({ ...prev, loading: false }))
      return true
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Unable to connect. Please check your internet connection.' }))
      return false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setState(prev => ({ ...prev, loading: false, error: formatAuthError(error) }))
        return false
      }
      setState(prev => ({ ...prev, loading: false }))
      return true
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Unable to connect. Please check your internet connection.' }))
      return false
    }
  }, [])

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    setState({ user: null, loading: false, error: null })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signOut,
    clearError,
  }
}

function formatAuthError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters'
    default:
      return error.message
  }
}
