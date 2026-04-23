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
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
      <div className="bg-white rounded-xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-1.5 text-sm">
          {items.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between py-1">
              <span className="text-gray-700">{label}</span>
              <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">{keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">Tip: press <kbd className="px-1 bg-gray-100 rounded text-[10px]">g</kbd> then a letter within 1 second to navigate.</p>
      </div>
    </div>
  )
}
