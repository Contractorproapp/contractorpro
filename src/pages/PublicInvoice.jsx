import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Hammer, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PublicInvoice() {
  const { token } = useParams()
  const [invoice, setInvoice]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('public_token', token)
        .single()

      if (!inv) { setNotFound(true); setLoading(false); return }
      setInvoice(inv)

      const { data: prof } = await supabase
        .from('profiles')
        .select('business_name, phone, email, logo_url')
        .eq('id', inv.user_id)
        .single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div>
        <p className="text-2xl font-bold text-gray-700">Invoice not found</p>
        <p className="text-gray-400 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  const STATUS_COLORS = { Draft:'bg-gray-100 text-gray-600', Sent:'bg-blue-100 text-blue-700', Paid:'bg-green-100 text-green-700', Overdue:'bg-red-100 text-red-600' }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-end print:hidden">
          <button onClick={() => window.print()} className="btn-secondary">
            <Download size={15} /> Download PDF
          </button>
        </div>
        {/* Header */}
        <div className="card p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile?.logo_url
              ? <img src={profile.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
              : <div className="w-14 h-14 bg-brand-500 rounded-xl flex items-center justify-center"><Hammer size={24} className="text-white" /></div>
            }
            <div>
              <h1 className="text-xl font-bold">{profile?.business_name || 'Contractor'}</h1>
              {profile?.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
              {profile?.email && <p className="text-sm text-gray-500">{profile.email}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice</p>
            <p className="font-mono font-bold text-lg">{invoice.invoice_number}</p>
            <span className={`badge mt-1 ${STATUS_COLORS[invoice.status] || STATUS_COLORS.Draft}`}>{invoice.status}</span>
          </div>
        </div>

        {/* Bill To */}
        <div className="card p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-semibold">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-sm text-gray-500">{invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-sm text-gray-500">{invoice.client_phone}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">Issue Date</span><span>{invoice.issue_date}</span></div>
              {invoice.due_date && <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">Due Date</span><span className="font-medium text-red-600">{invoice.due_date}</span></div>}
            </div>
          </div>
        </div>

        {/* Job */}
        {invoice.job_title && (
          <div className="card px-6 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Job</p>
            <p className="font-medium">{invoice.job_title}</p>
          </div>
        )}

        {/* Line Items */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Unit</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          {(invoice.line_items || []).filter(i => i.desc).map((item, idx) => {
            const t = (parseFloat(item.qty)||0) * (parseFloat(item.unit)||0)
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-50 last:border-0 text-sm">
                <div className="col-span-6">{item.desc}</div>
                <div className="col-span-2 text-center text-gray-500">{item.qty}</div>
                <div className="col-span-2 text-right text-gray-500">${parseFloat(item.unit||0).toFixed(2)}</div>
                <div className="col-span-2 text-right font-medium">${t.toFixed(2)}</div>
              </div>
            )
          })}
          <div className="px-6 py-4 space-y-2 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${(invoice.subtotal||0).toFixed(2)}</span></div>
            {invoice.tax > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Tax ({invoice.tax_rate}%)</span><span>${(invoice.tax||0).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg text-brand-700 pt-1 border-t border-gray-200"><span>Total Due</span><span>${(invoice.total||0).toFixed(2)}</span></div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="card p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Notes / Payment Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">Powered by ContractorPro</p>
      </div>
    </div>
  )
}
