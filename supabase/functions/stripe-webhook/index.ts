import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Verify webhook signature using Web Crypto API (reliable in Deno)
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(signature.split(',').map(p => {
    const [k, v] = p.split('=')
    return [k, v]
  }))

  const timestamp = parts['t']
  const sig = parts['v1']
  if (!timestamp || !sig) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  return expected === sig
}

// Helper to get period dates from subscription data (handles both old and new Stripe API)
function getPeriodDates(sub: Record<string, unknown>): { start: string | null, end: string | null } {
  // Try top-level fields first (old API)
  let start = sub.current_period_start as number | undefined
  let end = sub.current_period_end as number | undefined

  // Fall back to first subscription item (new API versions moved these fields)
  if (!start || !end) {
    const items = sub.items as { data?: Array<Record<string, unknown>> } | undefined
    const firstItem = items?.data?.[0]
    if (firstItem) {
      start = start || firstItem.current_period_start as number
      end = end || firstItem.current_period_end as number
    }
  }

  return {
    start: start ? new Date(start * 1000).toISOString() : null,
    end: end ? new Date(end * 1000).toISOString() : null,
  }
}

// Fetch subscription from Stripe API directly (avoids SDK version issues)
async function getSubscription(subscriptionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  })
  return await res.json()
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 })
  }

  const body = await req.text()

  const valid = await verifySignature(body, signature, WEBHOOK_SECRET)
  if (!valid) {
    console.error('Webhook signature verification failed')
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  const event = JSON.parse(body)
  console.log(`Processing event: ${event.type}`)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        if (!userId) { console.log('No supabase_user_id in metadata'); break }

        const subscriptionId = session.subscription
        if (!subscriptionId) { console.log('No subscription in session'); break }

        const sub = await getSubscription(subscriptionId)
        const { start, end } = getPeriodDates(sub)

        const { error } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            plan: 'pro',
            status: 'active',
            current_period_start: start,
            current_period_end: end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (error) console.error('DB update error:', error)
        else console.log(`Activated pro for user ${userId}`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break

        const sub = await getSubscription(subscriptionId)
        const { start, end } = getPeriodDates(sub)

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: start,
            current_period_end: end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) console.error('DB update error:', error)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const { end } = getPeriodDates(sub)

        const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled'

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            current_period_end: end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        if (error) console.error('DB update error:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object

        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'expired',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        if (error) console.error('DB update error:', error)
        break
      }

      case 'customer.deleted': {
        const customer = event.data.object

        // Find user by stripe_customer_id in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer.id)
          .single()

        if (profile) {
          // Reset subscription to free
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              status: 'expired',
              stripe_subscription_id: null,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)

          if (subError) console.error('DB subscription update error:', subError)

          // Clear stripe_customer_id from profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              stripe_customer_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

          if (profileError) console.error('DB profile update error:', profileError)
          else console.log(`Cleared Stripe data for user ${profile.id} after customer deletion`)
        } else {
          console.log(`No user found for deleted Stripe customer ${customer.id}`)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err)
    return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
