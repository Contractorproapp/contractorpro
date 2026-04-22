import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText, Users, Receipt, FolderOpen, Megaphone,
  User, Hammer, Menu, X, LogOut, LayoutDashboard,
  Contact, Calendar as CalendarIcon, Wallet,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

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

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = () => setMobileOpen(false)

  const handleSignOut = async () => {
    try { await signOut() } catch {}
    window.location.href = '/login'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          {profile?.logo_url
            ? <img src={profile.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center"><Hammer size={16} className="text-white" /></div>
          }
          <div>
            <div className="font-bold text-sm leading-none truncate max-w-[140px]">
              {profile?.business_name || 'ContractorPro'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Your business, handled</div>
          </div>
        </div>
        <button onClick={close} className="lg:hidden text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.to} {...item} onClick={close} />)}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-gray-700 pt-3 space-y-0.5">
        <NavLink
          to="/profile"
          onClick={close}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <User size={18} />
          Profile & Settings
        </NavLink>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <div className="px-3 pt-2">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {profile?.logo_url
            ? <img src={profile.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
            : <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center"><Hammer size={14} className="text-white" /></div>
          }
          <span className="font-bold text-sm">{profile?.business_name || 'ContractorPro'}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-gray-300 hover:text-white">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={close} />
          <aside className="relative w-64 bg-gray-900 text-white h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-gray-900 text-white flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
