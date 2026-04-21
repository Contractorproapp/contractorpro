export async function streamClaude({ apiKey, prompt, system, onChunk, onDone, onError }) {
  if (!apiKey) {
    onError?.('No Claude API key. Add yours in Profile & Settings.')
    return
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: [{ type:'text', text:system, cache_control:{ type:'ephemeral' } }],
        messages: [{ role:'user', content:prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      onError?.(err?.error?.message || `API error ${res.status}`)
      return
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '', full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream:true })
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
