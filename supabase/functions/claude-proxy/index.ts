import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const ENCRYPTION_KEY_B64 = Deno.env.get('ENCRYPTION_KEY') ?? ''

// ─── Inline AES-GCM-256 helpers (mirror of _shared/crypto.ts) ───
// Inlined so the function deploys cleanly via the Dashboard editor,
// which can't resolve cross-file imports.
let cachedKey: CryptoKey | null = null
async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  if (!ENCRYPTION_KEY_B64) throw new Error('ENCRYPTION_KEY env var not set')
  const bin = atob(ENCRYPTION_KEY_B64)
  const raw = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i)
  if (raw.byteLength !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes')
  cachedKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  return cachedKey
}
async function decryptSecret(ciphertextB64: string): Promise<string> {
  if (!ciphertextB64) return ''
  const key = await getCryptoKey()
  const bin = atob(ciphertextB64)
  const combined = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) combined[i] = bin.charCodeAt(i)
  if (combined.byteLength < 13) throw new Error('Invalid ciphertext')
  const iv = combined.slice(0, 12)
  const ct = combined.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

// Use the service-role client for JWT verification — this works regardless
// of whether the project signs JWTs with HS256 (legacy) or ES256 (new
// asymmetric default), because verification goes through Supabase's auth
// server which holds the right verification keys.
const adminAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const DAILY_LIMIT = 350

const APP_URL = Deno.env.get('APP_URL') ?? '*'

const cors = {
  // CORS lockdown: only allow requests from the deployed app origin
  // (falls back to * if APP_URL is unset, e.g. local dev).
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing auth' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    // Verify JWT via service-role client. Pass the token explicitly so the
    // SDK calls Supabase's /auth/v1/user endpoint to verify — this works
    // for both HS256 and ES256 (asymmetric) signing algorithms.
    const { data: { user }, error: authErr } = await adminAuth.auth.getUser(token)
    if (authErr || !user) {
      return json({ error: `Unauthorized: ${authErr?.message || 'invalid session'}` }, 401)
    }

    // Use service-role client for the profile read — bypasses RLS but we've
    // already verified the user identity above and only read THEIR row.
    const { data: profile } = await adminAuth
      .from('profiles')
      .select('claude_api_key, claude_api_key_encrypted, subscription_status')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_status !== 'active' && profile?.subscription_status !== 'trialing') {
      return json({ error: 'Subscription required' }, 402)
    }

    // Resolve the actual API key: prefer the encrypted column (new path),
    // fall back to the legacy plaintext column for users who haven't yet
    // re-saved their key after the encryption migration.
    let apiKey = ''
    if (profile?.claude_api_key_encrypted) {
      try {
        apiKey = await decryptSecret(profile.claude_api_key_encrypted)
      } catch (e) {
        return json({ error: `Could not decrypt stored key — please re-save it in Profile. (${e.message})` }, 500)
      }
    } else if (profile?.claude_api_key) {
      apiKey = profile.claude_api_key
    }
    if (!apiKey) return json({ error: 'No Claude API key set in profile' }, 400)

    // Reuse the service-role client for usage tracking
    const admin = adminAuth

    const { data: usedToday } = await admin.rpc('ai_usage_today', { uid: user.id })
    const used = usedToday ?? 0

    if (used >= DAILY_LIMIT) {
      return json({
        error: `Daily AI limit reached (${DAILY_LIMIT}/day). Resets in 24h.`,
        limitReached: true,
        used,
        limit: DAILY_LIMIT,
      }, 429)
    }

    // Log this call BEFORE making the request, so a long-running stream still counts.
    await admin.from('ai_usage').insert({ user_id: user.id })

    const { prompt, system } = await req.json()

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        stream: true,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return json({ error: `Anthropic error: ${errText}` }, anthropicRes.status)
    }

    // Surface usage to the client via headers so UI can warn at thresholds
    return new Response(anthropicRes.body, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'X-Usage-Used': String(used + 1),
        'X-Usage-Limit': String(DAILY_LIMIT),
      },
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
