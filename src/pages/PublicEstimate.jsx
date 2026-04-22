import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Hammer, Download, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SignaturePad from '../components/SignaturePad'

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
      const { data: prof } = await supabase.from('profiles').select('business_name, phone, email, logo_url').eq('id', data.user_id).single()
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
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div>
        <p className="text-2xl font-bold text-gray-700">Estimate not found</p>
        <p className="text-gray-400 mt-2">This link may be invalid or expired.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto space-y-5">
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
            <p className="text-xs text-gray-400 uppercase tracking-wide">Estimate</p>
            {est.signed_at && <span className="badge bg-green-100 text-green-700 mt-1"><CheckCircle2 size={12} /> Signed</span>}
          </div>
        </div>

        {/* Details */}
        <div className="card p-6 space-y-2">
          {est.client_name && <p className="text-sm"><span className="text-gray-500">Client:</span> <strong>{est.client_name}</strong></p>}
          {est.job_title   && <p className="text-sm"><span className="text-gray-500">Job:</span> {est.job_title}</p>}
          {est.address     && <p className="text-sm"><span className="text-gray-500">Address:</span> {est.address}</p>}
        </div>

        {/* AI Output */}
        {est.output && (
          <div className="card p-6">
            <pre className="whitespace-pre-wrap text-sm font-sans text-gray-700">{est.output}</pre>
          </div>
        )}

        {/* Totals */}
        <div className="card p-6">
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${(est.subtotal||0).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg text-brand-700 pt-2 border-t border-gray-200 mt-2"><span>Total</span><span>${(est.total||0).toFixed(2)}</span></div>
        </div>

        {/* Signature */}
        <div className="card p-6 print:hidden">
          <h3 className="font-semibold mb-3">Sign to Approve</h3>
          {est.signed_at ? (
            <div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <img src={est.signature_data} alt="Signature" className="max-h-40 mx-auto" />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Signed {new Date(est.signed_at).toLocaleString()}</p>
            </div>
          ) : (
            <>
              <SignaturePad onChange={setSignature} />
              <button onClick={sign} disabled={!signature || signing} className="btn-primary w-full mt-3 justify-center">
                {signing ? <Loader2 size={16} className="animate-spin" /> : 'Approve & Sign Estimate'}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">By signing, you accept the terms and total above.</p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Powered by ContractorPro</p>
      </div>
    </div>
  )
}
