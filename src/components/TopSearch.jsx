import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const HIDE_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/onboarding', '/subscribe', '/privacy', '/terms',
]
const HIDE_SHARES = ['/invoice/', '/estimate/', '/project/']

export default function TopSearch() {
  const location = useLocation()
  const { user } = useAuth()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  if (!user) return null
  if (HIDE_PREFIXES.some(p => location.pathname.startsWith(p))) return null
  if (HIDE_SHARES.some(p => location.pathname.startsWith(p))) return null

  const open = () => window.dispatchEvent(new CustomEvent('open-command-palette'))

  return (
    <button
      onClick={open}
      aria-label="Search"
      className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:border-steel-300 dark:hover:border-steel-600 transition-all text-sm text-muted-foreground w-64 cursor-pointer"
    >
      <Search size={14} />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
