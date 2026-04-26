import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

const ROUTES = {
  d: '/',
  e: '/estimates',
  l: '/leads',
  c: '/clients',
  i: '/invoices',
  p: '/projects',
  k: '/calendar',
  x: '/expenses',
  m: '/marketing',
  s: '/profile',
}

export default function KeyboardShortcuts() {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [gPressed, setGPressed] = useState(false)

  useEffect(() => {
    let timeout
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === '?') { e.preventDefault(); setShowHelp(s => !s); return }
      if (e.key === 'Escape' && showHelp) { setShowHelp(false); return }

      if (e.key === 'g' || e.key === 'G') {
        setGPressed(true)
        clearTimeout(timeout)
        timeout = setTimeout(() => setGPressed(false), 1200)
        return
      }

      if (gPressed) {
        const route = ROUTES[e.key.toLowerCase()]
        if (route) { e.preventDefault(); navigate(route) }
        setGPressed(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timeout) }
  }, [navigate, gPressed, showHelp])

  if (!showHelp) return null

  const items = [
    ['? ', 'Toggle this help'],
    ['g d', 'Dashboard'],
    ['g e', 'Estimates'],
    ['g l', 'Leads'],
    ['g c', 'Clients'],
    ['g i', 'Invoices'],
    ['g p', 'Projects'],
    ['g k', 'Calendar'],
    ['g x', 'Expenses'],
    ['g m', 'Marketing'],
    ['g s', 'Settings / Profile'],
  ]

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="card max-w-sm w-full p-5 shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="stamp-label text-brand-600 dark:text-brand-400">// Hotkeys</p>
            <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-1.5 text-sm">
          {items.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between py-1">
              <span className="text-foreground">{label}</span>
              <kbd className="px-2 py-0.5 bg-muted border border-border rounded text-xs font-mono text-muted-foreground">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Tip: press{' '}
          <kbd className="px-1 bg-muted text-muted-foreground rounded text-[10px] font-mono">g</kbd>{' '}
          then a letter within 1 second to navigate.
        </p>
      </div>
    </div>
  )
}
