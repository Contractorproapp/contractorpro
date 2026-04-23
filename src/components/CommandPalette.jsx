import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Receipt, Users, FolderOpen, Contact, Calendar, Wallet, Megaphone, LayoutDashboard, User, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { type: 'nav', label: 'Dashboard',  to: '/',          Icon: LayoutDashboard },
  { type: 'nav', label: 'Estimates',  to: '/estimates', Icon: FileText },
  { type: 'nav', label: 'Leads',      to: '/leads',     Icon: Users },
  { type: 'nav', label: 'Clients',    to: '/clients',   Icon: Contact },
  { type: 'nav', label: 'Invoices',   to: '/invoices',  Icon: Receipt },
  { type: 'nav', label: 'Projects',   to: '/projects',  Icon: FolderOpen },
  { type: 'nav', label: 'Calendar',   to: '/calendar',  Icon: Calendar },
  { type: 'nav', label: 'Expenses',   to: '/expenses',  Icon: Wallet },
  { type: 'nav', label: 'Marketing',  to: '/marketing', Icon: Megaphone },
  { type: 'nav', label: 'Profile & Settings', to: '/profile', Icon: User },
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
    data.invoices.forEach(i => items.push({ type: 'invoice', label: `${i.client_name || 'No client'} — ${i.invoice_number}`, sub: `$${(i.total||0).toFixed(0)} · ${i.status}`, to: '/invoices', Icon: Receipt }))
    data.estimates.forEach(e => items.push({ type: 'estimate', label: e.job_title || 'Estimate', sub: `${e.client_name || ''} · $${(e.total||0).toFixed(0)}`, to: '/estimates', Icon: FileText }))
    data.leads.forEach(l => items.push({ type: 'lead', label: l.name, sub: l.phone || '', to: '/leads', Icon: Users }))
    data.projects.forEach(p => items.push({ type: 'project', label: p.name, sub: p.client || '', to: '/projects', Icon: FolderOpen }))

    if (!q) return items.slice(0, 30)
    return items
      .filter(it => it.label.toLowerCase().includes(q) || (it.sub || '').toLowerCase().includes(q))
      .slice(0, 30)
  }, [query, data])

  useEffect(() => { setActiveIdx(0) }, [query])

  const choose = (it) => { setOpen(false); navigate(it.to) }

  if (!open) return null

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); choose(results[activeIdx]) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search invoices, leads, projects, or jump to a page…"
            className="flex-1 outline-none text-sm bg-transparent"
          />
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">Esc</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && <div className="px-4 py-8 text-sm text-center text-gray-400">No results</div>}
          {results.map((it, idx) => {
            const Icon = it.Icon
            return (
              <button key={`${it.type}-${idx}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => choose(it)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${idx === activeIdx ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                <Icon size={15} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{it.label}</div>
                  {it.sub && <div className="text-xs text-gray-400 truncate">{it.sub}</div>}
                </div>
                <span className="text-[10px] uppercase text-gray-300">{it.type}</span>
              </button>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t text-[11px] text-gray-400 flex gap-3">
          <span><kbd className="px-1 bg-gray-100 rounded">↑</kbd> <kbd className="px-1 bg-gray-100 rounded">↓</kbd> navigate</span>
          <span><kbd className="px-1 bg-gray-100 rounded">↵</kbd> open</span>
          <span className="ml-auto"><kbd className="px-1 bg-gray-100 rounded">Ctrl K</kbd> toggle</span>
        </div>
      </div>
    </div>
  )
}
