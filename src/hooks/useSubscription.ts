import { useState, useEffect, useCallback, useRef } from 'react'
import { getSubscription, getDailyUsage, incrementQuestionCount, createCheckoutSession, createPortalSession, validateSubscription } from '../services/subscriptionService'
import { supabase } from '../services/supabaseClient'
import { PLAN_LIMITS } from '../types'
import type { UserSubscription, DailyUsage } from '../types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>({
    plan: 'free',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  })
  const [usage, setUsage] = useState<DailyUsage>({ questionCount: 0, date: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const plan = subscription.plan
  const limits = PLAN_LIMITS[plan]
  const questionsRemaining = limits.dailyQuestions === Infinity
    ? Infinity
    : Math.max(0, limits.dailyQuestions - usage.questionCount)
  const canAskQuestion = questionsRemaining > 0
  const canScreenCapture = limits.screenCaptureEnabled
  const canOCR = limits.ocrEnabled
  const isPro = plan === 'pro'

  const refresh = useCallback(async () => {
    setLoading(true)
    const [sub, daily] = await Promise.all([getSubscription(), getDailyUsage()])
    setSubscription(sub)
    setUsage(daily)
    setLoading(false)
  }, [])

  // Initial fetch + Supabase Realtime listener for instant subscription updates
  useEffect(() => {
    refresh()

    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as Record<string, unknown>
            setSubscription({
              plan: row.plan as 'free' | 'pro',
              status: row.status as 'active' | 'canceled' | 'past_due' | 'expired',
              currentPeriodEnd: row.current_period_end as string | null,
              cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
            })
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [refresh])

  // Stop polling when Pro activates
  useEffect(() => {
    if (isPro && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [isPro])

  // Validate Pro subscription with Stripe on mount and periodically
  useEffect(() => {
    let cancelled = false

    const validate = async () => {
      if (!isPro) return
      const result = await validateSubscription()
      if (cancelled) return
      if (result && !result.valid) {
        // Stripe says subscription is no longer active — refresh from DB
        refresh()
      }
    }

    // Validate on mount for Pro users
    validate()

    // Re-validate every 5 minutes
    const interval = setInterval(validate, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isPro, refresh])

  // Check if currentPeriodEnd is in the past for Pro users
  useEffect(() => {
    if (!isPro || !subscription.currentPeriodEnd) return

    const endDate = new Date(subscription.currentPeriodEnd)
    if (endDate < new Date()) {
      // Period has expired — trigger server-side validation
      validateSubscription().then(result => {
        if (result && !result.valid) {
          refresh()
        }
      })
    }
  }, [isPro, subscription.currentPeriodEnd, refresh])

  const trackQuestion = useCallback(async (): Promise<boolean> => {
    if (isPro) return true

    const newCount = await incrementQuestionCount()
    setUsage(prev => ({ ...prev, questionCount: newCount }))
    return newCount <= PLAN_LIMITS.free.dailyQuestions
  }, [isPro])

  const clearError = useCallback(() => setError(null), [])

  const openCheckout = useCallback(async () => {
    setError(null)
    try {
      const url = await createCheckoutSession()
      window.electronAPI.openExternal(url)

      // Start polling as fallback in case Realtime misses the update
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const sub = await getSubscription()
          if (sub.plan === 'pro') {
            setSubscription(sub)
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        }, 3000)

        // Stop polling after 5 minutes max
        setTimeout(() => {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }, 5 * 60 * 1000)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout'
      setError(message)
    }
  }, [])

  const openPortal = useCallback(async () => {
    setError(null)
    try {
      const url = await createPortalSession()
      window.electronAPI.openExternal(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open subscription portal'
      setError(message)
    }
  }, [])

  return {
    subscription,
    usage,
    loading,
    error,
    clearError,
    plan,
    isPro,
    questionsRemaining,
    canAskQuestion,
    canScreenCapture,
    canOCR,
    refresh,
    trackQuestion,
    openCheckout,
    openPortal,
  }
}
