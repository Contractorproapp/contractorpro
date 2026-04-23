import { supabase } from './supabase'

export async function streamClaude({ prompt, system, onChunk, onDone, onError }) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      onError?.('Not signed in')
      return
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, system }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      onError?.(err?.error || `API error ${res.status}`)
      return
    }

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
