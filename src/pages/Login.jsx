import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'
import GoogleButton from '../components/GoogleButton'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/onboarding')
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  return (
    <AuthLayout
      eyebrow="// Sign In"
      title="Welcome back"
      subtitle="Pick up where you left the job site."
      footer={
        <>Don't have an account?{' '}
          <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Start free trial
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton onClick={handleGoogle} />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="stamp-label text-muted-foreground">Or with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input pl-9"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
