import { supabase } from './supabase'

export const redirectToCheckout = async (userId, email) => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { user_id: userId, email },
  })
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('No checkout URL returned')
  window.location.href = data.url
}
