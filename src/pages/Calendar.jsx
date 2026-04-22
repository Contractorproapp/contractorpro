import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Loader2, Filter, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const startOfWeek = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x }
const startOfMonth = (d) => { const x = startOfDay(d); x.setDate(1); return x }
const startOfMonthGrid = (d) => startOfWeek(startOfMonth(d))
const iso = (d) => d.toISOString().slice(0, 10)

const parseDate = (s) => {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return isNaN(d) ? null : d
}

const STATUS_COLORS = {
  Planning:      'bg-gray-100 text-gray-700 border-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
  Complete:      'bg-green-100 text-green-700 border-green-300',
  'On Hold':     'bg-yellow-100 text-yellow-700 border-yellow-300',
}
const STATUSES = Object.keys(STATUS_COLORS)

const sameDay = (a, b) => a.toDateString() === b.toDateString()
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

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor])
  const gridStart = useMemo(() => startOfMonthGrid(anchor), [anchor])

  const daysForView = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS))
    return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * DAY_MS))
  }, [view, weekStart, gridStart])

  const filteredProjects = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => statusFilter.has(p.status || 'Planning'))
  }, [projects, statusFilter])

  const projectsOnDay = useCallback((day) => {
    const dayEnd = new Date(day.getTime() + DAY_MS)
    return filteredProjects.filter(p => {
      const start = parseDate(p.start_date)
      const end = parseDate(p.end_date) || start
      if (!start) return false
      return start < dayEnd && end >= day
    })
  }, [filteredProjects])

  const shift = useCallback((n) => {
    setAnchor(prev => {
      const next = new Date(prev)
      if (view === 'week') next.setDate(next.getDate() + n * 7)
      else next.setMonth(next.getMonth() + n)
      return startOfDay(next)
    })
  }, [view])

  const goToday = () => setAnchor(startOfDay(new Date()))

  // Keyboard shortcuts: ←/→ navigate, T today, W/M view, Esc close modal
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'Escape' && dayDetail) { setDayDetail(null); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); shift(-1) }
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

  if (!projects) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS)
  const today = startOfDay(new Date())

  const headerLabel = view === 'week'
    ? `Week of ${fmt(weekStart)} – ${fmt(weekEnd)}`
    : monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totalThisRange = daysForView.reduce((s, d) => s + projectsOnDay(d).length, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-4 pt-14 lg:pt-0">
      {/* Sticky header with controls */}
      <div className="sticky top-0 lg:top-0 z-20 bg-white/95 backdrop-blur pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 border-b lg:border-0">
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
              Shortcuts: <kbd className="px-1 bg-gray-100 rounded text-[10px]">←</kbd> <kbd className="px-1 bg-gray-100 rounded text-[10px]">→</kbd> nav · <kbd className="px-1 bg-gray-100 rounded text-[10px]">T</kbd> today · <kbd className="px-1 bg-gray-100 rounded text-[10px]">W</kbd>/<kbd className="px-1 bg-gray-100 rounded text-[10px]">M</kbd> view
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm" role="tablist" aria-label="Calendar view">
              {['week', 'month'].map(v => (
                <button key={v} onClick={() => setView(v)} role="tab" aria-selected={view === v}
                  className={`px-3 py-1.5 capitalize transition-colors ${view === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => shift(-1)} className="btn-secondary p-2" aria-label="Previous"><ChevronLeft size={16} /></button>
            <button onClick={goToday} className="btn-secondary text-sm" aria-label="Go to today">Today</button>
            <button onClick={() => shift(1)} className="btn-secondary p-2" aria-label="Next"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-lg font-semibold">{headerLabel}</div>
            <input
              type="date"
              value={iso(anchor)}
              onChange={e => { const d = parseDate(e.target.value); if (d) setAnchor(d) }}
              className="input py-1 px-2 text-sm w-auto"
              aria-label="Jump to date"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-gray-400" />
            {STATUSES.map(s => {
              const on = statusFilter.has(s)
              return (
                <button key={s} onClick={() => toggleStatus(s)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-opacity ${STATUS_COLORS[s]} ${on ? '' : 'opacity-30'}`}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {totalThisRange} project{totalThisRange === 1 ? '' : 's'} in view
        </div>
      </div>

      {/* Views */}
      {view === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {daysForView.map(day => {
            const items = projectsOnDay(day)
            const isToday = sameDay(day, today)
            return (
              <button key={day.toISOString()} onClick={() => setDayDetail(day)}
                className={`card p-3 min-h-[160px] text-left transition-shadow hover:shadow-md cursor-pointer ${isToday ? 'ring-2 ring-brand-500' : ''}`}
                aria-label={`${day.toLocaleDateString()} — ${items.length} projects`}>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-brand-600' : 'text-gray-800'}`}>
                  {day.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {items.length === 0 && <div className="text-xs text-gray-300">—</div>}
                  {items.map(p => (
                    <div key={p.id}
                      className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[p.status] || STATUS_COLORS.Planning} truncate`}
                      title={`${p.name} · ${p.client || ''}`}>
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
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {weekdayLabels.map(w => (
              <div key={w} className="text-xs text-gray-500 uppercase tracking-wide px-2 py-2 text-center font-medium">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysForView.map((day, idx) => {
              const items = projectsOnDay(day)
              const inMonth = sameMonth(day, monthStart)
              const isToday = sameDay(day, today)
              return (
                <button key={day.toISOString()} onClick={() => setDayDetail(day)}
                  className={`min-h-[100px] border-r border-b p-1.5 text-left transition-colors cursor-pointer hover:bg-brand-50 ${!inMonth ? 'bg-gray-50/50' : 'bg-white'} ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                  aria-label={`${day.toLocaleDateString()} — ${items.length} projects`}>
                  <div className={`text-xs font-medium mb-1 inline-flex items-center justify-center ${isToday ? 'bg-brand-600 text-white rounded-full w-5 h-5' : inMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map(p => (
                      <div key={p.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[p.status] || STATUS_COLORS.Planning} truncate leading-tight`}
                        title={`${p.name} · ${p.client || ''}`}>
                        {p.name}
                      </div>
                    ))}
                    {items.length > 3 && <div className="text-[10px] text-gray-500 px-1.5">+{items.length - 3} more</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {projects.filter(p => p.start_date).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CalIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No scheduled projects yet. Add start/end dates on <Link to="/projects" className="text-brand-600 hover:underline">a project</Link> to see it here.</p>
        </div>
      )}

      {/* Day detail modal */}
      {dayDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDayDetail(null)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold">{dayDetail.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{projectsOnDay(dayDetail).length} project{projectsOnDay(dayDetail).length === 1 ? '' : 's'}</p>
              </div>
              <button onClick={() => setDayDetail(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-2">
              {projectsOnDay(dayDetail).length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <CalIcon size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm mb-3">Nothing scheduled.</p>
                  <Link to="/projects" className="btn-primary text-sm inline-flex"><CalIcon size={14} /> Schedule a project</Link>
                </div>
              )}
              {projectsOnDay(dayDetail).map(p => {
                const start = parseDate(p.start_date)
                const end = parseDate(p.end_date)
                return (
                  <Link key={p.id} to="/projects" className="block card p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className={`badge text-xs ${STATUS_COLORS[p.status || 'Planning']}`}>{p.status || 'Planning'}</span>
                    </div>
                    {p.client && <div className="text-xs text-gray-500 mt-1">{p.client}</div>}
                    {start && (
                      <div className="text-xs text-gray-400 mt-1">
                        {start.toLocaleDateString()}{end && !sameDay(start, end) ? ` – ${end.toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
