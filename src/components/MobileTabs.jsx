import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Receipt, Contact, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const TABS = [
  { to: '/',          Icon: LayoutDashboard, label: 'Home' },
  { to: '/estimates', Icon: FileText,        label: 'Estimates' },
  { to: '/invoices',  Icon: Receipt,         label: 'Invoices' },
  { to: '/clients',   Icon: Contact,         label: 'Clients' },
]

const HIDE_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/onboarding', '/subscribe', '/privacy', '/terms',
]
const HIDE_SHARES = ['/invoice/', '/estimate/', '/project/']

export default function MobileTabs({ onMore }) {
  const location = useLocation()
  if (HIDE_PREFIXES.some(p => location.pathname.startsWith(p))) return null
  if (HIDE_SHARES.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-card/95 backdrop-blur border-t border-border',
        'grid grid-cols-5 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      {TABS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold tracking-tight transition-colors',
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="mobiletabs-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-500"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={20} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={onMore}
        className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold tracking-tight text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  )
}
