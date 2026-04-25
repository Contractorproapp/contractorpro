import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function UsageWarning() {
  const [info, setInfo] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e) => { setInfo(e.detail); setDismissed(false) }
    window.addEventListener('ai-usage', handler)
    return () => window.removeEventListener('ai-usage', handler)
  }, [])

  const visible = info && !dismissed
  const remaining = info ? info.limit - info.used : 0
  const atLimit = remaining <= 0
  const tone = atLimit
    ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300'
    : 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-300'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-sm shadow-lg rounded-lg border p-4 backdrop-blur-sm',
            tone
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-display font-semibold">
                {atLimit ? 'AI daily limit reached' : `${Math.round(info.pct * 100)}% of daily AI limit used`}
              </p>
              <p className="text-xs mt-1 opacity-90">
                {info.used} / {info.limit} calls in the last 24h.
                {atLimit ? ' Resets in 24 hours.' : ` ${remaining} remaining.`}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="opacity-60 hover:opacity-100 shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
