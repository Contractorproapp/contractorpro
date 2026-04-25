import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Download, CheckCircle2, PenTool } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SignaturePad from '../components/SignaturePad'
import PublicDocLayout, { DocSection } from '../components/PublicDocLayout'

export default function PublicEstimate() {
  const { token } = useParams()
  const [est, setEst]         = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signature, setSignature] = useState('')
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('estimates').select('*').eq('public_token', token).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      setEst(data)
      const { data: prof } = await supabase
        .from('profiles')
        .select('business_name, phone, email, logo_url')
        .eq('id', data.user_id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [token])

  const sign = async () => {
    if (!signature) return
    setSigning(true)
    await supabase.rpc('sign_estimate', { token_param: token, signature_param: signature })
    const { data } = await supabase.from('estimates').select('*').eq('public_token', token).single()
    setEst(data)
    setSigning(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-steel-50">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4 bg-steel-50">
      <div>
        <p className="font-display font-bold text-2xl text-steel-700">Estimate not found</p>
        <p className="text-steel-500 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  const statusBadge = est.signed_at ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight bg-green-100 text-green-700">
      <CheckCircle2 size={12} /> Signed
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight bg-brand-100 text-brand-700">
      Awaiting Signature
    </span>
  )

  const actions = (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-steel-700 border border-steel-200 font-semibold tracking-tight shadow-sm hover:bg-steel-100 transition-colors cursor-pointer"
    >
      <Download size={15} /> PDF
    </button>
  )

  return (
    <PublicDocLayout
      profile={profile}
      docType="// Estimate"
      statusBadge={statusBadge}
      actions={actions}
    >
      {/* Details */}
      <DocSection>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {est.client_name && (
            <Detail label="Client" value={est.client_name} />
          )}
          {est.job_title && (
            <Detail label="Job" value={est.job_title} />
          )}
          {est.address && (
            <div className="sm:col-span-2">
              <Detail label="Address" value={est.address} />
            </div>
          )}
        </div>
      </DocSection>

      {/* AI / Estimate body */}
      {est.output && (
        <DocSection label="Scope of Work">
          <pre className="whitespace-pre-wrap text-sm font-sans text-steel-700 leading-relaxed">
            {est.output}
          </pre>
        </DocSection>
      )}

      {/* Totals */}
      <section className="bg-white rounded-2xl border border-steel-200 shadow-sm p-5 sm:p-6 print:rounded-none print:shadow-none">
        <div className="flex justify-between text-sm text-steel-600 mb-2">
          <span>Subtotal</span>
          <span className="tabular-nums">${(est.subtotal||0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-display font-bold text-lg text-brand-700 pt-2 border-t border-steel-200">
          <span>Total</span>
          <span className="tabular-nums">${(est.total||0).toFixed(2)}</span>
        </div>
      </section>

      {/* Signature */}
      <DocSection
        label={
          <span className="inline-flex items-center gap-1.5">
            <PenTool size={11} /> Sign to Approve
          </span>
        }
      >
        {est.signed_at ? (
          <div>
            <div className="border border-steel-200 rounded-lg p-4 bg-steel-50">
              <img src={est.signature_data} alt="Signature" className="max-h-40 mx-auto" />
            </div>
            <p className="text-xs text-steel-500 mt-2 text-center">
              Signed {new Date(est.signed_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <>
            <SignaturePad onChange={setSignature} />
            <button
              onClick={sign}
              disabled={!signature || signing}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold tracking-tight shadow-sm hover:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signing ? <Loader2 size={16} className="animate-spin" /> : 'Approve & Sign Estimate'}
            </button>
            <p className="text-xs text-steel-500 mt-2 text-center">
              By signing, you accept the terms and total above.
            </p>
          </>
        )}
      </DocSection>
    </PublicDocLayout>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-stamp text-steel-500 font-semibold">{label}</p>
      <p className="text-sm text-steel-800 mt-0.5">{value}</p>
    </div>
  )
}
