import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's subscription from DB
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status, stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .single()

    if (!sub || sub.plan !== 'pro') {
      return new Response(JSON.stringify({
        plan: sub?.plan ?? 'free',
        status: sub?.status ?? 'active',
        valid: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // User is pro — verify with Stripe
    if (!sub.stripe_subscription_id) {
      // Pro with no Stripe subscription ID — reset to free
      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'expired',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({ plan: 'free', status: 'expired', valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check Stripe subscription status
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`,
      { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
    )
    const stripeSub = await stripeRes.json()

    if (stripeSub.error || !['active', 'trialing'].includes(stripeSub.status)) {
      // Subscription doesn't exist or isn't active — reset to free
      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'expired',
          stripe_subscription_id: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      return new Response(JSON.stringify({ plan: 'free', status: 'expired', valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Subscription is valid — sync cancel_at_period_end and period end from Stripe
    // This catches cancellations that the webhook might have missed
    const cancelAtPeriodEnd = stripeSub.cancel_at_period_end ?? false
    const items = stripeSub.items as { data?: Array<Record<string, unknown>> } | undefined
    const firstItem = items?.data?.[0]
    const periodEnd = (stripeSub.current_period_end || firstItem?.current_period_end) as number | undefined
    const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

    // Update DB if cancel_at_period_end changed
    if (cancelAtPeriodEnd !== sub.cancel_at_period_end) {
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: periodEndIso,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    return new Response(JSON.stringify({
      plan: 'pro',
      status: stripeSub.status,
      valid: true,
      cancelAtPeriodEnd,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Validation error:', err)
    return new Response(JSON.stringify({ error: 'Validation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
