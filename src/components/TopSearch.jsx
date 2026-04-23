import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function TopSearch() {
  const location = useLocation()
  const { user } = useAuth()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  if (!user) return null
  const hideOn = ['/login', '/signup', '/onboarding', '/subscribe', '/privacy', '/terms']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null
  if (location.pathname.startsWith('/invoice/') || location.pathname.startsWith('/estimate/') || location.pathname.startsWith('/project/')) return null

  const open = () => window.dispatchEvent(new CustomEvent('open-command-palette'))

  return (
    <button
      onClick={open}
      className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-sm text-gray-400 w-64"
      aria-label="Search"
    >
      <Search size={14} />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  )
}
