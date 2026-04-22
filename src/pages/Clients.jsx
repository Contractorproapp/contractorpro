import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Phone, Mail, MapPin, FileText, Receipt, FolderOpen, Search, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const norm = (s) => (s || '').trim().toLowerCase()

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
      if (!map.has(key)) map.set(key, { name: name.trim(), phone: '', email: '', address: '', leads: [], estimates: [], invoices: [], projects: [] })
      const c = map.get(key)
      if (info.phone && !c.phone) c.phone = info.phone
      if (info.email && !c.email) c.email = info.email
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
        totalPaid: c.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0),
      }))
      .sort((a, b) => b.totalBilled - a.totalBilled || a.name.localeCompare(b.name))
  }, [data])

  const filtered = clients.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.includes(query) || c.email?.toLowerCase().includes(query.toLowerCase())
  )

  if (!data) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-gray-500 text-sm mt-0.5">Everyone you've worked with in one place</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search by name, phone, or email…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{clients.length === 0 ? 'No clients yet. Add leads, estimates, or invoices to get started.' : 'No clients match your search.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(c => (
            <button key={c.name} onClick={() => setSelected(c)} className="card p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="font-semibold truncate">{c.name}</div>
                {c.totalBilled > 0 && <span className="text-sm font-medium text-gray-700 shrink-0 ml-2">${c.totalBilled.toFixed(0)}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                {c.phone && <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>}
                {c.email && <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                {c.leads.length > 0 && <span>{c.leads.length} lead{c.leads.length > 1 ? 's' : ''}</span>}
                {c.estimates.length > 0 && <span>{c.estimates.length} est.</span>}
                {c.invoices.length > 0 && <span>{c.invoices.length} inv.</span>}
                {c.projects.length > 0 && <span>{c.projects.length} proj.</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                {selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-1 hover:text-brand-600"><Phone size={13} />{selected.phone}</a>}
                {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-1 hover:text-brand-600"><Mail size={13} />{selected.email}</a>}
                {selected.address && <span className="flex items-center gap-1"><MapPin size={13} />{selected.address}</span>}
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <div><span className="text-gray-500">Billed:</span> <span className="font-semibold">${selected.totalBilled.toFixed(0)}</span></div>
                <div><span className="text-gray-500">Paid:</span> <span className="font-semibold text-green-600">${selected.totalPaid.toFixed(0)}</span></div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {selected.estimates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><FileText size={14} /> Estimates</div>
                  {selected.estimates.map(e => (
                    <div key={e.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span>{e.job_title || 'Estimate'} <span className="text-gray-400 text-xs">· {new Date(e.created_at).toLocaleDateString()}</span></span>
                      <span className="font-medium">${(e.total || 0).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.invoices.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><Receipt size={14} /> Invoices</div>
                  {selected.invoices.map(i => (
                    <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span>{i.invoice_number || 'Invoice'} <span className="text-gray-400 text-xs">· {i.status}</span></span>
                      <span className="font-medium">${(i.total || 0).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.projects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><FolderOpen size={14} /> Projects</div>
                  {selected.projects.map(p => (
                    <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span>{p.name}</span>
                      <span className="text-gray-500 text-xs">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {selected.leads.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><Users size={14} /> Leads</div>
                  {selected.leads.map(l => (
                    <div key={l.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span>{l.job_type || 'Lead'}</span>
                      <span className="text-gray-500 text-xs">{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 flex flex-wrap gap-2">
                <Link to="/estimates" className="btn-secondary text-xs"><FileText size={13} /> New Estimate</Link>
                <Link to="/invoices" className="btn-secondary text-xs"><Receipt size={13} /> New Invoice</Link>
                <Link to="/projects" className="btn-secondary text-xs"><FolderOpen size={13} /> New Project</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
