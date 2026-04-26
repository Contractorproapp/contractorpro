import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Download, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PublicDocLayout, { DocSection } from '../components/PublicDocLayout'

const STATUS_BADGE = {
  Draft:   'bg-steel-200 text-steel-700',
  Sent:    'bg-brand-100 text-brand-700',
  Paid:    'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
}

export default function PublicInvoice() {
  const { token } = useParams()
  const [invoice, setInvoice]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      // Use RPC instead of direct select — the over-permissive
      // "public read" RLS policy was retired (it was leaking the
      // whole invoices table). The RPC enforces "exactly one row by
      // token" server-side.
      const { data: inv } = await supabase.rpc('get_public_invoice', { token_param: token })

      if (!inv) { setNotFound(true); setLoading(false); return }
      setInvoice(inv)

      // Limited public profile read via RPC — direct .from('profiles')
      // is blocked by RLS for anon users.
      const { data: profRows } = await supabase.rpc('get_public_profile', { uid: inv.user_id })
      setProfile(Array.isArray(profRows) ? profRows[0] : profRows)
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-steel-50">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4 bg-steel-50">
      <div>
        <p className="font-display font-bold text-2xl text-steel-700">Invoice not found</p>
        <p className="text-steel-500 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  const total = (invoice.total || 0).toFixed(2)
  const isPayable = invoice.payment_link && invoice.status !== 'Paid'

  const statusBadge = (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight ${STATUS_BADGE[invoice.status] || STATUS_BADGE.Draft}`}>
      {invoice.status}
    </span>
  )

  const actions = (
    <>
      {isPayable && (
        <a
          href={invoice.payment_link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold tracking-tight shadow-sm hover:bg-brand-700 transition-colors cursor-pointer"
        >
          <CreditCard size={15} /> Pay ${total}
        </a>
      )}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-steel-700 border border-steel-200 font-semibold tracking-tight shadow-sm hover:bg-steel-100 transition-colors cursor-pointer"
      >
        <Download size={15} /> PDF
      </button>
    </>
  )

  const stickyCta = isPayable ? (
    <a
      href={invoice.payment_link}
      target="_blank"
      rel="noreferrer"
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold tracking-tight shadow-sm hover:bg-brand-700 transition-colors cursor-pointer"
    >
      <CreditCard size={16} /> Pay ${total}
    </a>
  ) : null

  return (
    <PublicDocLayout
      profile={profile}
      docType="// Invoice"
      docNumber={invoice.invoice_number}
      statusBadge={statusBadge}
      actions={actions}
      stickyCta={stickyCta}
    >
      {/* Bill To + Dates */}
      <DocSection>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-stamp text-steel-500 font-semibold mb-1.5">Bill To</p>
            <p className="font-display font-semibold text-steel-900">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-sm text-steel-600 mt-0.5">{invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-sm text-steel-600">{invoice.client_phone}</p>}
          </div>
          <div className="sm:text-right space-y-1.5">
            <div className="flex sm:justify-end gap-3 text-sm">
              <span className="text-steel-500 w-20 sm:w-auto">Issue Date</span>
              <span className="font-medium text-steel-800">{invoice.issue_date}</span>
            </div>
            {invoice.due_date && (
              <div className="flex sm:justify-end gap-3 text-sm">
                <span className="text-steel-500 w-20 sm:w-auto">Due Date</span>
                <span className="font-semibold text-red-600">{invoice.due_date}</span>
              </div>
            )}
          </div>
        </div>
      </DocSection>

      {/* Job */}
      {invoice.job_title && (
        <DocSection label="Job">
          <p className="font-medium text-steel-800">{invoice.job_title}</p>
        </DocSection>
      )}

      {/* Line items */}
      <section className="bg-white rounded-2xl border border-steel-200 shadow-sm overflow-hidden print:rounded-none print:border print:shadow-none">
        <div className="grid grid-cols-12 gap-2 px-5 sm:px-6 py-3 bg-steel-100 border-b border-steel-200 text-[10px] font-semibold text-steel-600 uppercase tracking-stamp">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Unit</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        {(invoice.line_items || []).filter(i => i.desc).map((item, idx) => {
          const t = (parseFloat(item.qty)||0) * (parseFloat(item.unit)||0)
          return (
            <div key={idx} className="grid grid-cols-12 gap-2 px-5 sm:px-6 py-3 border-b border-steel-100 last:border-0 text-sm">
              <div className="col-span-6 text-steel-800">{item.desc}</div>
              <div className="col-span-2 text-center text-steel-500 tabular-nums">{item.qty}</div>
              <div className="col-span-2 text-right text-steel-500 tabular-nums">${parseFloat(item.unit||0).toFixed(2)}</div>
              <div className="col-span-2 text-right font-semibold text-steel-900 tabular-nums">${t.toFixed(2)}</div>
            </div>
          )
        })}
        <div className="px-5 sm:px-6 py-4 space-y-2 border-t border-steel-200 bg-steel-50">
          <div className="flex justify-between text-sm text-steel-600">
            <span>Subtotal</span>
            <span className="tabular-nums">${(invoice.subtotal||0).toFixed(2)}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex justify-between text-sm text-steel-600">
              <span>Tax ({invoice.tax_rate}%)</span>
              <span className="tabular-nums">${(invoice.tax||0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-display font-bold text-lg text-brand-700 pt-2 border-t border-steel-200">
            <span>Total Due</span>
            <span className="tabular-nums">${total}</span>
          </div>
        </div>
      </section>

      {/* Notes */}
      {invoice.notes && (
        <DocSection label="Notes / Payment Instructions">
          <p className="text-sm text-steel-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
        </DocSection>
      )}
    </PublicDocLayout>
  )
}
