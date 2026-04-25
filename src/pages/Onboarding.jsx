import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, Loader2, Eye, EyeOff, ExternalLink, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone]               = useState('')
  const [apiKey, setApiKey]             = useState('')
  const [showKey, setShowKey]           = useState(false)
  const [logoFile, setLogoFile]         = useState(null)
  const [logoPreview, setLogoPreview]   = useState(null)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!businessName.trim()) { setError('Business name is required'); return }
    setSaving(true); setError('')

    let logoUrl = null
    if (logoFile) {
      const ext  = logoFile.name.split('.').pop()
      const path = `${user.id}/logo.${ext}`
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile, { upsert: true })
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return }
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      logoUrl = data.publicUrl
    }

    const updates = {
      id: user.id,
      business_name: businessName.trim(),
      phone: phone.trim(),
      claude_api_key: apiKey.trim(),
      onboarding_complete: true,
      ...(logoUrl && { logo_url: logoUrl }),
    }

    const { error: dbErr } = await supabase.from('profiles').upsert(updates)
    if (dbErr) { setError(dbErr.message); setSaving(false); return }

    await refreshProfile()
    navigate('/subscribe')
  }

  return (
    <AuthLayout
      eyebrow="// Setup · Step 1 of 2"
      title="Set up your shop"
      subtitle="This info shows on your estimates and invoices."
    >
      <div className="space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              : <Upload size={20} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-display font-semibold text-foreground">Business Logo</p>
            <p className="text-xs text-muted-foreground mb-2">Appears on estimates & invoices</p>
            <label className="btn-secondary text-xs py-1 px-3 cursor-pointer">
              Choose File
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className="label">Business Name <span className="text-brand-600">*</span></label>
          <input
            className="input"
            placeholder="Smith Roofing & Construction"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label">Business Phone</label>
          <input
            className="input"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Claude API Key</label>
          <p className="text-xs text-muted-foreground mb-2">
            Powers AI estimates, follow-up drafts, and marketing copy. Get one free at{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 dark:text-brand-400 font-semibold underline inline-flex items-center gap-0.5"
            >
              console.anthropic.com <ExternalLink size={10} />
            </a>
          </p>
          <div className="relative">
            <input
              className="input pr-10 font-mono"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-api03-…"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <button
              onClick={() => setShowKey(s => !s)}
              aria-label={showKey ? 'Hide' : 'Show'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            You can skip this and add it later in Settings.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full justify-center py-2.5 text-sm"
        >
          {saving
            ? <Loader2 size={16} className="animate-spin" />
            : <>Save & Continue <ArrowRight size={16} /></>}
        </button>
      </div>
    </AuthLayout>
  )
}
