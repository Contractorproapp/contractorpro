import { useState, useEffect } from 'react'
import { Plus, Phone, Mail, Trash2, Sparkles, User, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'

const SYSTEM = `You are a contractor business assistant. Write short, professional, warm follow-up messages for contractors to send to leads and past clients. Sound like a real person — brief, warm, clear call to action.`

const STATUS_COLORS = {
  New:'bg-blue-100 text-blue-700', Contacted:'bg-yellow-100 text-yellow-700',
  Quoted:'bg-purple-100 text-purple-700', Won:'bg-green-100 text-green-700', Lost:'bg-red-100 text-red-700',
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

  useEffect(() => {
    if (!user) return
    supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setFetching(false) })
  }, [user])

  const addLead = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase.from('leads').insert({ user_id: user.id, ...form }).select().single()
    if (data) { setLeads(prev => [data, ...prev]); setForm({ name:'', phone:'', email:'', job_type:'', notes:'', status:'New' }); setShowForm(false) }
  }

  const updateStatus = async (id, status) => {
    await supabase.from('leads').update({ status, last_contact: new Date().toISOString().slice(0,10) }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, last_contact: new Date().toLocaleDateString() } : l))
  }

  const deleteLead = async (id) => {
    await supabase.from('leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const generateFollowUp = (lead) => {
    setSelected(lead); setOutput(''); setError(''); setLoading(true)
    const apiKey = profile?.claude_api_key
    if (!apiKey) { setError('No API key — add yours in Profile & Settings.'); setLoading(false); return }

    const prompt = `Write a follow-up ${followUpType} for a contractor to send to:
Name: ${lead.name}
Job Type: ${lead.job_type || 'general contracting'}
Status: ${lead.status}
Notes: ${lead.notes || 'none'}
Message type: ${followUpType}`

    streamClaude({
      apiKey,
      system: SYSTEM,
      prompt,
      onChunk: (_, full) => setOutput(full),
      onDone: async () => {
        setLoading(false)
        await supabase.from('leads').update({ last_contact: new Date().toISOString().slice(0,10) }).eq('id', lead.id)
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, last_contact: new Date().toLocaleDateString() } : l))
      },
      onError: (msg) => { setError(msg); setLoading(false) },
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads & Follow-ups</h1>
          <p className="text-gray-500 text-sm mt-0.5">Never let a lead go cold again</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary"><Plus size={16} /> Add Lead</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">New Lead</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Sarah Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Job Type</label>
              <input className="input" placeholder="Bathroom remodel, roof repair…" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" placeholder="sarah@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input h-16 resize-none" placeholder="Called about a leaky roof. Wants someone this week." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={addLead} className="btn-primary"><Plus size={15} /> Add Lead</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fetching && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}
        {!fetching && leads.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No leads yet. Add your first one above.</p>
          </div>
        )}
        {leads.map(lead => (
          <div key={lead.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{lead.name}</span>
                  <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                    className={`badge border-0 cursor-pointer text-xs ${STATUS_COLORS[lead.status]} py-0.5 px-2 rounded-full`}>
                    {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {lead.job_type && <p className="text-sm text-gray-500 mt-0.5">{lead.job_type}</p>}
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                  {lead.phone && <span className="flex items-center gap-1"><Phone size={11} />{lead.phone}</span>}
                  {lead.email && <span className="flex items-center gap-1"><Mail size={11} />{lead.email}</span>}
                  {lead.last_contact && <span>· Contacted {lead.last_contact}</span>}
                </div>
                {lead.notes && <p className="text-xs text-gray-500 mt-1 italic">"{lead.notes}"</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {['text','email','call script'].map(t => (
                    <button key={t} onClick={() => setFollowUpType(t)}
                      className={`px-2 py-1.5 capitalize transition-colors ${followUpType === t ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={() => generateFollowUp(lead)} disabled={loading && selected?.id === lead.id} className="btn-primary text-xs py-1.5 px-3">
                  <Sparkles size={13} /> Follow Up
                </button>
                <button onClick={() => deleteLead(lead.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
            {selected?.id === lead.id && <AiOutput text={output} loading={loading} error={error} label={`AI ${followUpType} draft`} />}
          </div>
        ))}
      </div>
    </div>
  )
}
