import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const ICONS = {
  success: { Icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-200' },
  error:   { Icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  info:    { Icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
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
    error:   (m, d) => push('error', m, d),
    info:    (m, d) => push('info', m, d),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-sm">
        {toasts.map(({ id, type, message }) => {
          const { Icon, color } = ICONS[type] || ICONS.info
          return (
            <div key={id} className={`flex items-start gap-2 p-3 pr-9 rounded-lg border shadow-lg ${color} animate-in slide-in-from-right relative`}>
              <Icon size={16} className="shrink-0 mt-0.5" />
              <div className="text-sm flex-1">{message}</div>
              <button onClick={() => remove(id)} className="absolute top-2 right-2 opacity-50 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
