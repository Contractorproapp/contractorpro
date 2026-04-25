import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText, Users, Receipt, FolderOpen, Megaphone,
  User, Menu, X, LogOut, LayoutDashboard,
  Contact, Calendar as CalendarIcon, Wallet,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/estimates',  icon: FileText,        label: 'Estimates' },
  { to: '/leads',      icon: Users,           label: 'Leads'     },
  { to: '/clients',    icon: Contact,         label: 'Clients'   },
  { to: '/invoices',   icon: Receipt,         label: 'Invoices'  },
  { to: '/projects',   icon: FolderOpen,      label: 'Projects'  },
  { to: '/calendar',   icon: CalendarIcon,    label: 'Calendar'  },
  { to: '/expenses',   icon: Wallet,          label: 'Expenses'  },
  { to: '/marketing',  icon: Megaphone,       label: 'Marketing' },
]

/**
 * Industrial nav item — steel base, orange active indicator slides via
 * framer-motion `layoutId`. Gives a tactile "click to seat" feel.
 */
function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'text-white'
            : 'text-steel-300 hover:text-white hover:bg-steel-800/60'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-md bg-steel-800 ring-1 ring-inset ring-steel-700"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          {isActive && (
            <motion.span
              layoutId="sidebar-active-bar"
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-500"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <Icon size={18} className="relative shrink-0" />
          <span className="relative truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

/**
 * Stamped logo block — orange plate, monogram + business name, blueprint hint.
 */
function LogoBlock({ profile }) {
  return (
    <div className="flex items-center gap-3">
      {profile?.logo_url ? (
        <img
          src={profile.logo_url}
          alt="Logo"
          className="w-9 h-9 rounded-md object-cover ring-1 ring-steel-700"
        />
      ) : (
        <img
          src="/hammer.svg"
          alt="ContractorPro"
          className="w-9 h-9 rounded-md ring-1 ring-black/20"
        />
      )}
      <div className="min-w-0">
        <div className="font-display font-bold text-sm leading-tight truncate text-white">
          {profile?.business_name || 'ContractorPro'}
        </div>
        <div className="text-[10px] uppercase tracking-stamp text-steel-400 mt-0.5">
          Field Ops
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setMobileOpen(true)
    window.addEventListener('open-mobile-drawer', handler)
    return () => window.removeEventListener('open-mobile-drawer', handler)
  }, [])

  const close = () => setMobileOpen(false)

  const handleSignOut = async () => {
    try { await signOut() } catch {}
    window.location.href = '/login'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-steel-950 text-steel-100 relative overflow-hidden">
      {/* Subtle blueprint grid bleed at top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Orange accent bar — top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 py-4 border-b border-steel-800">
        <LogoBlock profile={profile} />
        <button
          onClick={close}
          className="lg:hidden text-steel-400 hover:text-white transition-colors p-1.5 -mr-1.5 rounded-md hover:bg-steel-800"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Section label */}
      <div className="relative px-4 pt-4 pb-2 stamp-label text-steel-500">
        Workspace
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.to} {...item} onClick={close} />)}
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-4 border-t border-steel-800 pt-3 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={close}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-steel-800 text-white ring-1 ring-inset ring-steel-700'
                : 'text-steel-300 hover:text-white hover:bg-steel-800/60'
            )
          }
        >
          <User size={18} />
          Profile & Settings
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-steel-300 hover:bg-steel-800/60 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <div className="px-3 pt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-steel-500 truncate" title={user?.email}>{user?.email}</p>
          <ThemeToggle className="bg-steel-900 border-steel-700 text-steel-200 hover:bg-steel-800 h-8 w-8" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-steel-950 text-white flex items-center justify-between px-3 py-2.5 border-b border-steel-800">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
        <div className="flex items-center gap-2">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt="Logo" className="w-8 h-8 rounded-md object-cover ring-1 ring-steel-700" />
          ) : (
            <img src="/hammer.svg" alt="ContractorPro" className="w-8 h-8 rounded-md ring-1 ring-black/20" />
          )}
          <span className="font-display font-bold text-sm truncate max-w-[160px]">
            {profile?.business_name || 'ContractorPro'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="bg-steel-900 border-steel-700 text-steel-200 hover:bg-steel-800 h-9 w-9" />
          <button
            onClick={() => setMobileOpen(true)}
            className="text-steel-200 hover:text-white p-2 rounded-md hover:bg-steel-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="relative w-64 h-full shadow-2xl"
          >
            {sidebarContent}
          </motion.aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0 border-r border-steel-900">
        {sidebarContent}
      </aside>
    </>
  )
}
