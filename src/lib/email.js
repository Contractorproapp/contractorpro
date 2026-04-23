import { supabase } from './supabase'

export async function sendEmail({ to, subject, body, kind }) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, body, kind },
  })
  if (error) return { error: data?.error || error.message || 'Send failed' }
  if (data?.error) return { error: data.error }
  return { ok: true, used: data?.used, limit: data?.limit }
}
