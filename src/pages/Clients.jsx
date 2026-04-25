import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Phone, Mail, MapPin, FileText, Receipt, FolderOpen, Search, Loader2, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'

const norm = (s) => (s || '').trim().toLowerCase()
const fmt = (n) => `$${Math.round(n).toLocaleString()}`

export default function Clients() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id),
      supabase.from('estimates').select('*').eq('user_id', user.id),
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id),
    ]).then(([l, e, i, p]) => {
      setData({
        leads: l.data || [],
        estimates: e.data || [],
        invoices: i.data || [],
        projects: p.data || [],
      })
    })
  }, [user])

  const clients = useMemo(() => {
    if (!data) return []
    const map = new Map()
    const add = (name, info, record, type) => {
      const key = norm(name)
      if (!key) return
      if (!map.has(key)) map.set(key, {
        name: name.trim(), phone: '', email: '', address: '',
        leads: [], estimates: [], invoices: [], projects: [],
      })
      const c = map.get(key)
      if (info.phone   && !c.phone)   c.phone = info.phone
      if (info.email   && !c.email)   c.email = info.email
      if (info.address && !c.address) c.address = info.address
      c[type].push(record)
    }
    data.leads.forEach(l => add(l.name, { phone: l.phone, email: l.email }, l, 'leads'))
    data.estimates.forEach(e => add(e.client_name, { phone: e.phone, email: e.email, address: e.address }, e, 'estimates'))
    data.invoices.forEach(i => add(i.client_name, { phone: i.client_phone, email: i.client_email }, i, 'invoices'))
    data.projects.forEach(p => add(p.client, { address: p.address }, p, 'projects'))

    return Array.from(map.values())
      .map(c => ({
        ...c,
        totalBilled: c.invoices.reduce((s, i) => s + (i.total || 0), 0),
        totalPaid:   c.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0),
      }))
      .sort((a, b) => b.totalBilled - a.totalBilled || a.name.localeCompare(b.name))
  }, [data])

  const filtered = clients.filter(c =>
    !query
    || c.name.toLowerCase().includes(query.toLowerCase())
    || c.phone?.includes(query)
    || c.email?.toLowerCase().includes(query.toLowerCase())
  )

  if (!data) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Workspace"
        title="Clients"
        subtitle="Everyone you've worked with — leads, estimates, invoices, projects."
      />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input pl-9"
          placeholder="Search by name, phone, or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyClients hasAny={clients.length > 0} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((c, i) => (
            <motion.button
              key={c.name}
              onClick={() => setSelected(c)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
              className="card-hover p-4 text-left cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-semibold text-foreground truncate">{c.name}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} />{c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                        <Mail size={11} />{c.email}
                      </span>
                    )}
                  </div>
                </div>
                {c.totalBilled > 0 && (
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-base tabular-nums text-foreground">
                      {fmt(c.totalBilled)}
                    </div>
                    <div className="stamp-label text-muted-foreground">Billed</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.leads.length     > 0 && <Pill>{c.leads.length} lead{c.leads.length > 1 ? 's' : ''}</Pill>}
                {c.estimates.length > 0 && <Pill>{c.estimates.length} est.</Pill>}
                {c.invoices.length  > 0 && <Pill>{c.invoices.length} inv.</Pill>}
                {c.projects.length  > 0 && <Pill>{c.projects.length} proj.</Pill>}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

              <div className="p-5 sm:p-6 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="stamp-label text-brand-600 dark:text-brand-400">// Client</p>
                    <h2 className="font-display font-bold text-2xl text-foreground mt-1 truncate">{selected.name}</h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-muted-foreground hover:text-foreground p-1.5 -mt-1.5 -mr-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400">
                      <Phone size={13} />{selected.phone}
                    </a>
                  )}
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400">
                      <Mail size={13} />{selected.email}
                    </a>
                  )}
                  {selected.address && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin size={13} />{selected.address}
                    </span>
                  )}
                </div>

                <div className="flex gap-6 mt-4">
                  <div>
                    <div className="stamp-label text-muted-foreground">Billed</div>
                    <div className="font-display font-bold text-lg tabular-nums text-foreground">{fmt(selected.totalBilled)}</div>
                  </div>
                  <div>
                    <div className="stamp-label text-muted-foreground">Paid</div>
                    <div className="font-display font-bold text-lg tabular-nums text-green-600 dark:text-green-500">{fmt(selected.totalPaid)}</div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {selected.estimates.length > 0 && (
                  <Group icon={FileText} title="Estimates">
                    {selected.estimates.map(e => (
                      <Row key={e.id}
                        left={<>{e.job_title || 'Estimate'} <span className="text-muted-foreground text-xs">· {new Date(e.created_at).toLocaleDateString()}</span></>}
                        right={<span className="font-semibold tabular-nums">{fmt(e.total || 0)}</span>}
                      />
                    ))}
                  </Group>
                )}
                {selected.invoices.length > 0 && (
                  <Group icon={Receipt} title="Invoices">
                    {selected.invoices.map(i => (
                      <Row key={i.id}
                        left={<>{i.invoice_number || 'Invoice'} <span className="text-muted-foreground text-xs">· {i.status}</span></>}
                        right={<span className="font-semibold tabular-nums">{fmt(i.total || 0)}</span>}
                      />
                    ))}
                  </Group>
                )}
                {selected.projects.length > 0 && (
                  <Group icon={FolderOpen} title="Projects">
                    {selected.projects.map(p => (
                      <Row key={p.id}
                        left={p.name}
                        right={<span className="text-muted-foreground text-xs">{p.status}</span>}
                      />
                    ))}
                  </Group>
                )}
                {selected.leads.length > 0 && (
                  <Group icon={Users} title="Leads">
                    {selected.leads.map(l => (
                      <Row key={l.id}
                        left={l.job_type || 'Lead'}
                        right={<span className="text-muted-foreground text-xs">{l.status}</span>}
                      />
                    ))}
                  </Group>
                )}

                <div className="pt-2 flex flex-wrap gap-2 border-t border-border pt-4">
                  <Link to="/estimates?new=1" className="btn-secondary text-xs"><FileText size={13} /> New Estimate</Link>
                  <Link to="/invoices?new=1"  className="btn-secondary text-xs"><Receipt size={13} /> New Invoice</Link>
                  <Link to="/projects?new=1"  className="btn-secondary text-xs"><FolderOpen size={13} /> New Project</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-stamp font-semibold bg-muted text-muted-foreground border border-border">
      {children}
    </span>
  )
}

function Group({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 stamp-label text-muted-foreground">
        <Icon size={12} /> {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Row({ left, right }) {
  return (
    <div className="flex justify-between items-center gap-3 text-sm py-1.5 border-b border-border/60 last:border-0">
      <span className="text-foreground min-w-0 truncate">{left}</span>
      <span className="shrink-0">{right}</span>
    </div>
  )
}

function EmptyClients({ hasAny }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/20 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
        <Users size={22} />
      </div>
      <p className="font-display font-semibold text-foreground">
        {hasAny ? 'No clients match your search' : 'No clients yet'}
      </p>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
        {hasAny
          ? 'Try a different name, phone, or email.'
          : 'Add leads, estimates, or invoices and clients will roll up here automatically.'}
      </p>
    </div>
  )
}
