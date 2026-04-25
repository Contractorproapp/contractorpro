import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Loader2, Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { cn } from '../lib/utils'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay       = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const startOfWeek      = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x }
const startOfMonth     = (d) => { const x = startOfDay(d); x.setDate(1); return x }
const startOfMonthGrid = (d) => startOfWeek(startOfMonth(d))
const iso              = (d) => d.toISOString().slice(0, 10)

const parseDate = (s) => {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return isNaN(d) ? null : d
}

// Token-driven status palette for events (works in both modes)
const STATUS_COLORS = {
  Planning:      'bg-muted text-foreground border-border',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  Complete:      'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'On Hold':     'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
}
const STATUSES = Object.keys(STATUS_COLORS)

const sameDay   = (a, b) => a.toDateString() === b.toDateString()
const sameMonth = (a, b) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

export default function Calendar() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [view, setView] = useState('month')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [statusFilter, setStatusFilter] = useState(new Set(STATUSES))
  const [dayDetail, setDayDetail] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('*').eq('user_id', user.id)
      .then(({ data }) => setProjects(data || []))
  }, [user])

  const weekStart  = useMemo(() => startOfWeek(anchor), [anchor])
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor])
  const gridStart  = useMemo(() => startOfMonthGrid(anchor), [anchor])

  const daysForView = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 },  (_, i) => new Date(weekStart.getTime() + i * DAY_MS))
    return                   Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * DAY_MS))
  }, [view, weekStart, gridStart])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => statusFilter.has(p.status || 'Planning'))
  }, [projects, statusFilter])

  const projectsOnDay = useCallback((day) => {
    const dayEnd = new Date(day.getTime() + DAY_MS)
    return filteredProjects.filter(p => {
      const start = parseDate(p.start_date)
      const end   = parseDate(p.end_date) || start
      if (!start) return false
      return start < dayEnd && end >= day
    })
  }, [filteredProjects])

  const shift = useCallback((n) => {
    setAnchor(prev => {
      const next = new Date(prev)
      if (view === 'week') next.setDate(next.getDate() + n * 7)
      else                 next.setMonth(next.getMonth() + n)
      return startOfDay(next)
    })
  }, [view])

  const goToday = () => setAnchor(startOfDay(new Date()))

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'Escape' && dayDetail) { setDayDetail(null); return }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); shift(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); shift(1) }
      else if (e.key === 't' || e.key === 'T') goToday()
      else if (e.key === 'w' || e.key === 'W') setView('week')
      else if (e.key === 'm' || e.key === 'M') setView('month')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shift, dayDetail])

  const toggleStatus = (s) => {
    setStatusFilter(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  if (!projects) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  )

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS)
  const today   = startOfDay(new Date())

  const headerLabel = view === 'week'
    ? `Week of ${fmt(weekStart)} – ${fmt(weekEnd)}`
    : monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totalThisRange = daysForView.reduce((s, d) => s + projectsOnDay(d).length, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-border lg:border-0">
        <PageHeader
          eyebrow="// Schedule"
          title="Calendar"
          subtitle={
            <span className="hidden sm:inline">
              Shortcuts:{' '}
              <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-mono">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-mono">→</kbd> nav ·{' '}
              <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-mono">T</kbd> today ·{' '}
              <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-mono">W</kbd>/
              <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-mono">M</kbd> view
            </span>
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex rounded-lg border border-border overflow-hidden text-sm" role="tablist">
                {['week', 'month'].map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    role="tab"
                    aria-selected={view === v}
                    className={cn(
                      'relative px-3 py-1.5 capitalize font-display font-semibold tracking-tight transition-colors cursor-pointer',
                      view === v
                        ? 'text-white'
                        : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {view === v && (
                      <motion.span
                        layoutId="cal-view-pill"
                        className="absolute inset-0 bg-brand-600"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative">{v}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => shift(-1)} className="btn-secondary p-2" aria-label="Previous">
                <ChevronLeft size={16} />
              </button>
              <button onClick={goToday} className="btn-secondary text-sm">Today</button>
              <button onClick={() => shift(1)} className="btn-secondary p-2" aria-label="Next">
                <ChevronRight size={16} />
              </button>
            </div>
          }
        />

        <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="font-display font-bold text-lg text-foreground">{headerLabel}</div>
            <input
              type="date"
              value={iso(anchor)}
              onChange={e => { const d = parseDate(e.target.value); if (d) setAnchor(d) }}
              className="input py-1 px-2 text-sm w-auto"
              aria-label="Jump to date"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-muted-foreground" />
            {STATUSES.map(s => {
              const on = statusFilter.has(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border font-semibold tracking-tight transition-opacity cursor-pointer',
                    STATUS_COLORS[s],
                    on ? '' : 'opacity-30'
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="stamp-label text-muted-foreground mt-2.5">
          {totalThisRange} project{totalThisRange === 1 ? '' : 's'} in view
        </div>
      </div>

      {/* Views */}
      {view === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {daysForView.map(day => {
            const items   = projectsOnDay(day)
            const isToday = sameDay(day, today)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setDayDetail(day)}
                className={cn(
                  'card p-3 min-h-[160px] text-left transition-all hover:shadow-md cursor-pointer',
                  isToday && 'ring-2 ring-brand-500'
                )}
              >
                <div className="stamp-label text-muted-foreground">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={cn(
                  'font-display font-bold text-lg',
                  isToday ? 'text-brand-600 dark:text-brand-400' : 'text-foreground'
                )}>
                  {day.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {items.length === 0 && <div className="text-xs text-muted-foreground/60">—</div>}
                  {items.map(p => (
                    <div
                      key={p.id}
                      className={cn(
                        'text-xs px-2 py-1 rounded border font-medium truncate',
                        STATUS_COLORS[p.status] || STATUS_COLORS.Planning
                      )}
                      title={`${p.name} · ${p.client || ''}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 bg-muted/60 border-b border-border">
            {weekdayLabels.map(w => (
              <div key={w} className="stamp-label text-muted-foreground px-2 py-2 text-center">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysForView.map((day, idx) => {
              const items   = projectsOnDay(day)
              const inMonth = sameMonth(day, monthStart)
              const isToday = sameDay(day, today)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setDayDetail(day)}
                  className={cn(
                    'min-h-[100px] border-r border-b border-border p-1.5 text-left transition-colors cursor-pointer',
                    inMonth ? 'bg-card hover:bg-accent/40' : 'bg-muted/30',
                    (idx + 1) % 7 === 0 && 'border-r-0'
                  )}
                >
                  <div className={cn(
                    'text-xs font-display font-semibold mb-1 inline-flex items-center justify-center',
                    isToday
                      ? 'bg-brand-600 text-white rounded-full w-5 h-5'
                      : inMonth ? 'text-foreground' : 'text-muted-foreground/50'
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map(p => (
                      <div
                        key={p.id}
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border font-medium truncate leading-tight',
                          STATUS_COLORS[p.status] || STATUS_COLORS.Planning
                        )}
                        title={`${p.name} · ${p.client || ''}`}
                      >
                        {p.name}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1.5">+{items.length - 3} more</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {projects.filter(p => p.start_date).length === 0 && (
        <EmptyState
          icon={CalIcon}
          title="No scheduled projects yet"
          description={
            <>
              Add start/end dates on{' '}
              <Link to="/projects?new=1" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                a project
              </Link>{' '}
              to see it here.
            </>
          }
        />
      )}

      {/* Day detail modal */}
      <AnimatePresence>
        {dayDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setDayDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="card max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
              <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <div>
                  <p className="stamp-label text-brand-600 dark:text-brand-400">// Day Detail</p>
                  <h2 className="font-display font-bold text-lg text-foreground mt-0.5">
                    {dayDetail.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {projectsOnDay(dayDetail).length} project{projectsOnDay(dayDetail).length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={() => setDayDetail(null)}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-2">
                {projectsOnDay(dayDetail).length === 0 && (
                  <div className="text-center py-6">
                    <CalIcon size={32} className="mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground mb-3">Nothing scheduled.</p>
                    <Link to="/projects?new=1" className="btn-primary text-sm inline-flex">
                      <CalIcon size={14} /> Schedule a project
                    </Link>
                  </div>
                )}
                {projectsOnDay(dayDetail).map(p => {
                  const start = parseDate(p.start_date)
                  const end   = parseDate(p.end_date)
                  return (
                    <Link key={p.id} to="/projects" className="block card-hover p-3 cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold text-foreground truncate">{p.name}</span>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight border',
                          STATUS_COLORS[p.status || 'Planning']
                        )}>
                          {p.status || 'Planning'}
                        </span>
                      </div>
                      {p.client && <div className="text-xs text-muted-foreground mt-1">{p.client}</div>}
                      {start && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {start.toLocaleDateString()}{end && !sameDay(start, end) ? ` – ${end.toLocaleDateString()}` : ''}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
