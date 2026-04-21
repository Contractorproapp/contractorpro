import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hammer, Upload, Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
    setSaving(true)
    setError('')

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set up your business</h1>
          <p className="text-gray-500 text-sm mt-1">This info appears on your estimates and invoices</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                : <Upload size={20} className="text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Business Logo</p>
              <p className="text-xs text-gray-400 mb-2">Appears on estimates & invoices</p>
              <label className="btn-secondary text-xs py-1 px-3 cursor-pointer">
                Choose File
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="label">Business Name *</label>
            <input className="input" placeholder="Smith Roofing & Construction" value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>

          <div>
            <label className="label">Business Phone</label>
            <input className="input" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="label">Claude API Key</label>
            <p className="text-xs text-gray-400 mb-1.5">Powers AI estimates, follow-up drafts, and marketing copy. Get one free at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">console.anthropic.com</a></p>
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
            <p className="text-xs text-gray-400 mt-1">You can skip this and add it later in Settings.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center py-2.5">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save & Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
