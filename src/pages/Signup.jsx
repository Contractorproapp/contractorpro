import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, MailCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout
        eyebrow="// Almost there"
        title="Check your email"
        subtitle={<>We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to activate your account.</>}
        footer={<Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Back to sign in</Link>}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center ring-4 ring-green-50 dark:ring-green-500/5">
            <MailCheck size={26} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="stamp-label text-muted-foreground">Link expires in 24 hours</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="// Free 7-Day Trial"
      title="Start your trial"
      subtitle="No card required. Cancel anytime."
      footer={
        <>Already have an account?{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
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
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input pl-9"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Confirm password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input pl-9"
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
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
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>

          <p className="text-xs text-muted-foreground text-center pt-1">
            By signing up you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">Terms</Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            $29/month after your free trial.
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}
