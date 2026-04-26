import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // SECURITY: previous version accepted user_id from body with no auth +
    // didn't verify the session belonged to that user. That let an attacker
    // re-use any paid session_id to activate any account, indefinitely.
    //
    // Fixes:
    // 1. Require a valid JWT and derive user identity from it.
    // 2. Verify the Stripe session's client_reference_id matches that user.
    // 3. Confirm the session is paid OR currently in trial.
    // 4. Refuse if the Stripe customer is already bound to a different user.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ success: false, error: 'Missing auth' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) {
      return json({ success: false, error: `Unauthorized: ${authErr?.message || 'invalid session'}` }, 401)
    }

    const { session_id } = await req.json()
    if (!session_id) return json({ success: false, error: 'Missing session_id' }, 400)

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    })

    // 2. Stops session-id reuse across accounts.
    if (session.client_reference_id !== user.id) {
      return json({ success: false, error: 'Session does not belong to this user' }, 403)
    }

    // 3. Must actually be paid OR in a valid trial state.
    const sub = session.subscription as Stripe.Subscription | null
    const validTrial = sub && (sub.status === 'trialing' || sub.status === 'active')
    const paid = session.payment_status === 'paid'
    if (!paid && !validTrial) {
      return json({ success: false, error: 'Payment not completed' }, 400)
    }

    // 4. Refuse if customer is already bound to another account.
    const customerId = session.customer as string
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) {
      return json({ success: false, error: 'Customer already bound to another account' }, 409)
    }

    const status = sub?.status === 'trialing' ? 'trialing' : 'active'

    const { error } = await admin.from('profiles').update({
      stripe_customer_id:     customerId,
      stripe_subscription_id: session.subscription as string,
      subscription_status:    status,
    }).eq('id', user.id)

    if (error) throw error

    return json({ success: true, status })
  } catch (e) {
    return json({ success: false, error: e.message }, 500)
  }
})
