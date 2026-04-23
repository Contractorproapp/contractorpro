import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Receipt, FileText, Users, FolderOpen, AlertTriangle, Clock, ArrowRight, Loader2,
  Contact, Calendar as CalendarIcon, Wallet, Megaphone, Car,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import OnboardingChecklist from '../components/OnboardingChecklist'

const IRS_MILEAGE_RATE = 0.67
const DAY_MS = 24 * 60 * 60 * 1000

function StatCard({ label, value, sub, color = 'text-gray-800' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

const parseDate = (s) => {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return isNaN(d) ? null : d
}

const norm = (s) => (s || '').trim().toLowerCase()

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [invRes, leadRes, estRes, projRes, expRes, milRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('user_id', user.id),
        supabase.from('leads').select('*').eq('user_id', user.id),
        supabase.from('estimates').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('mileage').select('*').eq('user_id', user.id),
      ])
      setData({
        invoices:  invRes.data  || [],
        leads:     leadRes.data || [],
        estimates: estRes.data  || [],
        projects:  projRes.data || [],
        expenses:  expRes.data  || [],
        mileage:   milRes.data  || [],
      })
    }
    load()
  }, [user])

  const derived = useMemo(() => {
    if (!data) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekOut = new Date(today.getTime() + 7 * DAY_MS)
    const year = today.getFullYear()

    const upcoming = data.projects
      .filter(p => {
        const s = parseDate(p.start_date); const e = parseDate(p.end_date) || s
        if (!s) return false
        return s < weekOut && e >= today
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 4)

    const clientSet = new Set()
    data.leads.forEach(l => l.name && clientSet.add(norm(l.name)))
    data.estimates.forEach(e => e.client_name && clientSet.add(norm(e.client_name)))
    data.invoices.forEach(i => i.client_name && clientSet.add(norm(i.client_name)))
    data.projects.forEach(p => p.client && clientSet.add(norm(p.client)))

    const ytdExpenses = data.expenses.filter(e => new Date(e.date).getFullYear() === year)
      .reduce((s, e) => s + (e.amount || 0), 0)
    const ytdMiles = data.mileage.filter(m => new Date(m.date).getFullYear() === year)
      .reduce((s, m) => s + (m.miles || 0), 0)
    const mileageDeduction = ytdMiles * IRS_MILEAGE_RATE

    return { upcoming, clientCount: clientSet.size, ytdExpenses, ytdMiles, mileageDeduction }
  }, [data])

  if (!data) return (
    <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
  )

  const outstanding = data.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.total || 0), 0)
  const collected   = data.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0)
  const newLeads    = data.leads.filter(l => l.status === 'New').length
  const pendingCOs  = data.projects.reduce((s, p) => s + (p.change_orders || []).filter(c => c.status === 'Pending').length, 0)
  const unsigned    = data.estimates.filter(e => e.status === 'Sent' && !e.signed_at).length
  const overdue     = data.invoices.filter(i => i.status === 'Overdue')

  const recentInvoices = [...data.invoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4)

  const hi = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()
  const firstName = profile?.business_name?.split(' ')[0] || 'there'

  const navTiles = [
    { to: '/estimates', icon: FileText,   label: 'Estimates',  count: data.estimates.length },
    { to: '/invoices',  icon: Receipt,    label: 'Invoices',   count: data.invoices.length },
    { to: '/leads',     icon: Users,      label: 'Leads',      count: data.leads.length },
    { to: '/clients',   icon: Contact,    label: 'Clients',    count: derived.clientCount },
    { to: '/projects',  icon: FolderOpen, label: 'Projects',   count: data.projects.length },
    { to: '/calendar',  icon: CalendarIcon, label: 'Calendar', count: derived.upcoming.length, sub: 'upcoming' },
    { to: '/expenses',  icon: Wallet,     label: 'Expenses',   count: data.expenses.length },
    { to: '/marketing', icon: Megaphone,  label: 'Marketing',  count: null },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold">{hi}, {firstName}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what needs attention today</p>
      </div>

      <OnboardingChecklist profile={profile} counts={{
        estimates: data.estimates.length,
        leads: data.leads.length,
        invoices: data.invoices.length,
      }} />

      {/* Money stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Outstanding" value={`$${outstanding.toFixed(0)}`} color="text-red-600" sub={`${data.invoices.filter(i => i.status !== 'Paid').length} unpaid`} />
        <StatCard label="Collected" value={`$${collected.toFixed(0)}`} color="text-green-600" sub={`${data.invoices.filter(i => i.status === 'Paid').length} paid`} />
        <StatCard label="YTD Expenses" value={`$${derived.ytdExpenses.toFixed(0)}`} sub={`${derived.ytdMiles.toFixed(0)} mi logged`} />
        <StatCard label="Mileage Deduction" value={`$${derived.mileageDeduction.toFixed(0)}`} color="text-green-600" sub={`@ $${IRS_MILEAGE_RATE}/mi`} />
      </div>

      {/* Action items */}
      <div className="grid md:grid-cols-2 gap-4">
        {overdue.length > 0 && (
          <div className="card p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-semibold">Overdue Invoices</h3>
              <span className="badge bg-red-100 text-red-700">{overdue.length}</span>
            </div>
            <div className="space-y-1">
              {overdue.slice(0, 3).map(inv => (
                <div key={inv.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{inv.client_name} · {inv.invoice_number}</span>
                  <span className="font-medium">${(inv.total || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <Link to="/invoices" className="text-xs text-brand-600 hover:underline mt-2 inline-flex items-center gap-1">View all <ArrowRight size={11} /></Link>
          </div>
        )}

        {pendingCOs > 0 && (
          <div className="card p-4 border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-yellow-500" />
              <h3 className="font-semibold">Pending Change Orders</h3>
              <span className="badge bg-yellow-100 text-yellow-700">{pendingCOs}</span>
            </div>
            <p className="text-sm text-gray-500">Awaiting approval across your projects</p>
            <Link to="/projects" className="text-xs text-brand-600 hover:underline mt-2 inline-flex items-center gap-1">Review <ArrowRight size={11} /></Link>
          </div>
        )}

        {unsigned > 0 && (
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-500" />
              <h3 className="font-semibold">Estimates Awaiting Signature</h3>
              <span className="badge bg-blue-100 text-blue-700">{unsigned}</span>
            </div>
            <p className="text-sm text-gray-500">Follow up with clients who haven't signed yet</p>
            <Link to="/estimates" className="text-xs text-brand-600 hover:underline mt-2 inline-flex items-center gap-1">View <ArrowRight size={11} /></Link>
          </div>
        )}

        {newLeads > 0 && (
          <div className="card p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-green-500" />
              <h3 className="font-semibold">New Leads</h3>
              <span className="badge bg-green-100 text-green-700">{newLeads}</span>
            </div>
            <p className="text-sm text-gray-500">Reach out before they go cold</p>
            <Link to="/leads" className="text-xs text-brand-600 hover:underline mt-2 inline-flex items-center gap-1">View <ArrowRight size={11} /></Link>
          </div>
        )}
      </div>

      {/* Two-column: Upcoming + Recent invoices */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><CalendarIcon size={16} /> This Week</h3>
            <Link to="/calendar" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">Calendar <ArrowRight size={11} /></Link>
          </div>
          {derived.upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No scheduled jobs. <Link to="/projects" className="text-brand-600 hover:underline">Add a project</Link>.</p>
          ) : (
            <div className="space-y-2">
              {derived.upcoming.map(p => (
                <Link key={p.id} to="/calendar" className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0 hover:text-brand-600">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.client || '—'} · {new Date(p.start_date).toLocaleDateString()}</div>
                  </div>
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{p.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Receipt size={16} /> Recent Invoices</h3>
            <Link to="/invoices" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">All <ArrowRight size={11} /></Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No invoices yet. <Link to="/invoices" className="text-brand-600 hover:underline">Create one</Link>.</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium">{inv.client_name || 'No client'}</div>
                    <div className="text-xs text-gray-500">{inv.invoice_number} · {new Date(inv.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                    <span className="font-bold">${(inv.total || 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All sections — full nav tiles */}
      <div>
        <h3 className="font-semibold mb-3">Jump to</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {navTiles.map(({ to, icon: Icon, label, count, sub }) => (
            <Link key={to} to={to} className="card p-4 hover:bg-gray-50 hover:shadow-md transition-all">
              <Icon size={20} className="text-brand-500 mb-2" />
              <div className="text-sm font-semibold">{label}</div>
              {count !== null && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {count} {sub || (count === 1 ? 'item' : 'items')}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick create buttons */}
      <div>
        <h3 className="font-semibold mb-3">Quick create</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link to="/estimates" className="card p-3 text-center hover:bg-gray-50 transition-colors">
            <FileText size={18} className="mx-auto text-brand-500 mb-1" />
            <div className="text-xs font-medium">Estimate</div>
          </Link>
          <Link to="/invoices" className="card p-3 text-center hover:bg-gray-50 transition-colors">
            <Receipt size={18} className="mx-auto text-brand-500 mb-1" />
            <div className="text-xs font-medium">Invoice</div>
          </Link>
          <Link to="/leads" className="card p-3 text-center hover:bg-gray-50 transition-colors">
            <Users size={18} className="mx-auto text-brand-500 mb-1" />
            <div className="text-xs font-medium">Lead</div>
          </Link>
          <Link to="/projects" className="card p-3 text-center hover:bg-gray-50 transition-colors">
            <FolderOpen size={18} className="mx-auto text-brand-500 mb-1" />
            <div className="text-xs font-medium">Project</div>
          </Link>
          <Link to="/expenses" className="card p-3 text-center hover:bg-gray-50 transition-colors">
            <Car size={18} className="mx-auto text-brand-500 mb-1" />
            <div className="text-xs font-medium">Expense</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
