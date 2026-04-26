import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL               = Deno.env.get('APP_URL') || 'https://contractorpro-azure.vercel.app/profile'

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
    // SECURITY: derive user identity from a verified JWT, NOT from the body.
    // Previous version trusted body.user_id → anyone could open another
    // user's Stripe billing portal (view cards, cancel sub, change billing).
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing auth' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) {
      return json({ error: `Unauthorized: ${authErr?.message || 'invalid session'}` }, 401)
    }

    const { data: profile } = await admin
      .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

    if (!profile?.stripe_customer_id) {
      return json({ error: 'No Stripe customer found' }, 404)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   profile.stripe_customer_id,
      return_url: APP_URL,
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
