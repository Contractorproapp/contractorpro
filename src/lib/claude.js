import { supabase } from './supabase'

export async function streamClaude({ prompt, system, onChunk, onDone, onError }) {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    // [DEBUG] Session diagnostics
    console.group('[Claude Debug] Session check')
    console.log('Has session:', !!session)
    console.log('User ID:', session?.user?.id)
    console.log('User email:', session?.user?.email)
    console.log('Token (first 20 chars):', session?.access_token?.slice(0, 20) + '…')
    console.log('Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown')
    console.log('Token expired?:', session?.expires_at ? Date.now() / 1000 > session.expires_at : 'unknown')
    console.groupEnd()

    if (!session) {
      onError?.('Not signed in')
      return
    }

    // [DEBUG] Read profile to confirm what key is actually saved
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('claude_api_key, subscription_status')
      .eq('id', session.user.id)
      .single()
    console.group('[Claude Debug] Profile check')
    console.log('Profile fetch error:', profErr)
    console.log('Subscription status:', prof?.subscription_status)
    console.log('Has key in profile:', !!prof?.claude_api_key)
    console.log('Key length:', prof?.claude_api_key?.length)
    console.log('Key prefix:', prof?.claude_api_key?.slice(0, 15))
    console.log('Key suffix:', prof?.claude_api_key?.slice(-6))
    console.log('Has whitespace:', prof?.claude_api_key !== prof?.claude_api_key?.trim())
    console.groupEnd()

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`
    console.log('[Claude Debug] POST', url)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, system }),
    })

    // [DEBUG] Always log proxy response status + body
    console.group('[Claude Debug] Proxy response')
    console.log('Status:', res.status, res.statusText)
    console.log('Headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const text = await res.text()
      console.log('Body:', text)
      console.groupEnd()
      let parsed = {}
      try { parsed = JSON.parse(text) } catch {}
      onError?.(parsed?.error || `API error ${res.status}: ${text.slice(0, 200)}`)
      return
    }
    console.log('OK — streaming begins')
    console.groupEnd()

    const used = parseInt(res.headers.get('X-Usage-Used') || '0', 10)
    const limit = parseInt(res.headers.get('X-Usage-Limit') || '0', 10)
    if (limit && used) {
      const pct = used / limit
      if (pct >= 0.8) {
        // Surface threshold warnings via a custom event the UI can listen to
        window.dispatchEvent(new CustomEvent('ai-usage', { detail: { used, limit, pct } }))
      }
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '', full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break
        try {
          const text = JSON.parse(data)?.delta?.text || ''
          if (text) { full += text; onChunk?.(text, full) }
        } catch {}
      }
    }
    onDone?.(full)
  } catch (e) {
    onError?.(e.message || 'Network error')
  }
}
