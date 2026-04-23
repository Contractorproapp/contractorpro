import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function UsageWarning() {
  const [info, setInfo] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e) => { setInfo(e.detail); setDismissed(false) }
    window.addEventListener('ai-usage', handler)
    return () => window.removeEventListener('ai-usage', handler)
  }, [])

  if (!info || dismissed) return null

  const remaining = info.limit - info.used
  const atLimit = remaining <= 0
  const color = atLimit ? 'bg-red-50 border-red-300 text-red-800' : 'bg-yellow-50 border-yellow-300 text-yellow-800'

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm shadow-lg rounded-lg border p-4 ${color}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">
            {atLimit ? 'AI daily limit reached' : `${Math.round(info.pct * 100)}% of daily AI limit used`}
          </p>
          <p className="text-xs mt-1 opacity-90">
            {info.used} / {info.limit} calls in the last 24h.
            {atLimit
              ? ' Resets in 24 hours.'
              : ` ${remaining} remaining.`}
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 shrink-0" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
