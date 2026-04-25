import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const APP_URL  = Deno.env.get('APP_URL') ?? ''
const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID') ?? ''

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Service-role client used for the profile lookup that drives trial eligibility.
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { user_id, email } = await req.json()
    if (!user_id || !email) return json({ error: 'Missing user_id or email' }, 400)

    // Trial eligibility: only first-time subscribers get the 7-day trial.
    // Presence of `stripe_customer_id` on the profile means this user has
    // subscribed before (the activate-subscription handler sets it). Returning
    // customers go straight to paid — no second free trial.
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user_id)
      .single()

    const isReturningCustomer = !!profile?.stripe_customer_id

    const params: Record<string, unknown> = {
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      client_reference_id: user_id,
      success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/subscribe`,
    }

    if (isReturningCustomer) {
      // Reuse the existing Stripe customer record. No trial — they've used it.
      params.customer = profile.stripe_customer_id
    } else {
      // First-timer: let Stripe create a customer from email + grant the trial.
      params.customer_email = email
      params.subscription_data = { trial_period_days: 7 }
    }

    const session = await stripe.checkout.sessions.create(params as any)

    return json({ url: session.url, isReturningCustomer })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
