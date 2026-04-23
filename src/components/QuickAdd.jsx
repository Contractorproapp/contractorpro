import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, FileText, Receipt, Users, FolderOpen, Car } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ITEMS = [
  { to: '/estimates', Icon: FileText,   label: 'Estimate',  color: 'bg-blue-500' },
  { to: '/invoices',  Icon: Receipt,    label: 'Invoice',   color: 'bg-green-500' },
  { to: '/leads',     Icon: Users,      label: 'Lead',      color: 'bg-purple-500' },
  { to: '/projects',  Icon: FolderOpen, label: 'Project',   color: 'bg-orange-500' },
  { to: '/expenses',  Icon: Car,        label: 'Expense',   color: 'bg-pink-500' },
]

export default function QuickAdd() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!user) return null
  const hideOn = ['/login', '/signup', '/forgot-password', '/reset-password', '/onboarding', '/subscribe', '/privacy', '/terms']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null
  if (location.pathname.startsWith('/invoice/') || location.pathname.startsWith('/estimate/') || location.pathname.startsWith('/project/')) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Quick add"
      >
        <Plus size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[55] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Quick Add</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ITEMS.map(({ to, Icon, label, color }) => (
                <button key={to}
                  onClick={() => { setOpen(false); navigate(`${to}?new=1`) }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
