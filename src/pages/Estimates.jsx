import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, ChevronDown, ChevronUp, FileText, Sparkles, Loader2,
  Link as LinkIcon, CheckCircle2, Receipt, Download, Mail, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'
import VoiceButton from '../components/VoiceButton'
import { EstimatePDF, downloadPdf } from '../lib/pdf'
import EmailModal from '../components/EmailModal'
import { emailServerEnabled } from '../lib/email'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { cn } from '../lib/utils'

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
  'General Contractor', 'Plumbing', 'Electrical', 'HVAC', 'Roofing',
  'Flooring', 'Painting', 'Landscaping', 'Concrete', 'Carpentry', 'Other',
]

const STATUS_TONES = {
  Draft:    { bar: 'bg-steel-400',  badge: 'bg-muted text-muted-foreground' },
  Sent:     { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Accepted: { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  Declined: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

const uid = () => Math.random().toString(36).slice(2)
const fmt = (n) => `$${(n || 0).toFixed(2)}`

function LineItem({ item, onChange, onRemove }) {
  const total = (parseFloat(item.qty) || 0) * (parseFloat(item.unit) || 0)
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <input className="input col-span-5" placeholder="Description" value={item.desc} onChange={e => onChange({ ...item, desc: e.target.value })} />
      <input className="input col-span-2" placeholder="Qty" type="number" min="0" value={item.qty} onChange={e => onChange({ ...item, qty: e.target.value })} />
      <input className="input col-span-2" placeholder="Unit $" type="number" min="0" step="0.01" value={item.unit} onChange={e => onChange({ ...item, unit: e.target.value })} />
      <div className="col-span-2 text-sm font-semibold text-right text-foreground tabular-nums">{fmt(total)}</div>
      <button
        onClick={onRemove}
        aria-label="Remove line"
        className="col-span-1 text-muted-foreground hover:text-red-500 transition-colors flex justify-center cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function EstimateCard({ est, profile, onDelete, onConvert, index }) {
  const [open, setOpen]         = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [pdfing, setPdfing]     = useState(false)
  const [emailing, setEmailing] = useState(false)
  const tone = STATUS_TONES[est.status] || STATUS_TONES.Draft

  const handleDelete = async () => { setDeleting(true); await onDelete(est.id) }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/estimate/${est.public_token}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const buildEmail = () => {
    const shareUrl = est.public_token ? `${window.location.origin}/estimate/${est.public_token}` : ''
    return {
      to: est.email || '',
      subject: `Estimate for ${est.job_title || 'your project'}`,
      body:
        `Hi ${est.client_name || ''},\n\nPlease find my estimate for ${est.job_title || 'your project'} below.\n\n` +
        (shareUrl ? `View and sign online: ${shareUrl}\n\n` : '') +
        `Total: ${fmt(est.total)}\n\nThanks,\n${profile?.business_name || ''}`,
    }
  }

  const mailtoFallback = () => {
    const m = buildEmail()
    window.location.href = `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`
  }

  const downloadAsPdf = async () => {
    setPdfing(true)
    try {
      await downloadPdf(<EstimatePDF estimate={est} profile={profile} />, `Estimate-${est.client_name || 'client'}.pdf`)
    } finally { setPdfing(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.15), ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden relative"
    >
      <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', tone.bar)} />

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 pl-5 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-muted-foreground shrink-0" />
          <div className="text-left min-w-0">
            <div className="font-display font-semibold text-sm text-foreground truncate">
              {est.client_name || 'Unnamed Client'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {est.job_title || 'No job title'} · {new Date(est.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {est.signed_at && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
              <CheckCircle2 size={11} /> Signed
            </span>
          )}
          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight', tone.badge)}>
            {est.status}
          </span>
          <span className="font-display font-bold text-brand-600 dark:text-brand-400 tabular-nums">{fmt(est.total)}</span>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pl-5 py-3 space-y-3">
              {est.output && (
                <pre className="whitespace-pre-wrap text-xs text-foreground font-sans leading-relaxed bg-muted/60 p-3 rounded-lg max-h-72 overflow-y-auto border border-border">
                  {est.output}
                </pre>
              )}
              <div className="flex gap-2 flex-wrap">
                {est.public_token && (
                  <button onClick={copyLink} className="btn-ghost text-xs py-1 px-2">
                    <LinkIcon size={13} /> {copied ? 'Copied!' : 'Share for Signature'}
                  </button>
                )}
                <button onClick={downloadAsPdf} disabled={pdfing} className="btn-ghost text-xs py-1 px-2">
                  <Download size={13} /> {pdfing ? 'Preparing…' : 'PDF'}
                </button>
                <button onClick={() => emailServerEnabled ? setEmailing(true) : mailtoFallback()} className="btn-ghost text-xs py-1 px-2">
                  <Mail size={13} /> Email
                </button>
                <button onClick={() => onConvert(est)} className="btn-ghost text-brand-600 dark:text-brand-400 text-xs py-1 px-2">
                  <Receipt size={13} /> Convert to Invoice
                </button>
                <button onClick={handleDelete} disabled={deleting} className="btn-ghost text-red-500 text-xs py-1 px-2 ml-auto">
                  <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {emailing && (() => {
        const m = buildEmail()
        return (
          <EmailModal
            open
            onClose={() => setEmailing(false)}
            initialTo={m.to}
            initialSubject={m.subject}
            initialBody={m.body}
            kind="estimate"
            mailtoFallback={mailtoFallback}
          />
        )
      })()}
    </motion.div>
  )
}

export default function Estimates() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [estimates, setEstimates] = useState([])
  const [fetching, setFetching]   = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    client_name: '', phone: '', email: '', job_title: '', trade: 'General Contractor',
    address: '', notes: '', markup: '20', status: 'Draft',
  })
  const [lineItems, setLineItems] = useState([{ id: uid(), desc: '', qty: '1', unit: '' }])
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
    supabase.from('estimates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setEstimates(data || []); setFetching(false) })
  }, [user])

  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty)||0) * (parseFloat(i.unit)||0), 0)
  const total    = subtotal * (1 + (parseFloat(form.markup)||0) / 100)

  const addLine    = () => setLineItems(li => [...li, { id: uid(), desc: '', qty: '1', unit: '' }])
  const updateLine = (id, u) => setLineItems(li => li.map(i => i.id === id ? u : i))
  const removeLine = (id)    => setLineItems(li => li.filter(i => i.id !== id))

  const generate = () => {
    setOutput(''); setError(''); setLoading(true)
    if (!profile?.claude_api_key) {
      setError('No API key — add yours in Profile & Settings.'); setLoading(false); return
    }

    const itemsText = lineItems.filter(i => i.desc).map(i => `- ${i.desc}: qty ${i.qty} × $${i.unit}`).join('\n')
    const prompt = `Generate a professional contractor estimate for:
Client: ${form.client_name}
Job: ${form.job_title}
Trade: ${form.trade}
Address: ${form.address}
Markup: ${form.markup}%
Notes: ${form.notes}
Line Items:\n${itemsText || '(No line items)'}
Subtotal: ${fmt(subtotal)} | Total with markup: ${fmt(total)}`

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
          subtotal, total, output: full,
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

  const convertToInvoice = (est) => {
    sessionStorage.setItem('invoice_from_estimate', JSON.stringify({
      client_name: est.client_name || '',
      client_phone: est.phone || '',
      client_email: est.email || '',
      job_title: est.job_title || '',
      line_items: est.line_items || [],
    }))
    navigate('/invoices?from_estimate=1')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Quotes"
        title="Estimates"
        subtitle="Generate professional, itemized quotes in seconds."
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> New Estimate
          </button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="card p-5 sm:p-6 space-y-5 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="stamp-label text-brand-600 dark:text-brand-400">// New Quote</p>
                  <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Job Details</h2>
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
                <div><label className="label">Client Name</label>
                  <input className="input" placeholder="John Smith" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
                </div>
                <div><label className="label">Trade</label>
                  <select className="input" value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))}>
                    {TRADE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Phone</label>
                  <input className="input" placeholder="(555) 123-4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div><label className="label">Email</label>
                  <input className="input" type="email" placeholder="client@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
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
                  <div className="hidden sm:grid grid-cols-12 gap-2 stamp-label text-muted-foreground px-0.5">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit $</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {lineItems.map(item => (
                    <LineItem key={item.id} item={item} onChange={u => updateLine(item.id, u)} onRemove={() => removeLine(item.id)} />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-end items-center gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
                  <div className="text-muted-foreground">
                    Subtotal <span className="font-semibold text-foreground tabular-nums ml-1">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-muted-foreground">Markup %</label>
                    <input className="input w-20 text-center" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: e.target.value }))} />
                  </div>
                  <div className="font-display font-bold text-brand-600 dark:text-brand-400 text-lg tabular-nums">
                    Total {fmt(total)}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Additional Notes</label>
                  <VoiceButton onTranscript={text => setForm(f => ({ ...f, notes: text }))} />
                </div>
                <textarea
                  className="input h-20 resize-none"
                  placeholder="Tap Dictate to speak. Describe the job, materials, access notes, customer requests…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <select className="input w-40" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.keys(STATUS_TONES).map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={generate} disabled={loading} className="btn-primary">
                  <Sparkles size={16} /> {loading ? 'Generating…' : 'Generate with AI'}
                </button>
              </div>

              <AiOutput text={output} loading={loading} error={error} label="Generated Estimate" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {fetching && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {!fetching && estimates.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No estimates yet"
            description="Build your first quote with AI in under a minute."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={15} /> Create your first estimate
              </button>
            }
          />
        )}
        {estimates.map((est, i) => (
          <EstimateCard
            key={est.id}
            est={est}
            profile={profile}
            onDelete={deleteEstimate}
            onConvert={convertToInvoice}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
