import { useState, useEffect } from 'react'
import {
  Save, Upload, Eye, EyeOff, CheckCircle2, Loader2, ExternalLink,
  CreditCard, Lock, Building2, Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import PageHeader from '../components/PageHeader'
import { cn } from '../lib/utils'

const DAILY_LIMIT = 350

function SectionCard({ icon: Icon, title, children, accent = false }) {
  return (
    <div className="card p-5 sm:p-6 space-y-5 relative overflow-hidden">
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
      )}
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-brand-500" />}
        <h2 className="font-display font-semibold text-base text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function AiUsageCard() {
  const { user } = useAuth()
  const [used, setUsed] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.rpc('ai_usage_today', { uid: user.id }).then(({ data }) => setUsed(data ?? 0))
  }, [user])

  const pct = used == null ? 0 : Math.min(100, (used / DAILY_LIMIT) * 100)
  const tone = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-brand-500'

  return (
    <SectionCard icon={Sparkles} title="AI Usage Today">
      <div className="flex items-center justify-between">
        <span className="stamp-label text-muted-foreground">Calls today</span>
        <span className="font-display font-bold text-base tabular-nums text-foreground">
          {used ?? '—'} <span className="text-muted-foreground font-medium text-sm">/ {DAILY_LIMIT}</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn('h-full transition-colors', tone)}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Daily cap on Claude API calls (estimates, follow-ups, marketing). Resets every 24h. Protects you from runaway costs if your key leaks.
      </p>
    </SectionCard>
  )
}

function ChangePasswordCard() {
  const { updatePassword } = useAuth()
  const toast = useToast()
  const [pw, setPw]         = useState('')
  const [confirm, setConf]  = useState('')
  const [show, setShow]     = useState(false)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  const submit = async () => {
    setErr('')
    if (pw.length < 8)        return setErr('Password must be at least 8 characters.')
    if (pw !== confirm)       return setErr('Passwords do not match.')
    setBusy(true)
    const { error } = await updatePassword(pw)
    setBusy(false)
    if (error) return setErr(error.message)
    setPw(''); setConf('')
    toast.success('Password updated')
  }

  return (
    <SectionCard icon={Lock} title="Change Password">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={show ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={pw}
              onChange={e => setPw(e.target.value)}
            />
            <button
              onClick={() => setShow(s => !s)}
              aria-label={show ? 'Hide' : 'Show'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input
            className="input"
            type={show ? 'text' : 'password'}
            placeholder="Retype new password"
            value={confirm}
            onChange={e => setConf(e.target.value)}
          />
        </div>
      </div>
      {err && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
          {err}
        </p>
      )}
      <div className="flex justify-end">
        <button onClick={submit} disabled={busy || !pw || !confirm} className="btn-primary">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <><Lock size={15} /> Update Password</>}
        </button>
      </div>
    </SectionCard>
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

  // Whether the user has a key on file (encrypted or legacy plaintext).
  // We never display the actual key — encrypted keys can't be read client-side
  // by design, and showing legacy plaintext defeats the encryption migration.
  const hasKey = !!(profile?.claude_api_key_encrypted || profile?.claude_api_key)

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setPhone(profile.phone || '')
      setReviewUrl(profile.google_review_url || '')
      // API key field stays empty on load — user types a new key to replace.
      setApiKey('')
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
    setSaving(true); setError('')

    let logoUrl = profile?.logo_url || null
    if (logoFile) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return }
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      logoUrl = data.publicUrl
    }

    // Save the non-secret fields directly (RLS-protected)
    const { error: dbErr } = await supabase.from('profiles').upsert({
      id: user.id,
      business_name: businessName.trim(),
      phone: phone.trim(),
      google_review_url: reviewUrl.trim(),
      ...(logoUrl && { logo_url: logoUrl }),
    })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }

    // The API key goes through a dedicated Edge Function that encrypts it
    // server-side with AES-GCM-256 before persisting. The plaintext key
    // never lands in the database.
    if (apiKey.trim()) {
      const { error: keyErr } = await supabase.functions.invoke('save-api-key', {
        body: { api_key: apiKey.trim() },
      })
      if (keyErr) { setError(`Couldn't save API key: ${keyErr.message}`); setSaving(false); return }
      setApiKey('')   // clear the input — never echo the key back
    }

    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const manageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal', { body: { user_id: user.id } })
    if (data?.url) window.open(data.url, '_blank')
    else toast.error(error?.message || 'Could not open billing portal')
  }

  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Settings"
        title="Profile & Settings"
        subtitle="Your business info, API key, and billing."
      />

      {/* Business Info */}
      <SectionCard icon={Building2} title="Business Info" accent>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              : <Upload size={22} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-foreground mb-1">Business Logo</p>
            <p className="text-xs text-muted-foreground mb-2">Shows on estimates, invoices & public links</p>
            <label className="btn-secondary text-xs py-1.5 px-3 cursor-pointer">
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="label">Google Review Link <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
          <input className="input" placeholder="https://g.page/r/..." value={reviewUrl} onChange={e => setReviewUrl(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1.5">
            Used for the "Request Review" button on paid invoices. Get yours from your Google Business profile.
          </p>
        </div>

        <div>
          <label className="label">Claude API Key</label>
          <p className="text-xs text-muted-foreground mb-2">
            Powers all AI features. Get yours at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 font-semibold underline inline-flex items-center gap-0.5">
              console.anthropic.com <ExternalLink size={10} />
            </a>
          </p>

          {hasKey && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
              <CheckCircle2 size={12} /> Key configured
              {profile?.claude_api_key && !profile?.claude_api_key_encrypted && (
                <span className="text-yellow-700 dark:text-yellow-400 ml-1">· legacy plaintext, save again to encrypt</span>
              )}
            </div>
          )}

          <div className="relative">
            <input
              className="input pr-10 font-mono"
              type={showKey ? 'text' : 'password'}
              placeholder={hasKey ? 'Paste a new key to replace…' : 'sk-ant-api03-…'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Encrypted at rest with AES-GCM-256. Once saved, the key can't be read back — only used server-side.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving
              ? <Loader2 size={15} className="animate-spin" />
              : saved
                ? <><CheckCircle2 size={15} /> Saved!</>
                : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </SectionCard>

      <ChangePasswordCard />
      <AiUsageCard />

      {/* Billing */}
      <SectionCard icon={CreditCard} title="Billing">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Plan:</span>{' '}
              <span className="font-display font-semibold">ContractorPro — $29/mo</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              Status:
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight',
                isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-green-500' : 'bg-red-500')} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <button onClick={manageSubscription} className="btn-secondary text-sm">
            <CreditCard size={15} /> Manage Billing
          </button>
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account">
        <p className="text-sm text-muted-foreground">
          Signed in as{' '}
          <strong className="font-display font-semibold text-foreground">{user?.email}</strong>
        </p>
      </SectionCard>
    </div>
  )
}
