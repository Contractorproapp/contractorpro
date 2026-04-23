import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Receipt, Contact, Menu } from 'lucide-react'

const TABS = [
  { to: '/',          Icon: LayoutDashboard, label: 'Home' },
  { to: '/estimates', Icon: FileText,        label: 'Estimates' },
  { to: '/invoices',  Icon: Receipt,         label: 'Invoices' },
  { to: '/clients',   Icon: Contact,         label: 'Clients' },
]

export default function MobileTabs({ onMore }) {
  const location = useLocation()
  const hideOn = ['/login', '/signup', '/onboarding', '/subscribe', '/privacy', '/terms']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null
  if (location.pathname.startsWith('/invoice/') || location.pathname.startsWith('/estimate/') || location.pathname.startsWith('/project/')) return null

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 grid grid-cols-5 shadow-lg">
      {TABS.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${isActive ? 'text-brand-600' : 'text-gray-500'}`
          }>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button onClick={onMore}
        className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-gray-500">
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  )
}
