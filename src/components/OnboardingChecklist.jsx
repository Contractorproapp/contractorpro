import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const STORAGE_KEY = 'onboarding-dismissed'

export default function OnboardingChecklist({ profile, counts }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  const items = useMemo(() => [
    { done: !!profile?.logo_url,          label: 'Upload your business logo',         to: '/profile' },
    { done: !!profile?.claude_api_key,    label: 'Add your Claude API key (for AI)',  to: '/profile' },
    { done: !!profile?.business_name,     label: 'Set your business name',            to: '/profile' },
    { done: counts.estimates > 0,         label: 'Create your first estimate',        to: '/estimates?new=1' },
    { done: counts.leads > 0,             label: 'Add your first lead',               to: '/leads?new=1' },
    { done: counts.invoices > 0,          label: 'Send your first invoice',           to: '/invoices?new=1' },
    { done: !!profile?.google_review_url, label: 'Add Google Review link',            to: '/profile' },
  ], [profile, counts])

  const completed = items.filter(i => i.done).length
  const total = items.length
  const allDone = completed === total

  if (dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDismissed(true)
  }

  const pct = (completed / total) * 100

  return (
    <div className="card p-5 relative overflow-hidden">
      {/* Orange top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
      {/* Soft gradient corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/60 to-transparent dark:from-brand-500/5 dark:to-transparent"
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/20 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Rocket size={16} />
            </div>
            <div>
              <p className="stamp-label text-brand-600 dark:text-brand-400">// Get Started</p>
              <p className="text-xs text-muted-foreground">{completed} of {total} complete</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
          />
        </div>

        <div className="space-y-1">
          {items.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className={cn(
                'flex items-center gap-2 text-sm py-1.5 px-2 -mx-2 rounded-md transition-colors',
                item.done
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-accent'
              )}
            >
              {item.done
                ? <CheckCircle2 size={16} className="text-green-500 dark:text-green-400 shrink-0" />
                : <Circle size={16} className="text-muted-foreground/60 shrink-0" />}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
