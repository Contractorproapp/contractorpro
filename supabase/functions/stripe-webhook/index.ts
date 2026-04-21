import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

Deno.serve(async (req) => {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (e) {
    return new Response(`Webhook Error: ${e.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.paused') {
    const sub = event.data.object as Stripe.Subscription
    await supabase.from('profiles')
      .update({ subscription_status: 'inactive' })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub    = event.data.object as Stripe.Subscription
    const status = sub.status === 'active' ? 'active' : 'inactive'
    await supabase.from('profiles')
      .update({ subscription_status: status })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    await supabase.from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer as string)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
