import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Trash2, Receipt, AlertCircle, CheckCircle2, Clock,
  Link as LinkIcon, Mail, Loader2, Star, Download, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { InvoicePDF, downloadPdf } from '../lib/pdf'
import EmailModal from '../components/EmailModal'
import { emailServerEnabled } from '../lib/email'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { cn } from '../lib/utils'

const STATUS_TONES = {
  Draft:   { bar: 'bg-steel-400',  badge: 'bg-muted text-muted-foreground',                                              icon: Clock,        plate: 'bg-muted text-muted-foreground' },
  Sent:    { bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',            icon: AlertCircle,  plate: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Paid:    { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',        icon: CheckCircle2, plate: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
  Overdue: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',                icon: AlertCircle,  plate: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

const uid = () => Math.random().toString(36).slice(2)
const fmt = (n) => `$${(n || 0).toFixed(2)}`

function InvoiceForm({ userId, onSave, onCancel, prefill }) {
  const [form, setForm] = useState({
    client_name:    prefill?.client_name  || '',
    client_phone:   prefill?.client_phone || '',
    client_email:   prefill?.client_email || '',
    job_title:      prefill?.job_title    || '',
    invoice_number: `INV-${Date.now().toString().slice(-5)}`,
    issue_date:     new Date().toISOString().slice(0, 10),
    due_date:       '',
    notes:          '',
    status:         'Draft',
    payment_link:   '',
  })
  const [lineItems, setLineItems] = useState(
    prefill?.line_items?.length
      ? prefill.line_items.map(li => ({ id: uid(), desc: li.desc || '', qty: String(li.qty || '1'), unit: String(li.unit || '') }))
      : [{ id: uid(), desc: '', qty: '1', unit: '' }]
  )
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving]   = useState(false)

  const subtotal = lineItems.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.unit)||0), 0)
  const tax      = subtotal * (parseFloat(taxRate)||0) / 100
  const total    = subtotal + tax

  const addLine    = () => setLineItems(li => [...li, { id: uid(), desc: '', qty: '1', unit: '' }])
  const updateLine = (id, f, v) => setLineItems(li => li.map(i => i.id === id ? { ...i, [f]: v } : i))
  const removeLine = (id) => setLineItems(li => li.filter(i => i.id !== id))

  const save = async () => {
    setSaving(true)
    const record = { user_id: userId, ...form, line_items: lineItems, tax_rate: parseFloat(taxRate), subtotal, tax, total }
    const { data } = await supabase.from('invoices').insert(record).select().single()
    if (data) onSave(data)
    setSaving(false)
  }

  return (
    <div className="card p-5 sm:p-6 space-y-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

      <div className="flex items-start justify-between">
        <div>
          <p className="stamp-label text-brand-600 dark:text-brand-400">// New Receivable</p>
          <h2 className="font-display font-bold text-lg text-foreground mt-0.5">Invoice Details</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-sm text-muted-foreground">{form.invoice_number}</span>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Client Name</label>
          <input className="input" placeholder="John Smith" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
        </div>
        <div><label className="label">Job Title</label>
          <input className="input" placeholder="Roof repair — 3 squares" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
        </div>
        <div><label className="label">Client Email</label>
          <input className="input" type="email" placeholder="client@email.com" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} />
        </div>
        <div><label className="label">Client Phone</label>
          <input className="input" placeholder="(555) 000-0000" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
        </div>
        <div><label className="label">Issue Date</label>
          <input className="input" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
        </div>
        <div><label className="label">Due Date</label>
          <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
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
          {lineItems.map(item => {
            const rowTotal = (parseFloat(item.qty)||0)*(parseFloat(item.unit)||0)
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input className="input col-span-5" placeholder="Description" value={item.desc} onChange={e => updateLine(item.id, 'desc', e.target.value)} />
                <input className="input col-span-2" type="number" min="0" placeholder="1" value={item.qty} onChange={e => updateLine(item.id, 'qty', e.target.value)} />
                <input className="input col-span-2" type="number" min="0" step="0.01" placeholder="0.00" value={item.unit} onChange={e => updateLine(item.id, 'unit', e.target.value)} />
                <div className="col-span-2 text-sm font-semibold text-right text-foreground tabular-nums">{fmt(rowTotal)}</div>
                <button
                  onClick={() => removeLine(item.id)}
                  aria-label="Remove line"
                  className="col-span-1 text-muted-foreground hover:text-red-500 transition-colors flex justify-center cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-1.5">
          <div className="flex justify-end items-center gap-4 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="w-28 text-right font-semibold text-foreground tabular-nums">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-end items-center gap-4 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              Tax %
              <input className="input w-16 text-center py-1 text-xs" type="number" min="0" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </span>
            <span className="w-28 text-right font-semibold text-foreground tabular-nums">{fmt(tax)}</span>
          </div>
          <div className="flex justify-end items-center gap-4 font-display font-bold text-brand-600 dark:text-brand-400 pt-1">
            <span>Total Due</span>
            <span className="w-28 text-right text-lg tabular-nums">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Payment Link (optional)</label>
        <input
          className="input"
          placeholder="Paste your Stripe Payment Link, Venmo, Zelle, or CashApp URL"
          value={form.payment_link}
          onChange={e => setForm(f => ({ ...f, payment_link: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Clients will see a "Pay Now" button on the shared invoice link.
        </p>
      </div>

      <div>
        <label className="label">Notes / Payment Instructions</label>
        <textarea
          className="input h-20 resize-none"
          placeholder="e.g. Pay via check or Venmo @contractor. Net 30."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-between items-center gap-3 flex-wrap">
        <select className="input w-36" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          {Object.keys(STATUS_TONES).map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            <Receipt size={15} /> {saving ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MoneyTile({ label, value, tone = 'steel' }) {
  const valueTone = {
    steel:   'text-foreground',
    danger:  'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-500',
  }
  const ribbon = {
    steel:   'from-steel-700 to-steel-900',
    danger:  'from-red-500 to-red-700',
    success: 'from-green-500 to-green-700',
  }
  return (
    <div className="card p-4 relative overflow-hidden">
      <div aria-hidden className={cn('absolute -top-px -left-px h-1 w-12 bg-gradient-to-r rounded-tl-2xl', ribbon[tone])} />
      <div className="stamp-label text-muted-foreground">{label}</div>
      <div className={cn('font-display font-bold text-2xl tabular-nums mt-1', valueTone[tone])}>{value}</div>
    </div>
  )
}

export default function Invoices() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [invoices, setInvoices] = useState([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [prefill, setPrefill]   = useState(null)
  const [copied, setCopied]     = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [pdfingId, setPdfingId] = useState(null)
  const [emailOpen, setEmailOpen] = useState(null)

  useEffect(() => {
    if (searchParams.get('from_estimate') === '1') {
      const raw = sessionStorage.getItem('invoice_from_estimate')
      if (raw) {
        try { setPrefill(JSON.parse(raw)) } catch {}
        sessionStorage.removeItem('invoice_from_estimate')
      }
      setShowForm(true)
      setSearchParams({}, { replace: true })
    } else if (searchParams.get('new') === '1') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setFetching(false) })
  }, [user])

  const saveInvoice = (inv) => { setInvoices(prev => [inv, ...prev]); setShowForm(false) }

  const updateStatus = async (id, status) => {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const deleteInvoice = async (id) => {
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${token}`)
    setCopied(token); setTimeout(() => setCopied(null), 2000)
  }

  const requestReview = (inv) => {
    const url = profile?.google_review_url
    if (!url) { toast.error('Add your Google Review link in Profile & Settings first.'); return }
    const msg = encodeURIComponent(`Hi ${inv.client_name || 'there'}, thanks so much for your business! If you were happy with the work, would you leave us a quick review? It really helps. ${url}\n\n— ${profile?.business_name || ''}`)
    window.open(`sms:${inv.client_phone || ''}?&body=${msg}`)
  }

  const downloadInvoicePdf = async (inv) => {
    setPdfingId(inv.id)
    try {
      await downloadPdf(<InvoicePDF invoice={inv} profile={profile} />, `Invoice-${inv.invoice_number || inv.id}.pdf`)
    } finally { setPdfingId(null) }
  }

  const buildInvoiceEmail = (inv) => {
    const link = `${window.location.origin}/invoice/${inv.public_token}`
    return {
      to: inv.client_email || '',
      subject: `Invoice from ${profile?.business_name || 'Your Contractor'} — ${inv.invoice_number}`,
      body: `Hi ${inv.client_name || 'there'},\n\nPlease find your invoice here:\n${link}\n\nTotal Due: ${fmt(inv.total)}\nDue Date: ${inv.due_date || 'Upon receipt'}\n\nThank you for your business!\n${profile?.business_name || ''}\n${profile?.phone || ''}`,
    }
  }

  const mailtoFallback = (inv) => {
    const m = buildInvoiceEmail(inv)
    window.open(`mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`)
  }

  const totalOwed = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.total||0), 0)
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total||0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Receivables"
        title="Invoices"
        subtitle="Track what you're owed and what's been paid."
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> New Invoice
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <MoneyTile label="Outstanding" value={fmt(totalOwed)} tone="danger" />
        <MoneyTile label="Collected"   value={fmt(totalPaid)} tone="success" />
        <MoneyTile label="Total Sent"  value={invoices.length} tone="steel" />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <InvoiceForm
              userId={user?.id}
              prefill={prefill}
              onSave={(inv) => { saveInvoice(inv); setPrefill(null) }}
              onCancel={() => { setShowForm(false); setPrefill(null) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {fetching && (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {!fetching && invoices.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Send your first one and start tracking what you're owed."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={15} /> Create your first invoice
              </button>
            }
          />
        )}
        {invoices.map((inv, i) => {
          const tone = STATUS_TONES[inv.status] || STATUS_TONES.Draft
          const StatusIcon = tone.icon
          return (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.15), ease: [0.22, 1, 0.36, 1] }}
              className="card p-4 pl-5 relative overflow-hidden"
            >
              <span className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r-full', tone.bar)} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('w-9 h-9 rounded-md flex items-center justify-center shrink-0', tone.plate)}>
                    <StatusIcon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-sm text-foreground truncate">
                      {inv.client_name || 'No client'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-mono">{inv.invoice_number}</span> · {inv.job_title || '—'} · Due {inv.due_date || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="font-display font-bold text-lg text-foreground tabular-nums">{fmt(inv.total)}</span>
                  <select
                    value={inv.status}
                    onChange={e => updateStatus(inv.id, e.target.value)}
                    className={cn(
                      'cursor-pointer text-xs font-semibold tracking-tight rounded-full px-2.5 py-0.5 border-0 outline-none focus:ring-2 focus:ring-ring',
                      tone.badge
                    )}
                  >
                    {Object.keys(STATUS_TONES).map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => downloadInvoicePdf(inv)} disabled={pdfingId === inv.id} className="btn-ghost text-xs py-1 px-2">
                    <Download size={14} /> {pdfingId === inv.id ? '…' : 'PDF'}
                  </button>
                  <button onClick={() => emailServerEnabled ? setEmailOpen(inv) : mailtoFallback(inv)} className="btn-ghost text-xs py-1 px-2">
                    <Mail size={14} /> Email
                  </button>
                  {inv.status === 'Paid' && (
                    <button onClick={() => requestReview(inv)} className="btn-ghost text-xs py-1 px-2 text-yellow-600 dark:text-yellow-400">
                      <Star size={14} /> Review
                    </button>
                  )}
                  <button onClick={() => copyLink(inv.public_token)} className="btn-ghost text-xs py-1 px-2">
                    <LinkIcon size={14} /> {copied === inv.public_token ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    aria-label="Delete invoice"
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {emailOpen && (() => {
        const m = buildInvoiceEmail(emailOpen)
        return (
          <EmailModal
            open
            onClose={() => setEmailOpen(null)}
            initialTo={m.to}
            initialSubject={m.subject}
            initialBody={m.body}
            kind="invoice"
            mailtoFallback={() => mailtoFallback(emailOpen)}
          />
        )
      })()}
    </div>
  )
}
