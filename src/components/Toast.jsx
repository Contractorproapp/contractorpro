import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const TONES = {
  success: {
    Icon: CheckCircle2,
    classes: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  error: {
    Icon: AlertTriangle,
    classes: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  info: {
    Icon: Info,
    classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  const push = useCallback((type, message, duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, type, message }])
    if (duration > 0) setTimeout(() => remove(id), duration)
  }, [remove])

  const api = {
    success: (m, d) => push('success', m, d),
    error:   (m, d) => push('error',   m, d),
    info:    (m, d) => push('info',    m, d),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(({ id, type, message }) => {
            const tone = TONES[type] || TONES.info
            const Icon = tone.Icon
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0,  scale: 1 }}
                exit={{    opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-start gap-2 p-3 pr-9 rounded-lg border shadow-lg backdrop-blur-sm relative pointer-events-auto ${tone.classes}`}
              >
                <Icon size={16} className={`shrink-0 mt-0.5 ${tone.iconClass}`} />
                <div className="text-sm flex-1 font-medium">{message}</div>
                <button
                  onClick={() => remove(id)}
                  aria-label="Dismiss"
                  className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
