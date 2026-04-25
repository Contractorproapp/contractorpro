import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Phone, Mail, Trash2, Sparkles, User, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'
import { formatPhone } from '../lib/format'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { cn } from '../lib/utils'

const SYSTEM = `You are a contractor business assistant. Write short, professional, warm follow-up messages for contractors to send to leads and past clients. Sound like a real person — brief, warm, clear call to action.`

// Status palette — left bar + dropdown badge
const STATUS_TONES = {
  New:       { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Contacted: { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' },
  Quoted:    { bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' },
  Won:       { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  Lost:      { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

export default function Leads() {
  const { user, profile } = useAuth()
  const [leads, setLeads]       = useState([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [followUpType, setFollowUpType] = useState('text')
  const [form, setForm] = useState({ name:'', phone:'', email:'', job_type:'', notes:'', status:'New' })
  const [output, setOutput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setFetching(false) })
  }, [user])

  const addLead = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase.from('leads').insert({ user_id: user.id, ...form }).select().single()
    if (data) {
      setLeads(prev => [data, ...prev])
      setForm({ name:'', phone:'', email:'', job_type:'', notes:'', status:'New' })
      setShowForm(false)
    }
  }

  const updateStatus = async (id, status) => {
    await supabase.from('leads').update({ status, last_contact: new Date().toISOString().slice(0, 10) }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, last_contact: new Date().toLocaleDateString() } : l))
  }

  const deleteLead = async (id) => {
    await supabase.from('leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const generateFollowUp = (lead) => {
    setSelected(lead); setOutput(''); setError(''); setLoading(true)
    if (!profile?.claude_api_key) { setError('No API key — add yours in Profile & Settings.'); setLoading(false); return }

    const prompt = `Write a follow-up ${followUpType} for a contractor to send to:
Name: ${lead.name}
Job Type: ${lead.job_type || 'general contracting'}
Status: ${lead.status}
Notes: ${lead.notes || 'none'}
Message type: ${followUpType}`

    streamClaude({
      system: SYSTEM,
      prompt,
      onChunk: (_, full) => setOutput(full),
      onDone: async () => {
        setLoading(false)
        await supabase.from('leads').update({ last_contact: new Date().toISOString().slice(0, 10) }).eq('id', lead.id)
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, last_contact: new Date().toLocaleDateString() } : l))
      },
      onError: (msg) => { setError(msg); setLoading(false) },
    })
  }

  const newCount = leads.filter(l => l.status === 'New').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Pipeline"
        title="Leads & Follow-ups"
        subtitle={newCount > 0 ? `${newCount} new lead${newCount === 1 ? '' : 's'} waiting for outreach.` : "Never let a lead go cold again."}
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Add Lead
          </button>
        }
      />

      {/* New lead form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="card p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="stamp-label text-brand-600 dark:text-brand-400">// New Entry</p>
                  <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Add Lead</h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name <span className="text-brand-600">*</span></label>
                  <input className="input" placeholder="Sarah Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="label">Job Type</label>
                  <input className="input" placeholder="Bathroom remodel, roof repair…" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="sarah@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input h-20 resize-none" placeholder="Called about a leaky roof. Wants someone this week." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={addLead} className="btn-primary"><Plus size={15} /> Add Lead</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-3">
        {fetching && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!fetching && leads.length === 0 && (
          <EmptyState
            icon={User}
            title="No leads yet"
            description="Track people who reached out but haven't signed. Add one to see AI-generated follow-up messages."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={15} /> Add your first lead
              </button>
            }
          />
        )}

        {leads.map((lead, i) => {
          const tone = STATUS_TONES[lead.status] || STATUS_TONES.New
          const isSelected = selected?.id === lead.id
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.15), ease: [0.22, 1, 0.36, 1] }}
              className="card p-4 pl-5 relative overflow-hidden"
            >
              <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', tone.bar)} />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold text-foreground">{lead.name}</span>
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className={cn(
                        'cursor-pointer text-xs font-semibold tracking-tight rounded-full px-2.5 py-0.5 border-0 outline-none focus:ring-2 focus:ring-ring',
                        tone.badge
                      )}
                    >
                      {Object.keys(STATUS_TONES).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  {lead.job_type && <p className="text-sm text-muted-foreground mt-0.5">{lead.job_type}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400">
                        <Phone size={11} />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400">
                        <Mail size={11} />{lead.email}
                      </a>
                    )}
                    {lead.last_contact && (
                      <span className="stamp-label">CONTACTED · {lead.last_contact}</span>
                    )}
                  </div>
                  {lead.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2">
                      "{lead.notes}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex rounded-md border border-border overflow-hidden text-xs">
                    {['text', 'email', 'call script'].map(t => (
                      <button
                        key={t}
                        onClick={() => setFollowUpType(t)}
                        className={cn(
                          'px-2.5 py-1.5 capitalize transition-colors cursor-pointer font-semibold tracking-tight',
                          followUpType === t
                            ? 'bg-brand-600 text-white'
                            : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => generateFollowUp(lead)}
                    disabled={loading && isSelected}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    <Sparkles size={13} /> Follow Up
                  </button>
                  <button
                    onClick={() => deleteLead(lead.id)}
                    aria-label="Delete lead"
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4">
                  <AiOutput text={output} loading={loading} error={error} label={`AI ${followUpType} draft`} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
