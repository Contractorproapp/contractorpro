import { supabase } from './supabase'

// Flip to 'true' in Vercel env vars once Resend is set up:
//   VITE_EMAIL_SERVER_ENABLED=true
export const emailServerEnabled = import.meta.env.VITE_EMAIL_SERVER_ENABLED === 'true'

export async function sendEmail({ to, subject, body, kind }) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, body, kind },
  })
  if (error) return { error: data?.error || error.message || 'Send failed' }
  if (data?.error) return { error: data.error }
  return { ok: true, used: data?.used, limit: data?.limit }
}
