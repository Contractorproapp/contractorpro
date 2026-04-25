import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, FileText, Receipt, Users, FolderOpen, Contact,
  Calendar, Wallet, Megaphone, LayoutDashboard, User,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'

const NAV_ITEMS = [
  { type: 'nav', label: 'Dashboard',          to: '/',          Icon: LayoutDashboard },
  { type: 'nav', label: 'Estimates',          to: '/estimates', Icon: FileText },
  { type: 'nav', label: 'Leads',              to: '/leads',     Icon: Users },
  { type: 'nav', label: 'Clients',            to: '/clients',   Icon: Contact },
  { type: 'nav', label: 'Invoices',           to: '/invoices',  Icon: Receipt },
  { type: 'nav', label: 'Projects',           to: '/projects',  Icon: FolderOpen },
  { type: 'nav', label: 'Calendar',           to: '/calendar',  Icon: Calendar },
  { type: 'nav', label: 'Expenses',           to: '/expenses',  Icon: Wallet },
  { type: 'nav', label: 'Marketing',          to: '/marketing', Icon: Megaphone },
  { type: 'nav', label: 'Profile & Settings', to: '/profile',   Icon: User },
]

export default function CommandPalette() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [data, setData] = useState({ invoices: [], estimates: [], leads: [], projects: [] })
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault(); setOpen(true)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [open])

  useEffect(() => {
    if (!open || !user) return
    setQuery(''); setActiveIdx(0)
    setTimeout(() => inputRef.current?.focus(), 50)
    Promise.all([
      supabase.from('invoices').select('id, invoice_number, client_name, total, status').eq('user_id', user.id).limit(200),
      supabase.from('estimates').select('id, job_title, client_name, total').eq('user_id', user.id).limit(200),
      supabase.from('leads').select('id, name, phone').eq('user_id', user.id).limit(200),
      supabase.from('projects').select('id, name, client').eq('user_id', user.id).limit(200),
    ]).then(([i, e, l, p]) => setData({
      invoices:  i.data || [],
      estimates: e.data || [],
      leads:     l.data || [],
      projects:  p.data || [],
    }))
  }, [open, user])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = []
    NAV_ITEMS.forEach(n => items.push(n))
    data.invoices.forEach(i => items.push({ type: 'invoice',  label: `${i.client_name || 'No client'} — ${i.invoice_number}`, sub: `$${(i.total||0).toFixed(0)} · ${i.status}`, to: '/invoices',  Icon: Receipt }))
    data.estimates.forEach(e => items.push({ type: 'estimate', label: e.job_title || 'Estimate', sub: `${e.client_name || ''} · $${(e.total||0).toFixed(0)}`, to: '/estimates', Icon: FileText }))
    data.leads.forEach(l    => items.push({ type: 'lead',     label: l.name, sub: l.phone || '',  to: '/leads',     Icon: Users }))
    data.projects.forEach(p => items.push({ type: 'project',  label: p.name, sub: p.client || '', to: '/projects',  Icon: FolderOpen }))

    if (!q) return items.slice(0, 30)
    return items
      .filter(it => it.label.toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q))
      .slice(0, 30)
  }, [query, data])

  useEffect(() => { setActiveIdx(0) }, [query])

  const choose = (it) => { setOpen(false); navigate(it.to) }

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown')      { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); choose(results[activeIdx]) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="card max-w-xl w-full shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search invoices, leads, projects, or jump to a page…"
                className="flex-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">Esc</kbd>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {results.length === 0 && (
                <div className="px-4 py-10 text-sm text-center text-muted-foreground">No results</div>
              )}
              {results.map((it, idx) => {
                const Icon = it.Icon
                const active = idx === activeIdx
                return (
                  <button
                    key={`${it.type}-${idx}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => choose(it)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-pointer transition-colors',
                      active
                        ? 'bg-brand-50 dark:bg-brand-500/10 text-foreground'
                        : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <Icon size={15} className={active ? 'text-brand-600 dark:text-brand-400 shrink-0' : 'text-muted-foreground shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold truncate">{it.label}</div>
                      {it.sub && <div className="text-xs text-muted-foreground truncate">{it.sub}</div>}
                    </div>
                    <span className="text-[10px] uppercase tracking-stamp font-semibold text-muted-foreground/60">{it.type}</span>
                  </button>
                )
              })}
            </div>

            <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground flex gap-3 bg-muted/40">
              <span><kbd className="px-1.5 py-0.5 bg-card border border-border rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-card border border-border rounded font-mono">↓</kbd> navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-card border border-border rounded font-mono">↵</kbd> open</span>
              <span className="ml-auto"><kbd className="px-1.5 py-0.5 bg-card border border-border rounded font-mono">Ctrl K</kbd> toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
