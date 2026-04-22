import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const DAY_MS = 24 * 60 * 60 * 1000

const startOfWeek = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay())
  return x
}

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

export default function Calendar() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  useEffect(() => {
    if (!user) return
    supabase.from('projects').select('*').eq('user_id', user.id)
      .then(({ data }) => setProjects(data || []))
  }, [user])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS))
  }, [weekStart])

  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS)

  const projectsByDay = useMemo(() => {
    if (!projects) return []
    return days.map(day => {
      const dayEnd = new Date(day.getTime() + DAY_MS)
      return projects.filter(p => {
        const start = parseDate(p.start_date)
        const end = parseDate(p.end_date) || start
        if (!start) return false
        return start < dayEnd && (end || start) >= day
      })
    })
  }, [projects, days])

  const shift = (n) => setWeekStart(new Date(weekStart.getTime() + n * 7 * DAY_MS))
  const today = () => setWeekStart(startOfWeek(new Date()))

  const isToday = (d) => {
    const t = new Date()
    return d.toDateString() === t.toDateString()
  }

  if (!projects) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your jobs, scheduled by week</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
          <button onClick={today} className="btn-secondary text-sm">Today</button>
          <button onClick={() => shift(1)} className="btn-secondary p-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Week of {fmt(weekStart)} – {fmt(new Date(weekEnd.getTime() - DAY_MS))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map((day, i) => {
          const items = projectsByDay[i] || []
          return (
            <div key={day.toISOString()} className={`card p-3 min-h-[160px] ${isToday(day) ? 'ring-2 ring-brand-500' : ''}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isToday(day) ? 'text-brand-600' : 'text-gray-800'}`}>
                {day.getDate()}
              </div>
              <div className="mt-2 space-y-1">
                {items.length === 0 && <div className="text-xs text-gray-300">—</div>}
                {items.map(p => (
                  <Link
                    key={p.id}
                    to="/projects"
                    className={`block text-xs px-2 py-1 rounded border ${STATUS_COLORS[p.status] || STATUS_COLORS.Planning} truncate`}
                    title={`${p.name} · ${p.client || ''}`}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {projects.filter(p => p.start_date).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CalIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No scheduled projects yet. Add start/end dates on <Link to="/projects" className="text-brand-600 hover:underline">a project</Link> to see it here.</p>
        </div>
      )}
    </div>
  )
}
