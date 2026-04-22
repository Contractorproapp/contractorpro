import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const startOfWeek = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x }
const startOfMonth = (d) => { const x = startOfDay(d); x.setDate(1); return x }
const startOfMonthGrid = (d) => startOfWeek(startOfMonth(d))

const parseDate = (s) => {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return isNaN(d) ? null : d
}

const STATUS_COLORS = {
  Planning:    'bg-gray-100 text-gray-700 border-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
  Complete:    'bg-green-100 text-green-700 border-green-300',
  'On Hold':   'bg-yellow-100 text-yellow-700 border-yellow-300',
}

const sameDay = (a, b) => a.toDateString() === b.toDateString()
const sameMonth = (a, b) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

export default function Calendar() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [view, setView] = useState('month')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('*').eq('user_id', user.id)
      .then(({ data }) => setProjects(data || []))
  }, [user])

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor])
  const gridStart = useMemo(() => startOfMonthGrid(anchor), [anchor])

  const daysForView = useMemo(() => {
    if (view === 'week') {
      return Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS))
    }
    return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * DAY_MS))
  }, [view, weekStart, gridStart])

  const projectsOnDay = (day) => {
    if (!projects) return []
    const dayEnd = new Date(day.getTime() + DAY_MS)
    return projects.filter(p => {
      const start = parseDate(p.start_date)
      const end = parseDate(p.end_date) || start
      if (!start) return false
      return start < dayEnd && end >= day
    })
  }

  const shift = (n) => {
    const next = new Date(anchor)
    if (view === 'week') next.setDate(next.getDate() + n * 7)
    else next.setMonth(next.getMonth() + n)
    setAnchor(startOfDay(next))
  }
  const goToday = () => setAnchor(startOfDay(new Date()))

  if (!projects) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS)
  const today = startOfDay(new Date())

  const headerLabel = view === 'week'
    ? `Week of ${fmt(weekStart)} – ${fmt(weekEnd)}`
    : monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your jobs, scheduled</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {['week', 'month'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 capitalize transition-colors ${view === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => shift(-1)} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
          <button onClick={goToday} className="btn-secondary text-sm">Today</button>
          <button onClick={() => shift(1)} className="btn-secondary p-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="text-sm text-gray-500">{headerLabel}</div>

      {view === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {daysForView.map(day => {
            const items = projectsOnDay(day)
            return (
              <div key={day.toISOString()} className={`card p-3 min-h-[160px] ${sameDay(day, today) ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${sameDay(day, today) ? 'text-brand-600' : 'text-gray-800'}`}>
                  {day.getDate()}
                </div>
                <div className="mt-2 space-y-1">
                  {items.length === 0 && <div className="text-xs text-gray-300">—</div>}
                  {items.map(p => (
                    <Link key={p.id} to="/projects"
                      className={`block text-xs px-2 py-1 rounded border ${STATUS_COLORS[p.status] || STATUS_COLORS.Planning} truncate`}
                      title={`${p.name} · ${p.client || ''}`}>
                      {p.name}
                    </Link>
                  ))}
                </div>
              </div>
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
                <div key={day.toISOString()}
                  className={`min-h-[110px] border-r border-b p-1.5 ${!inMonth ? 'bg-gray-50/50' : 'bg-white'} ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}`}>
                  <div className={`text-xs font-medium mb-1 inline-flex items-center justify-center ${isToday ? 'bg-brand-600 text-white rounded-full w-5 h-5' : inMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map(p => (
                      <Link key={p.id} to="/projects"
                        className={`block text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[p.status] || STATUS_COLORS.Planning} truncate leading-tight`}
                        title={`${p.name} · ${p.client || ''}`}>
                        {p.name}
                      </Link>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1.5">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
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
    </div>
  )
}
