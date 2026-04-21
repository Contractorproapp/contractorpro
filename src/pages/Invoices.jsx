import { useState, useEffect } from 'react'
import { Plus, Trash2, Receipt, AlertCircle, CheckCircle2, Clock, Link, Mail, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = { Draft:'bg-gray-100 text-gray-600', Sent:'bg-blue-100 text-blue-700', Paid:'bg-green-100 text-green-700', Overdue:'bg-red-100 text-red-700' }
const STATUS_ICONS  = { Draft:Clock, Sent:AlertCircle, Paid:CheckCircle2, Overdue:AlertCircle }
const uid = () => Math.random().toString(36).slice(2)

function InvoiceForm({ userId, onSave, onCancel }) {
  const [form, setForm] = useState({
    client_name:'', client_phone:'', client_email:'', job_title:'',
    invoice_number:`INV-${Date.now().toString().slice(-5)}`,
    issue_date: new Date().toISOString().slice(0,10),
    due_date:'', notes:'', status:'Draft',
  })
  const [lineItems, setLineItems] = useState([{ id:uid(), desc:'', qty:'1', unit:'' }])
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving]   = useState(false)

  const subtotal = lineItems.reduce((s,i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.unit)||0), 0)
  const tax   = subtotal * (parseFloat(taxRate)||0) / 100
  const total = subtotal + tax

  const addLine    = () => setLineItems(li => [...li, { id:uid(), desc:'', qty:'1', unit:'' }])
  const updateLine = (id, f, v) => setLineItems(li => li.map(i => i.id===id ? {...i,[f]:v} : i))
  const removeLine = (id) => setLineItems(li => li.filter(i => i.id!==id))

  const save = async () => {
    setSaving(true)
    const record = { user_id:userId, ...form, line_items:lineItems, tax_rate:parseFloat(taxRate), subtotal, tax, total }
    const { data } = await supabase.from('invoices').insert(record).select().single()
    if (data) onSave(data)
    setSaving(false)
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New Invoice</h2>
        <span className="text-sm text-gray-500 font-mono">{form.invoice_number}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Client Name</label><input className="input" placeholder="John Smith" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name:e.target.value }))} /></div>
        <div><label className="label">Job Title</label><input className="input" placeholder="Roof repair — 3 squares" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title:e.target.value }))} /></div>
        <div><label className="label">Client Email</label><input className="input" type="email" placeholder="client@email.com" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email:e.target.value }))} /></div>
        <div><label className="label">Client Phone</label><input className="input" placeholder="(555) 000-0000" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone:e.target.value }))} /></div>
        <div><label className="label">Issue Date</label><input className="input" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date:e.target.value }))} /></div>
        <div><label className="label">Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date:e.target.value }))} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Line Items</label>
          <button onClick={addLine} className="btn-ghost text-xs py-1"><Plus size={13} /> Add Line</button>
        </div>
        <div className="space-y-2">
          {lineItems.map(item => {
            const rowTotal = (parseFloat(item.qty)||0)*(parseFloat(item.unit)||0)
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input className="input col-span-5" placeholder="Description" value={item.desc} onChange={e => updateLine(item.id,'desc',e.target.value)} />
                <input className="input col-span-2" type="number" min="0" placeholder="1" value={item.qty} onChange={e => updateLine(item.id,'qty',e.target.value)} />
                <input className="input col-span-2" type="number" min="0" step="0.01" placeholder="0.00" value={item.unit} onChange={e => updateLine(item.id,'unit',e.target.value)} />
                <div className="col-span-2 text-sm font-medium text-right">${rowTotal.toFixed(2)}</div>
                <button onClick={() => removeLine(item.id)} className="col-span-1 text-gray-300 hover:text-red-400 flex justify-center"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t space-y-1.5">
          <div className="flex justify-end items-center gap-4 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="w-28 text-right font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-end items-center gap-4 text-sm">
            <span className="text-gray-500 flex items-center gap-2">Tax % <input className="input w-16 text-center py-1 text-xs" type="number" min="0" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} /></span>
            <span className="w-28 text-right font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-end items-center gap-4 text-sm font-bold text-brand-700">
            <span>Total Due</span><span className="w-28 text-right text-lg">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div><label className="label">Notes / Payment Instructions</label><textarea className="input h-16 resize-none" placeholder="e.g. Pay via check or Venmo @contractor. Net 30." value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} /></div>

      <div className="flex justify-between items-center">
        <select className="input w-36" value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))}>
          <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
        </select>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary"><Receipt size={15} /> {saving ? 'Saving…' : 'Save Invoice'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Invoices() {
  const { user, profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied]     = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setFetching(false) })
  }, [user])

  const saveInvoice = (inv) => { setInvoices(prev => [inv, ...prev]); setShowForm(false) }
  const updateStatus = async (id, status) => {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id===id ? { ...i, status } : i))
  }
  const deleteInvoice = async (id) => {
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(i => i.id!==id))
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const emailInvoice = (inv) => {
    const link    = `${window.location.origin}/invoice/${inv.public_token}`
    const subject = encodeURIComponent(`Invoice from ${profile?.business_name || 'Your Contractor'} — ${inv.invoice_number}`)
    const body    = encodeURIComponent(`Hi ${inv.client_name || 'there'},\n\nPlease find your invoice here:\n${link}\n\nTotal Due: $${(inv.total||0).toFixed(2)}\nDue Date: ${inv.due_date || 'Upon receipt'}\n\nThank you for your business!\n${profile?.business_name || ''}\n${profile?.phone || ''}`)
    window.open(`mailto:${inv.client_email || ''}?subject=${subject}&body=${body}`)
  }

  const totalOwed = invoices.filter(i => i.status !== 'Paid').reduce((s,i) => s+(i.total||0), 0)
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s,i) => s+(i.total||0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track what you're owed and what's been paid</p>
        </div>
        <button onClick={() => setShowForm(f => !f)} className="btn-primary"><Plus size={16} /> New Invoice</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><div className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</div><div className="text-2xl font-bold text-red-600 mt-1">${totalOwed.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-xs text-gray-500 uppercase tracking-wide">Collected</div><div className="text-2xl font-bold text-green-600 mt-1">${totalPaid.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-xs text-gray-500 uppercase tracking-wide">Total</div><div className="text-2xl font-bold text-gray-700 mt-1">{invoices.length}</div></div>
      </div>

      {showForm && <InvoiceForm userId={user?.id} onSave={saveInvoice} onCancel={() => setShowForm(false)} />}

      <div className="space-y-2">
        {fetching && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}
        {!fetching && invoices.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Receipt size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No invoices yet. Create your first one above.</p>
          </div>
        )}
        {invoices.map(inv => {
          const StatusIcon = STATUS_ICONS[inv.status] || Clock
          return (
            <div key={inv.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${STATUS_COLORS[inv.status]}`}>
                    <StatusIcon size={15} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{inv.client_name || 'No client'}</div>
                    <div className="text-xs text-gray-500">{inv.invoice_number} · {inv.job_title} · Due {inv.due_date || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="font-bold text-lg">${(inv.total||0).toFixed(2)}</span>
                  <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value)}
                    className={`badge border-0 cursor-pointer ${STATUS_COLORS[inv.status]}`}>
                    <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
                  </select>
                  <button onClick={() => emailInvoice(inv)} title="Email invoice" className="btn-ghost text-xs py-1 px-2">
                    <Mail size={14} /> Email
                  </button>
                  <button onClick={() => copyLink(inv.public_token)} title="Copy share link" className="btn-ghost text-xs py-1 px-2">
                    <Link size={14} /> {copied === inv.public_token ? 'Copied!' : 'Share'}
                  </button>
                  <button onClick={() => deleteInvoice(inv.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
