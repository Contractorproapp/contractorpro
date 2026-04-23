import { useState, useEffect } from 'react'
import { Save, Upload, Eye, EyeOff, CheckCircle2, Loader2, ExternalLink, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'

const DAILY_LIMIT = 350

function AiUsageCard() {
  const { user } = useAuth()
  const [used, setUsed] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.rpc('ai_usage_today', { uid: user.id }).then(({ data }) => setUsed(data ?? 0))
  }, [user])

  const pct = used == null ? 0 : Math.min(100, (used / DAILY_LIMIT) * 100)
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-brand-500'

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">AI Usage Today</h2>
        <span className="text-sm text-gray-500">{used ?? '—'} / {DAILY_LIMIT}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400">
        Daily cap on Claude API calls (estimates, follow-ups, marketing). Resets every 24h. Protects you from runaway costs if your key leaks.
      </p>
    </div>
  )
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone]               = useState('')
  const [reviewUrl, setReviewUrl]       = useState('')
  const [apiKey, setApiKey]             = useState('')
  const [showKey, setShowKey]           = useState(false)
  const [logoFile, setLogoFile]         = useState(null)
  const [logoPreview, setLogoPreview]   = useState(null)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setPhone(profile.phone || '')
      setReviewUrl(profile.google_review_url || '')
      setApiKey(profile.claude_api_key || '')
      setLogoPreview(profile.logo_url || null)
    }
  }, [profile])

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    let logoUrl = profile?.logo_url || null
    if (logoFile) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return }
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      logoUrl = data.publicUrl
    }

    const { error: dbErr } = await supabase.from('profiles').upsert({
      id: user.id,
      business_name: businessName.trim(),
      phone: phone.trim(),
      google_review_url: reviewUrl.trim(),
      claude_api_key: apiKey.trim(),
      ...(logoUrl && { logo_url: logoUrl }),
    })

    if (dbErr) { setError(dbErr.message); setSaving(false); return }

    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const manageSubscription = async () => {
    // Redirect to Stripe Customer Portal
    const { data, error } = await supabase.functions.invoke('customer-portal', { body: { user_id: user.id } })
    if (data?.url) window.open(data.url, '_blank')
    else toast.error(error?.message || 'Could not open billing portal')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your business info, API key, and billing</p>
      </div>

      {/* Business Info */}
      <div className="card p-5 space-y-5">
        <h2 className="font-semibold">Business Info</h2>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              : <Upload size={22} className="text-gray-400" />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Business Logo</p>
            <p className="text-xs text-gray-400 mb-2">Shows on estimates, invoices & public links</p>
            <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Business Name</label>
            <input className="input" placeholder="Smith Roofing & Construction" value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div>
            <label className="label">Business Phone</label>
            <input className="input" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Google Review Link (optional)</label>
          <input className="input" placeholder="https://g.page/r/..." value={reviewUrl} onChange={e => setReviewUrl(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Used for the "Request Review" button on paid invoices. Get yours from your Google Business profile.</p>
        </div>

        <div>
          <label className="label">Claude API Key</label>
          <p className="text-xs text-gray-400 mb-1.5">
            Powers all AI features. Get yours at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-brand-600 underline inline-flex items-center gap-0.5">
              console.anthropic.com <ExternalLink size={10} />
            </a>
          </p>
          <div className="relative">
            <input
              className="input pr-10"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-api03-…"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <button onClick={() => setShowKey(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>

      <AiUsageCard />

      {/* Billing */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Billing</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Plan: <span className="font-medium">ContractorPro — $29/month</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Status: <span className={`font-medium ${profile?.subscription_status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                {profile?.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <button onClick={manageSubscription} className="btn-secondary text-sm">
            <CreditCard size={15} /> Manage Billing
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="card p-5 space-y-2">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-gray-500">Signed in as <strong>{user?.email}</strong></p>
      </div>
    </div>
  )
}
