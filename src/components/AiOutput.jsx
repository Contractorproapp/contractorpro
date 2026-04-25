import { Loader2, Copy, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'

/**
 * Themed AI output panel — shown by Estimates, Leads, Marketing.
 * Header has stamp eyebrow + copy button; body streams the AI text.
 */
export default function AiOutput({ text, loading, error, label = 'AI Output' }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!loading && !text && !error) return null

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-brand-500" />
          <span className="stamp-label text-foreground">{label}</span>
        </div>
        {text && (
          <button onClick={copy} className="btn-ghost text-xs py-1 px-2">
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        )}
      </div>
      <div className="p-4">
        {loading && !text && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" />
            Generating…
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {text && (
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
            {text}
            {loading && <span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 animate-pulse align-middle" />}
          </pre>
        )}
      </div>
    </div>
  )
}
