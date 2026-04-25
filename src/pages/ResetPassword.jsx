import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [ready, setReady]       = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else if (!location.hash.includes('type=recovery')) setInvalidLink(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) setError(error.message)
    else {
      setDone(true)
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <AuthLayout
      eyebrow="// New Password"
      title="Choose a new password"
      subtitle="Use at least 8 characters."
    >
      {invalidLink ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center ring-4 ring-red-50 dark:ring-red-500/5">
            <AlertTriangle size={26} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="font-display font-semibold text-foreground">Reset link is invalid or expired</p>
          <Link to="/forgot-password" className="btn-primary justify-center w-full">
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center ring-4 ring-green-50 dark:ring-green-500/5">
            <CheckCircle2 size={26} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="font-display font-semibold text-foreground">Password updated</p>
          <p className="text-sm text-muted-foreground">Redirecting you now…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input pl-9"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={!ready}
                required
                autoFocus
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
                disabled={!ready}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {!ready && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Verifying reset link…
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="btn-primary w-full justify-center py-2.5 text-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
