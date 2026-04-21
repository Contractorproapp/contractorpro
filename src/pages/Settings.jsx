import { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle2, ExternalLink } from 'lucide-react'
import { getApiKey, setApiKey } from '../lib/claude'

export default function Settings() {
  const [key, setKey] = useState(getApiKey)
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure your ContractorPro account</p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Claude AI — API Key</h2>
          <p className="text-sm text-gray-500">
            The AI features (estimate generation, follow-up drafts, marketing copy) use Claude by Anthropic.
            Your key is stored only in your browser — it never leaves your device.
          </p>
        </div>

        <div>
          <label className="label">API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className="input pr-10"
                type={show ? 'text' : 'password'}
                placeholder="sk-ant-api03-…"
                value={key}
                onChange={e => setKey(e.target.value)}
              />
              <button
                onClick={() => setShow(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button onClick={save} className="btn-primary shrink-0">
              {saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save</>}
            </button>
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <p className="text-sm text-brand-800 font-medium mb-1">Don't have an API key?</p>
          <p className="text-sm text-brand-700">
            Get one free at{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium inline-flex items-center gap-0.5"
            >
              console.anthropic.com <ExternalLink size={12} />
            </a>
            . New accounts include free credits to get started.
          </p>
        </div>
      </div>

      <div className="card p-5 space-y-2">
        <h2 className="font-semibold">Data Storage</h2>
        <p className="text-sm text-gray-500">
          All your estimates, leads, invoices, and projects are saved in your browser's local storage.
          No account needed — your data stays on your device.
        </p>
        <button
          onClick={() => {
            if (confirm('This will delete ALL your data (estimates, leads, invoices, projects). This cannot be undone. Continue?')) {
              const keysToDelete = Object.keys(localStorage).filter(k => k.startsWith('contractorpro_'))
              keysToDelete.forEach(k => localStorage.removeItem(k))
              window.location.reload()
            }
          }}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Clear all data
        </button>
      </div>
    </div>
  )
}
