import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const DAILY_LIMIT = 350

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing auth' }, 401)

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: profile } = await supabase
      .from('profiles').select('claude_api_key, subscription_status').eq('id', user.id).single()

    if (!profile?.claude_api_key) return json({ error: 'No Claude API key set in profile' }, 400)

    if (profile.subscription_status !== 'active' && profile.subscription_status !== 'trialing') {
      return json({ error: 'Subscription required' }, 402)
    }

    // Service-role client for usage table writes
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

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
        'x-api-key': profile.claude_api_key,
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
