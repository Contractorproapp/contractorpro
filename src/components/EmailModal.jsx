import { useState } from 'react'
import { X, Send, Loader2, ExternalLink } from 'lucide-react'
import { sendEmail } from '../lib/email'
import { useToast } from './Toast'

export default function EmailModal({ open, onClose, initialTo = '', initialSubject = '', initialBody = '', kind, mailtoFallback }) {
  const toast = useToast()
  const [to, setTo]           = useState(initialTo)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody]       = useState(initialBody)
  const [sending, setSending] = useState(false)

  if (!open) return null

  const handleSend = async () => {
    if (!to.trim()) { toast.error('Recipient email required'); return }
    setSending(true)
    const res = await sendEmail({ to: to.trim(), subject, body, kind })
    setSending(false)
    if (res.ok) {
      toast.success(`Sent${res.used ? ` · ${res.used}/${res.limit} today` : ''}`)
      onClose()
    } else {
      toast.error(res.error || 'Send failed')
    }
  }

  const handleMailtoFallback = () => {
    if (mailtoFallback) mailtoFallback()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="font-semibold">Send Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">To</label>
            <input className="input" type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="client@email.com" />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input h-40 resize-none font-mono text-sm" value={body} onChange={e => setBody(e.target.value)} />
          </div>
          <p className="text-xs text-gray-400">
            Sent from your business name via ContractorPro. Replies go straight to your inbox.
          </p>
        </div>
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 rounded-b-xl gap-2">
          {mailtoFallback ? (
            <button onClick={handleMailtoFallback} className="btn-ghost text-xs">
              <ExternalLink size={13} /> Open in mail app instead
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="btn-primary">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /> Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
