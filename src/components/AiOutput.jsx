import { Loader2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function AiOutput({ text, loading, error, label = 'AI Output' }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!loading && !text && !error) return null

  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {text && (
          <button onClick={copy} className="btn-ghost text-xs py-1 px-2">
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        )}
      </div>
      <div className="p-4">
        {loading && !text && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {text && (
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
            {text}
            {loading && <span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 animate-pulse" />}
          </pre>
        )}
      </div>
    </div>
  )
}
