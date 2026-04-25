import { useState } from 'react'
import { X, Send, Loader2, ExternalLink, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendEmail } from '../lib/email'
import { useToast } from './Toast'

export default function EmailModal({ open, onClose, initialTo = '', initialSubject = '', initialBody = '', kind, mailtoFallback }) {
  const toast = useToast()
  const [to, setTo]           = useState(initialTo)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody]       = useState(initialBody)
  const [sending, setSending] = useState(false)

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
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="card max-w-lg w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

            <div className="flex items-start justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="stamp-label text-brand-600 dark:text-brand-400">// Outbox</p>
                <h2 className="font-display font-bold text-lg text-foreground mt-0.5 flex items-center gap-2">
                  <Mail size={16} className="text-brand-500" />
                  Send Email
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="label">To</label>
                <input
                  className="input"
                  type="email"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
              <div>
                <label className="label">Subject</label>
                <input
                  className="input"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Message</label>
                <textarea
                  className="input h-40 resize-none font-mono text-sm leading-relaxed"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sent from your business name via ContractorPro. Replies go straight to your inbox.
              </p>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-t border-border gap-2">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
