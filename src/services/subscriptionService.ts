import { supabase } from './supabaseClient'
import type { UserSubscription, DailyUsage } from '../types'

export async function getSubscription(): Promise<UserSubscription> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  return {
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  }
}

export async function getDailyUsage(): Promise<DailyUsage> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { questionCount: 0, date: new Date().toISOString().split('T')[0] }
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_usage')
    .select('question_count, date')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (error || !data) {
    return { questionCount: 0, date: today }
  }

  return { questionCount: data.question_count, date: data.date }
}

export async function incrementQuestionCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, question_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    const newCount = existing.question_count + 1
    await supabase
      .from('daily_usage')
      .update({ question_count: newCount })
      .eq('id', existing.id)
    return newCount
  }

  await supabase
    .from('daily_usage')
    .insert({ user_id: user.id, date: today, question_count: 1 })

  return 1
}

export async function createCheckoutSession(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('[Checkout] No active session - user not logged in')
      throw new Error('Please log in to upgrade')
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (error) {
      console.error('[Checkout] Edge function error:', error)
      // For FunctionsHttpError, the context has the response body
      let detail = ''
      try {
        const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context
        if (ctx?.json) {
          const body = await ctx.json() as { error?: string }
          detail = body?.error || ''
        }
      } catch { /* ignore parse errors */ }
      console.error('[Checkout] Error detail:', detail)
      throw new Error(detail || error.message || 'Checkout service unavailable')
    }

    if (data?.error) {
      console.error('[Checkout] Edge function returned error:', data.error)
      throw new Error(data.error)
    }

    if (!data?.url) {
      console.error('[Checkout] No URL in response:', data)
      throw new Error('Checkout service returned an invalid response')
    }

    return data.url
  } catch (err) {
    console.error('[Checkout] Error:', err)
    throw err instanceof Error ? err : new Error('Failed to create checkout session')
  }
}

export async function validateSubscription(): Promise<{ plan: string; status: string; valid: boolean } | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase.functions.invoke('validate-subscription', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error || !data) return null
  return data
}

export async function createPortalSession(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('[Portal] No active session - user not logged in')
      throw new Error('Please log in to manage subscription')
    }

    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (error) {
      console.error('[Portal] Edge function error:', error)
      throw new Error('Failed to open subscription portal')
    }

    if (!data?.url) {
      console.error('[Portal] No URL in response:', data)
      throw new Error('Failed to open subscription portal')
    }

    return data.url
  } catch (err) {
    console.error('[Portal] Error:', err)
    throw err instanceof Error ? err : new Error('Failed to open subscription portal')
  }
}
