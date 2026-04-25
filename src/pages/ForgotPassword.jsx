import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await resetPassword(email.trim())
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <AuthLayout
      eyebrow="// Account Recovery"
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center ring-4 ring-green-50 dark:ring-green-500/5">
            <CheckCircle2 size={26} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="font-display font-semibold text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            If <strong className="text-foreground">{email}</strong> matches an account, a reset link is on its way. It expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input pl-9"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 text-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
