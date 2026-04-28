import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Service-role client used for both JWT verification (via auth.getUser(token))
// and DB reads. Works for HS256 + ES256 signing because verification runs
// against Supabase's auth server, not locally.
const adminAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? ''

const DAILY_LIMIT = 50

const APP_URL = Deno.env.get('APP_URL') ?? '*'

const cors = {
  // Locked to deployed app origin (matches the other functions)
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

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

// CAN-SPAM compliance footer.
// CONTRACTOR_PRO_ADDRESS = your physical mailing address. Must be a real
// postal address (PO Box is acceptable). Override at deploy time by
// setting the COMPANY_ADDRESS env var on the Edge Function.
const COMPANY_ADDRESS = Deno.env.get('COMPANY_ADDRESS') || '[YOUR BUSINESS MAILING ADDRESS]'

function buildHtml(body: string, businessName?: string) {
  const lines = escapeHtml(body).split('\n').map(l => l || '&nbsp;').join('<br/>')
  // The CAN-SPAM Act (and most equivalent laws) require every commercial
  // email to include a valid physical postal address of the sender.
  // Even though these are transactional one-to-one messages, the safe
  // default is to include it on every send.
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827;line-height:1.55;max-width:560px;margin:24px auto;padding:0 16px">
    <div style="font-size:15px">${lines}</div>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:28px 0"/>
    <p style="font-size:12px;color:#6B7280;line-height:1.5">
      ${businessName ? `Sent via ContractorPro on behalf of ${escapeHtml(businessName)}.<br/>` : ''}
      ContractorPro · ${escapeHtml(COMPANY_ADDRESS)}<br/>
      You're receiving this because ${businessName ? escapeHtml(businessName) : 'a ContractorPro user'} sent it to you directly. Reply to this email to contact them.
    </p>
  </body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return json({ error: 'Email sending is not configured on the server. Contact support.' }, 503)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing auth' }, 401)
    const token = authHeader.replace(/^Bearer\s+/i, '')

    // Verify JWT via service-role client (handles HS256 + ES256)
    const { data: { user }, error: authErr } = await adminAuth.auth.getUser(token)
    if (authErr || !user) {
      return json({ error: `Unauthorized: ${authErr?.message || 'invalid session'}` }, 401)
    }

    const { data: profile } = await adminAuth
      .from('profiles').select('business_name, subscription_status').eq('id', user.id).single()

    if (profile?.subscription_status !== 'active' && profile?.subscription_status !== 'trialing') {
      return json({ error: 'Active subscription required to send email' }, 402)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: usedToday } = await admin.rpc('email_sends_today', { uid: user.id })
    const used = usedToday ?? 0

    if (used >= DAILY_LIMIT) {
      return json({
        error: `Daily email limit reached (${DAILY_LIMIT}/day). Resets in 24h.`,
        limitReached: true, used, limit: DAILY_LIMIT,
      }, 429)
    }

    const { to, subject, body, kind } = await req.json()
    if (!to || !subject || !body) return json({ error: 'Missing to/subject/body' }, 400)

    const fromName = profile?.business_name || 'ContractorPro'
    const from = `${fromName} <${RESEND_FROM_EMAIL}>`
    const replyTo = user.email || undefined

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: buildHtml(body, profile?.business_name),
        reply_to: replyTo,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      return json({ error: `Send failed: ${errText}` }, resendRes.status)
    }

    await admin.from('email_sends').insert({
      user_id: user.id,
      recipient: to,
      subject,
      kind: kind || null,
    })

    const result = await resendRes.json()
    return json({ ok: true, id: result.id, used: used + 1, limit: DAILY_LIMIT })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
