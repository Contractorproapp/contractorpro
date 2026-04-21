import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

export const redirectToCheckout = async (userId, email) => {
  const stripe = await getStripe()
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl:  `${window.location.origin}/subscribe`,
    customerEmail: email,
    clientReferenceId: userId,
  })
  if (error) throw new Error(error.message)
}
