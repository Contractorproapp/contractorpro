import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react'

const STORAGE_KEY = 'onboarding-dismissed'

export default function OnboardingChecklist({ profile, counts }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  const items = useMemo(() => [
    { done: !!profile?.logo_url,          label: 'Upload your business logo',       to: '/profile' },
    { done: !!profile?.claude_api_key,    label: 'Add your Claude API key (for AI)', to: '/profile' },
    { done: !!profile?.business_name,     label: 'Set your business name',          to: '/profile' },
    { done: counts.estimates > 0,         label: 'Create your first estimate',      to: '/estimates' },
    { done: counts.leads > 0,             label: 'Add your first lead',             to: '/leads' },
    { done: counts.invoices > 0,          label: 'Send your first invoice',         to: '/invoices' },
    { done: !!profile?.google_review_url, label: 'Add Google Review link',          to: '/profile' },
  ], [profile, counts])

  const completed = items.filter(i => i.done).length
  const total = items.length
  const allDone = completed === total

  if (dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="card p-5 border-l-4 border-brand-500 bg-gradient-to-br from-brand-50/50 to-transparent">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-brand-600" />
          <div>
            <h3 className="font-semibold">Get started</h3>
            <p className="text-xs text-gray-500">{completed} of {total} complete</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-300 hover:text-gray-500" aria-label="Dismiss"><X size={16} /></button>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <Link key={i} to={item.to}
            className={`flex items-center gap-2 text-sm py-1 transition-colors ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 hover:text-brand-600'}`}>
            {item.done ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-gray-300 shrink-0" />}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
