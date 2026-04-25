import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, X, FileText, Receipt, Users, FolderOpen, Car } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const ITEMS = [
  { to: '/estimates', Icon: FileText,   label: 'Estimate', tone: 'from-blue-500 to-blue-600',     iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { to: '/invoices',  Icon: Receipt,    label: 'Invoice',  tone: 'from-green-500 to-green-600',   iconBg: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  { to: '/leads',     Icon: Users,      label: 'Lead',     tone: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  { to: '/projects',  Icon: FolderOpen, label: 'Project',  tone: 'from-brand-500 to-brand-600',   iconBg: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
  { to: '/expenses',  Icon: Car,        label: 'Expense',  tone: 'from-pink-500 to-pink-600',     iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400' },
]

const HIDE_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/onboarding', '/subscribe', '/privacy', '/terms',
]
const HIDE_SHARES = ['/invoice/', '/estimate/', '/project/']

export default function QuickAdd() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  // ESC + open-from-anywhere event
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) setOpen(false) }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-quick-add', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-quick-add', onOpen)
    }
  }, [open])

  if (!user) return null
  if (HIDE_PREFIXES.some(p => location.pathname.startsWith(p))) return null
  if (HIDE_SHARES.some(p => location.pathname.startsWith(p))) return null

  return (
    <>
      {/* Floating action button — stamped industrial look */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40
                   w-14 h-14 rounded-full text-white shadow-lg
                   bg-gradient-to-br from-brand-500 to-brand-700
                   ring-1 ring-brand-700/40
                   flex items-center justify-center
                   transition-all hover:scale-105 hover:shadow-xl active:scale-95
                   cursor-pointer
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="card max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Top orange accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="stamp-label text-brand-600 dark:text-brand-400">// Quick Add</p>
                  <h2 className="font-display font-bold text-xl text-foreground mt-1">
                    Start something new
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5">
                {ITEMS.map(({ to, Icon, label, iconBg }) => (
                  <button
                    key={to}
                    onClick={() => { setOpen(false); navigate(`${to}?new=1`) }}
                    className="group flex flex-col items-center gap-2.5 p-4 rounded-lg
                               bg-card border border-border
                               hover:border-brand-500 hover:bg-accent
                               transition-all cursor-pointer
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className={`w-11 h-11 rounded-md flex items-center justify-center transition-transform group-hover:scale-105 ${iconBg}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-display font-semibold text-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
