import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, Sparkles, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'
import VoiceButton from '../components/VoiceButton'

const SYSTEM = `You are an expert contractor estimating assistant. You write clear, professional, itemized estimates for contractors (plumbers, electricians, roofers, HVAC, general contractors, etc.).

When given job details, produce a professional estimate with:
1. A brief project summary
2. Itemized line items (labor + materials, each with unit cost and quantity)
3. Subtotal, markup percentage, and total
4. Timeline estimate
5. Payment terms suggestion (e.g., 50% upfront, 50% on completion)
6. A brief note about what's NOT included (exclusions)

Format it cleanly with clear sections. Use plain text, no markdown symbols. Use dollar amounts with 2 decimal places.`

const TRADE_OPTIONS = [
  'General Contractor','Plumbing','Electrical','HVAC','Roofing',
  'Flooring','Painting','Landscaping','Concrete','Carpentry','Other',
]

const uid = () => Math.random().toString(36).slice(2)

function LineItem({ item, onChange, onRemove }) {
  const total = (parseFloat(item.qty) || 0) * (parseFloat(item.unit) || 0)
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <input className="input col-span-5" placeholder="Description" value={item.desc} onChange={e => onChange({ ...item, desc: e.target.value })} />
      <input className="input col-span-2" placeholder="Qty" type="number" min="0" value={item.qty} onChange={e => onChange({ ...item, qty: e.target.value })} />
      <input className="input col-span-2" placeholder="Unit $" type="number" min="0" step="0.01" value={item.unit} onChange={e => onChange({ ...item, unit: e.target.value })} />
      <div className="col-span-2 text-sm font-medium text-right text-gray-700">${total.toFixed(2)}</div>
      <button onClick={onRemove} className="col-span-1 text-gray-400 hover:text-red-500 transition-colors flex justify-center"><Trash2 size={16} /></button>
    </div>
  )
}

function EstimateCard({ est, onDelete }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const statusColors = { Draft:'badge-info', Sent:'badge-accent', Accepted:'badge-success', Declined:'badge-danger' }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(est.id)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/estimate/${est.public_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-gray-400" />
          <div className="text-left">
            <div className="font-semibold text-sm">{est.client_name || 'Unnamed Client'}</div>
            <div className="text-xs text-gray-500">{est.job_title || 'No job title'} · {new Date(est.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {est.signed_at && <span className="badge-success"><CheckCircle2 size={12} /> Signed</span>}
          <span className={statusColors[est.status] || statusColors.Draft}>{est.status}</span>
          <span className="font-bold text-brand-600">${(est.total || 0).toFixed(2)}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2">
          {est.output && (
            <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed bg-gray-50 p-3 rounded-lg max-h-72 overflow-y-auto">{est.output}</pre>
          )}
          <div className="flex gap-2">
            {est.public_token && (
              <button onClick={copyLink} className="btn-ghost text-xs py-1 px-2">
                <LinkIcon size={13} /> {copied ? 'Copied!' : 'Share for Signature'}
              </button>
            )}
            <button onClick={handleDelete} disabled={deleting} className="btn-ghost text-red-500 text-xs py-1 px-2">
              <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Estimates() {
  const { user, profile } = useAuth()
  const [estimates, setEstimates] = useState([])
  const [fetching, setFetching]   = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    client_name:'', phone:'', email:'', job_title:'', trade:'General Contractor',
    address:'', notes:'', markup:'20', status:'Draft',
  })
  const [lineItems, setLineItems] = useState([{ id: uid(), desc:'', qty:'1', unit:'' }])
  const [output, setOutput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('estimates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setEstimates(data || []); setFetching(false) })
  }, [user])

  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty)||0) * (parseFloat(i.unit)||0), 0)
  const total    = subtotal * (1 + (parseFloat(form.markup)||0) / 100)

  const addLine    = () => setLineItems(li => [...li, { id: uid(), desc:'', qty:'1', unit:'' }])
  const updateLine = (id, u) => setLineItems(li => li.map(i => i.id === id ? u : i))
  const removeLine = (id)  => setLineItems(li => li.filter(i => i.id !== id))

  const generate = () => {
    setOutput(''); setError(''); setLoading(true)
    if (!profile?.claude_api_key) { setError('No API key — add yours in Profile & Settings.'); setLoading(false); return }

    const itemsText = lineItems.filter(i => i.desc).map(i => `- ${i.desc}: qty ${i.qty} × $${i.unit}`).join('\n')
    const prompt = `Generate a professional contractor estimate for:
Client: ${form.client_name}
Job: ${form.job_title}
Trade: ${form.trade}
Address: ${form.address}
Markup: ${form.markup}%
Notes: ${form.notes}
Line Items:\n${itemsText || '(No line items)'}
Subtotal: $${subtotal.toFixed(2)} | Total with markup: $${total.toFixed(2)}`

    streamClaude({
      system: SYSTEM,
      prompt,
      onChunk: (_, full) => setOutput(full),
      onDone: async (full) => {
        setLoading(false)
        const record = {
          user_id: user.id,
          ...form,
          markup: parseFloat(form.markup),
          line_items: lineItems,
          subtotal,
          total,
          output: full,
        }
        const { data } = await supabase.from('estimates').insert(record).select().single()
        if (data) setEstimates(prev => [data, ...prev])
      },
      onError: (msg) => { setError(msg); setLoading(false) },
    })
  }

  const deleteEstimate = async (id) => {
    await supabase.from('estimates').delete().eq('id', id)
    setEstimates(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Estimates</h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate professional quotes in seconds</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary"><Plus size={16} /> New Estimate</button>
      </div>

      {showForm && (
        <div className="card p-5 space-y-5">
          <h2 className="font-semibold text-gray-800">Job Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Client Name</label>
              <input className="input" placeholder="John Smith" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Trade</label>
              <select className="input" value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}>
                {TRADE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" placeholder="client@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Job Title</label>
              <input className="input" placeholder="Kitchen Remodel — Cabinet & Countertop Replacement" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Job Address</label>
              <input className="input" placeholder="123 Main St, Springfield, IL 62701" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Line Items</label>
              <button onClick={addLine} className="btn-ghost text-xs py-1"><Plus size={13} /> Add Line</button>
            </div>
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-0.5">
                <div className="col-span-5">Description</div><div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit $</div><div className="col-span-2 text-right">Total</div>
              </div>
              {lineItems.map(item => (
                <LineItem key={item.id} item={item} onChange={u => updateLine(item.id, u)} onRemove={() => removeLine(item.id)} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-4 text-sm border-t pt-3">
              <div className="text-gray-500">Subtotal: <span className="font-medium text-gray-800">${subtotal.toFixed(2)}</span></div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500">Markup %</label>
                <input className="input w-20 text-center" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: e.target.value }))} />
              </div>
              <div className="font-bold text-brand-600">Total: ${total.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Additional Notes</label>
              <VoiceButton onTranscript={text => setForm(f => ({ ...f, notes: text }))} />
            </div>
            <textarea className="input h-20 resize-none" placeholder="Tap Dictate to speak. Describe the job, materials, access notes, customer requests…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <select className="input w-40" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option>
            </select>
            <button onClick={generate} disabled={loading} className="btn-primary">
              <Sparkles size={16} />
              {loading ? 'Generating…' : 'Generate with AI'}
            </button>
          </div>

          <AiOutput text={output} loading={loading} error={error} label="Generated Estimate" />
        </div>
      )}

      <div className="space-y-2">
        {fetching && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}
        {!fetching && estimates.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No estimates yet. Create your first one above.</p>
          </div>
        )}
        {estimates.map(est => <EstimateCard key={est.id} est={est} onDelete={deleteEstimate} />)}
      </div>
    </div>
  )
}
