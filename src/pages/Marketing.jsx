import { useState } from 'react'
import { Sparkles, Star, Smartphone, Search, Globe, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'
import PageHeader from '../components/PageHeader'
import { cn } from '../lib/utils'

const SYSTEM = `You are a marketing copywriter who specializes in helping local contractors grow their business. Write compelling, authentic, ready-to-use content. Sound real and human — not corporate. Include a clear call to action. Write the copy only, no instructions or placeholders.`

const CONTENT_TYPES = [
  { key: 'google_review_response', label: 'Respond to Review',     Icon: Star,          fields: [
    { key: 'reviewText', label: 'Review Text', placeholder: 'Paste the customer review here…', multiline: true },
    { key: 'positive',   label: 'Is it positive or negative?', type: 'select', options: ['Positive', 'Negative', 'Mixed'] },
  ]},
  { key: 'facebook_post', label: 'Social Media Post',              Icon: Smartphone,    fields: [
    { key: 'jobType',    label: 'What job did you complete?', placeholder: 'e.g. Full bathroom remodel in Oak Park' },
    { key: 'highlight',  label: 'What are you proud of?',     placeholder: 'e.g. Caught hidden water damage, upgraded to walk-in shower' },
    { key: 'cta',        label: 'Call to Action', type: 'select', options: ['Call for a free quote', 'DM for availability', 'Check out more photos', 'Tag a friend who needs this'] },
  ]},
  { key: 'google_bio', label: 'Google Business Bio',               Icon: Search,        fields: [
    { key: 'trade',           label: 'Trade / Services', placeholder: 'Plumbing, water heater installs, drain cleaning' },
    { key: 'years',           label: 'Years in Business', placeholder: '12' },
    { key: 'serviceArea',     label: 'Service Area', placeholder: 'Chicago & surrounding suburbs' },
    { key: 'differentiator',  label: 'What makes you different?', placeholder: 'Family owned, same-day service, 5-year warranty on labor' },
  ]},
  { key: 'website_about', label: 'Website "About Us"',             Icon: Globe,         fields: [
    { key: 'ownerName', label: 'Owner Name', placeholder: 'Mike & Lisa Torres' },
    { key: 'founded',   label: 'Founded', placeholder: '2008' },
    { key: 'trade',     label: 'Services', placeholder: 'Residential roofing, gutters, siding' },
    { key: 'story',     label: 'Your story / background', placeholder: 'Started after 15 years at a large company, wanted to give clients personal attention…', multiline: true },
  ]},
  { key: 'sms_blast', label: 'SMS to Past Clients',                Icon: MessageSquare, fields: [
    { key: 'offer',   label: 'What are you offering?', placeholder: 'Spring AC tune-up special — $89' },
    { key: 'urgency', label: 'Deadline or urgency',    placeholder: 'Only 10 spots available this month' },
  ]},
]

export default function Marketing() {
  const { profile } = useAuth()
  const [activeType, setActiveType]   = useState(CONTENT_TYPES[0])
  const [fieldValues, setFieldValues] = useState({})
  const [output, setOutput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setField = (key, val) => setFieldValues(fv => ({ ...fv, [key]: val }))

  const generate = () => {
    if (!profile?.claude_api_key) { setError('No API key — add yours in Profile & Settings.'); return }
    setOutput(''); setError(''); setLoading(true)

    const fieldsSummary = activeType.fields.map(f => `${f.label}: ${fieldValues[f.key] || 'not provided'}`).join('\n')
    const businessName  = profile?.business_name || 'the contractor'

    streamClaude({
      system: SYSTEM,
      prompt: `Write ${activeType.label} content for ${businessName}.\n\n${fieldsSummary}\n\nContent type: ${activeType.label}`,
      onChunk: (_, full) => setOutput(full),
      onDone:  () => setLoading(false),
      onError: (msg) => { setError(msg); setLoading(false) },
    })
  }

  const ActiveIcon = activeType.Icon

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        eyebrow="// Megaphone"
        title="Marketing Copy"
        subtitle="Professional content for your business — written in seconds."
      />

      {/* Content type selector */}
      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map(ct => {
          const Icon = ct.Icon
          const active = activeType.key === ct.key
          return (
            <button
              key={ct.key}
              onClick={() => { setActiveType(ct); setFieldValues({}); setOutput(''); setError('') }}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-display font-semibold tracking-tight transition-colors border cursor-pointer',
                active
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-accent hover:border-steel-300 dark:hover:border-steel-600'
              )}
            >
              <Icon size={14} /> {ct.label}
            </button>
          )
        })}
      </div>

      {/* Form panel */}
      <motion.div
        key={activeType.key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="card p-5 sm:p-6 space-y-4 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="stamp-label text-brand-600 dark:text-brand-400">// Generator</p>
            <h2 className="font-display font-bold text-lg text-foreground mt-0.5 flex items-center gap-2">
              <ActiveIcon size={18} className="text-brand-500" />
              {activeType.label}
            </h2>
          </div>
        </div>

        {activeType.fields.map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="input"
                value={fieldValues[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
              >
                <option value="">Select…</option>
                {field.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : field.multiline ? (
              <textarea
                className="input h-24 resize-none"
                placeholder={field.placeholder}
                value={fieldValues[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
              />
            ) : (
              <input
                className="input"
                placeholder={field.placeholder}
                value={fieldValues[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <button onClick={generate} disabled={loading} className="btn-primary">
            <Sparkles size={16} /> {loading ? 'Writing…' : 'Generate Copy'}
          </button>
        </div>

        <AiOutput text={output} loading={loading} error={error} label="Generated Copy" />
      </motion.div>
    </div>
  )
}
