// Encrypts a user's Claude API key with AES-GCM-256 (key from ENCRYPTION_KEY
// env var) and stores the ciphertext in profiles.claude_api_key_encrypted.
// The plaintext key never persists anywhere — not in DB, not in logs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { encryptSecret } from '../_shared/crypto.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL               = Deno.env.get('APP_URL') ?? '*'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin':  matchOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary':                         'Origin',
})

function matchOrigin(origin: string | null): string {
  if (APP_URL === '*' || !origin) return APP_URL
  try {
    const allow = new URL(APP_URL).origin
    return origin === allow ? origin : allow
  } catch {
    return APP_URL
  }
}

const json = (origin: string | null, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(origin, { error: 'Missing auth' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) {
      return json(origin, { error: `Unauthorized: ${authErr?.message || 'invalid session'}` }, 401)
    }

    const { api_key } = await req.json()
    const trimmed = (api_key || '').trim()

    // Allow clearing the key (empty string)
    if (!trimmed) {
      const { error } = await admin
        .from('profiles')
        .update({ claude_api_key_encrypted: null, claude_api_key: null })
        .eq('id', user.id)
      if (error) throw error
      return json(origin, { ok: true, hasKey: false })
    }

    // Sanity-check the format so we don't encrypt obvious garbage
    if (!trimmed.startsWith('sk-')) {
      return json(origin, { error: 'Key does not look like a Claude API key (expected to start with "sk-")' }, 400)
    }

    const ciphertext = await encryptSecret(trimmed)

    const { error } = await admin
      .from('profiles')
      .update({
        claude_api_key_encrypted: ciphertext,
        // Wipe legacy plaintext column on save — defense in depth.
        claude_api_key: null,
      })
      .eq('id', user.id)
    if (error) throw error

    return json(origin, { ok: true, hasKey: true })
  } catch (e) {
    return json(origin, { error: e.message }, 500)
  }
})
