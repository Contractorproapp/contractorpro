import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Receipt, FileText, Users, FolderOpen, AlertTriangle, Clock, ArrowRight, Loader2,
  Contact, Calendar as CalendarIcon, Wallet, Megaphone, Plus, TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import OnboardingChecklist from '../components/OnboardingChecklist'
import AnimatedNumber from '../components/AnimatedNumber'
import { cn } from '../lib/utils'

const IRS_MILEAGE_RATE = 0.67
const DAY_MS = 24 * 60 * 60 * 1000

const parseDate = (s) => {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return isNaN(d) ? null : d
}
const norm = (s) => (s || '').trim().toLowerCase()
const fmtMoney = (n) => `$${Math.round(n).toLocaleString()}`

/**
 * Industrial stat tile — corner notch + stamped label + animated counter.
 * `tone` controls the corner ribbon color.
 */
function StatTile({ label, value, sub, tone = 'steel', format = fmtMoney, delay = 0 }) {
  const tones = {
    steel:   'from-steel-700 to-steel-900',
    orange:  'from-brand-500 to-brand-700',
    danger:  'from-red-500 to-red-700',
    success: 'from-green-500 to-green-700',
  }
  const valueTone = {
    steel:   'text-foreground',
    orange:  'text-foreground',
    danger:  'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay }}
      className="relative card p-5 overflow-hidden group"
    >
      {/* Corner ribbon */}
      <div
        aria-hidden
        className={cn(
          'absolute -top-px -left-px h-1 w-12 bg-gradient-to-r rounded-tl-2xl',
          tones[tone]
        )}
      />
      <div className="stamp-label">{label}</div>
      <div className={cn('font-display font-bold text-3xl lg:text-[2rem] tabular-nums tracking-tight mt-1.5', valueTone[tone])}>
        <AnimatedNumber value={value} format={format} />
      </div>
      {sub && (
        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          {sub}
        </div>
      )}
    </motion.div>
  )
}

/**
 * Action card — left bar in tone color, icon, title, count badge, CTA link.
 */
function ActionCard({ icon: Icon, title, sub, count, tone, to, ctaLabel = 'View' }) {
  const tones = {
    danger:  { bar: 'bg-red-500',    icon: 'text-red-500',    badge: 'badge-danger'  },
    warning: { bar: 'bg-yellow-500', icon: 'text-yellow-500', badge: 'badge-warning' },
    info:    { bar: 'bg-blue-500',   icon: 'text-blue-500',   badge: 'badge-accent'  },
    success: { bar: 'bg-green-500',  icon: 'text-green-500',  badge: 'badge-success' },
  }
  const t = tones[tone]
  return (
    <Link
      to={to}
      className="relative card-hover p-4 pl-5 group flex flex-col cursor-pointer"
    >
      <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', t.bar)} />
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={16} className={t.icon} />
        <h3 className="font-display font-semibold text-sm text-foreground">{title}</h3>
        {typeof count === 'number' && <span className={t.badge}>{count}</span>}
      </div>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
        {ctaLabel} <ArrowRight size={11} />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
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
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  )

  const outstanding = data.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.total || 0), 0)
  const collected   = data.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0)
  const newLeads    = data.leads.filter(l => l.status === 'New').length
  const pendingCOs  = data.projects.reduce((s, p) => s + (p.change_orders || []).filter(c => c.status === 'Pending').length, 0)
  const unsigned    = data.estimates.filter(e => e.status === 'Sent' && !e.signed_at).length
  const overdue     = data.invoices.filter(i => i.status === 'Overdue')
  const unpaidCount = data.invoices.filter(i => i.status !== 'Paid').length
  const paidCount   = data.invoices.filter(i => i.status === 'Paid').length

  const recentInvoices = [...data.invoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4)

  const hi = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()
  const firstName = profile?.business_name?.split(' ')[0] || 'there'
  const dateStamp = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase()

  const navTiles = [
    { to: '/estimates', icon: FileText,     label: 'Estimates',  count: data.estimates.length },
    { to: '/invoices',  icon: Receipt,      label: 'Invoices',   count: data.invoices.length },
    { to: '/leads',     icon: Users,        label: 'Leads',      count: data.leads.length },
    { to: '/clients',   icon: Contact,      label: 'Clients',    count: derived.clientCount },
    { to: '/projects',  icon: FolderOpen,   label: 'Projects',   count: data.projects.length },
    { to: '/calendar',  icon: CalendarIcon, label: 'Calendar',   count: derived.upcoming.length, sub: 'this week' },
    { to: '/expenses',  icon: Wallet,       label: 'Expenses',   count: data.expenses.length },
    { to: '/marketing', icon: Megaphone,    label: 'Marketing',  count: null },
  ]

  const hasActions = overdue.length > 0 || pendingCOs > 0 || unsigned > 0 || newLeads > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="stamp-label text-brand-600 dark:text-brand-400">// {dateStamp}</p>
          <h1 className="font-display font-bold text-3xl lg:text-4xl tracking-tightest text-foreground mt-2">
            {hi}, {firstName}.
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-base">
            Here's the state of the job site today.
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
          className="btn-primary shrink-0"
        >
          <Plus size={16} /> New
        </button>
      </header>

      <OnboardingChecklist profile={profile} counts={{
        estimates: data.estimates.length,
        leads: data.leads.length,
        invoices: data.invoices.length,
      }} />

      {/* Money stats — bento row */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-muted-foreground" />
          <h2 className="stamp-label text-muted-foreground">Cash Flow</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatTile
            label="Outstanding"
            value={outstanding}
            tone="danger"
            sub={`${unpaidCount} unpaid`}
            delay={0.00}
          />
          <StatTile
            label="Collected"
            value={collected}
            tone="success"
            sub={`${paidCount} paid`}
            delay={0.05}
          />
          <StatTile
            label="YTD Expenses"
            value={derived.ytdExpenses}
            tone="steel"
            sub={`${derived.ytdMiles.toFixed(0)} mi logged`}
            delay={0.10}
          />
          <StatTile
            label="Mileage Deduction"
            value={derived.mileageDeduction}
            tone="orange"
            sub={`@ $${IRS_MILEAGE_RATE}/mi`}
            delay={0.15}
          />
        </div>
      </section>

      {/* Action items */}
      {hasActions && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-muted-foreground" />
            <h2 className="stamp-label text-muted-foreground">Needs Attention</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {overdue.length > 0 && (
              <ActionCard
                tone="danger"
                icon={AlertTriangle}
                title="Overdue Invoices"
                count={overdue.length}
                sub={`${fmtMoney(overdue.reduce((s, i) => s + (i.total || 0), 0))} past due`}
                to="/invoices"
              />
            )}
            {pendingCOs > 0 && (
              <ActionCard
                tone="warning"
                icon={Clock}
                title="Pending COs"
                count={pendingCOs}
                sub="Change orders awaiting approval"
                to="/projects"
                ctaLabel="Review"
              />
            )}
            {unsigned > 0 && (
              <ActionCard
                tone="info"
                icon={FileText}
                title="Awaiting Signature"
                count={unsigned}
                sub="Sent estimates not yet signed"
                to="/estimates"
              />
            )}
            {newLeads > 0 && (
              <ActionCard
                tone="success"
                icon={Users}
                title="New Leads"
                count={newLeads}
                sub="Reach out before they go cold"
                to="/leads"
              />
            )}
          </div>
        </section>
      )}

      {/* Two-column: Upcoming + Recent invoices */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <CalendarIcon size={16} className="text-brand-500" /> This Week
            </h3>
            <Link to="/calendar" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
              Calendar <ArrowRight size={11} />
            </Link>
          </div>
          {derived.upcoming.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-4">
              No scheduled jobs.{' '}
              <Link to="/projects?new=1" className="text-brand-600 dark:text-brand-400 hover:underline not-italic font-semibold">
                Add a project
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-1">
              {derived.upcoming.map(p => (
                <li key={p.id}>
                  <Link
                    to="/calendar"
                    className="flex items-center justify-between gap-3 text-sm py-2 px-2 -mx-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.client || '—'} · {new Date(p.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge-info shrink-0">{p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Receipt size={16} className="text-brand-500" /> Recent Invoices
            </h3>
            <Link to="/invoices" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
              All <ArrowRight size={11} />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-4">
              No invoices yet.{' '}
              <Link to="/invoices?new=1" className="text-brand-600 dark:text-brand-400 hover:underline not-italic font-semibold">
                Create one
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-1">
              {recentInvoices.map(inv => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 text-sm py-2 px-2 -mx-2 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{inv.client_name || 'No client'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {inv.invoice_number} · {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={
                      inv.status === 'Paid' ? 'badge-success'
                      : inv.status === 'Overdue' ? 'badge-danger'
                      : 'badge-info'
                    }>
                      {inv.status}
                    </span>
                    <span className="font-display font-bold tabular-nums">
                      ${(inv.total || 0).toFixed(0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Jump-to nav tiles */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="stamp-label text-muted-foreground">Workspace</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {navTiles.map(({ to, icon: Icon, label, count, sub }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={to}
                className="block card-hover p-4 group cursor-pointer h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/20 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 transition-transform group-hover:scale-105">
                    <Icon size={18} />
                  </div>
                  {count !== null && (
                    <span className="font-display font-bold text-lg tabular-nums text-foreground">
                      {count}
                    </span>
                  )}
                </div>
                <div className="font-display font-semibold text-sm text-foreground">{label}</div>
                {count !== null && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sub || (count === 1 ? 'item' : 'items')}
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
