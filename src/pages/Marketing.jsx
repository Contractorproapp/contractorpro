import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { streamClaude } from '../lib/claude'
import { useAuth } from '../contexts/AuthContext'
import AiOutput from '../components/AiOutput'

const SYSTEM = `You are a marketing copywriter who specializes in helping local contractors grow their business. Write compelling, authentic, ready-to-use content. Sound real and human — not corporate. Include a clear call to action. Write the copy only, no instructions or placeholders.`

const CONTENT_TYPES = [
  { key:'google_review_response', label:'Respond to Review', icon:'⭐', fields:[
    { key:'reviewText', label:'Review Text', placeholder:'Paste the customer review here…', multiline:true },
    { key:'positive', label:'Is it positive or negative?', type:'select', options:['Positive','Negative','Mixed'] },
  ]},
  { key:'facebook_post', label:'Facebook / Instagram Post', icon:'📱', fields:[
    { key:'jobType', label:'What job did you complete?', placeholder:'e.g. Full bathroom remodel in Oak Park' },
    { key:'highlight', label:'What are you proud of?', placeholder:'e.g. Caught hidden water damage, upgraded to walk-in shower' },
    { key:'cta', label:'Call to Action', type:'select', options:['Call for a free quote','DM for availability','Check out more photos','Tag a friend who needs this'] },
  ]},
  { key:'google_bio', label:'Google Business Bio', icon:'🔍', fields:[
    { key:'trade', label:'Trade / Services', placeholder:'Plumbing, water heater installs, drain cleaning' },
    { key:'years', label:'Years in Business', placeholder:'12' },
    { key:'serviceArea', label:'Service Area', placeholder:'Chicago & surrounding suburbs' },
    { key:'differentiator', label:'What makes you different?', placeholder:'Family owned, same-day service, 5-year warranty on labor' },
  ]},
  { key:'website_about', label:'Website "About Us"', icon:'🌐', fields:[
    { key:'ownerName', label:'Owner Name', placeholder:'Mike & Lisa Torres' },
    { key:'founded', label:'Founded', placeholder:'2008' },
    { key:'trade', label:'Services', placeholder:'Residential roofing, gutters, siding' },
    { key:'story', label:'Your story / background', placeholder:'Started after 15 years at a large company, wanted to give clients personal attention…', multiline:true },
  ]},
  { key:'sms_blast', label:'SMS to Past Clients', icon:'💬', fields:[
    { key:'offer', label:'What are you offering?', placeholder:'Spring AC tune-up special — $89' },
    { key:'urgency', label:'Deadline or urgency', placeholder:'Only 10 spots available this month' },
  ]},
]

export default function Marketing() {
  const { profile } = useAuth()
  const [activeType, setActiveType]   = useState(CONTENT_TYPES[0])
  const [fieldValues, setFieldValues] = useState({})
  const [output, setOutput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setField = (key, val) => setFieldValues(fv => ({ ...fv, [key]:val }))

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-14 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold">Marketing Copy</h1>
        <p className="text-gray-500 text-sm mt-0.5">Professional content for your business — written in seconds</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map(ct => (
          <button key={ct.key} onClick={() => { setActiveType(ct); setFieldValues({}); setOutput(''); setError('') }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeType.key===ct.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            <span>{ct.icon}</span>{ct.label}
          </button>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{activeType.icon}</span>
          <h2 className="font-semibold">{activeType.label}</h2>
        </div>
        {activeType.fields.map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            {field.type==='select' ? (
              <select className="input" value={fieldValues[field.key]||''} onChange={e => setField(field.key, e.target.value)}>
                <option value="">Select…</option>
                {field.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : field.multiline ? (
              <textarea className="input h-24 resize-none" placeholder={field.placeholder} value={fieldValues[field.key]||''} onChange={e => setField(field.key, e.target.value)} />
            ) : (
              <input className="input" placeholder={field.placeholder} value={fieldValues[field.key]||''} onChange={e => setField(field.key, e.target.value)} />
            )}
          </div>
        ))}
        <div className="flex justify-end pt-1">
          <button onClick={generate} disabled={loading} className="btn-primary">
            <Sparkles size={16} />{loading ? 'Writing…' : 'Generate Copy'}
          </button>
        </div>
        <AiOutput text={output} loading={loading} error={error} label="Generated Copy" />
      </div>
    </div>
  )
}
