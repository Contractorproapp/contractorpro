import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hammer, Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
    // Supabase drops a recovery token into the URL hash and fires PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Fallback: if there's already a session (e.g. refresh), allow update.
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={24} className="text-white" />
          </div>
          <h1 className="page-title">Choose a new password</h1>
          <p className="page-subtitle">Make it at least 8 characters</p>
        </div>

        <div className="card p-6 space-y-4">
          {invalidLink ? (
            <div className="text-center space-y-3">
              <p className="font-medium text-red-600">Reset link is invalid or expired</p>
              <Link to="/forgot-password" className="btn-primary w-full justify-center">Request a new link</Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <p className="font-medium">Password updated</p>
              <p className="text-sm text-gray-500">Redirecting you now…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={!ready}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!ready && <p className="text-xs text-gray-400">Verifying reset link…</p>}
              <button type="submit" disabled={loading || !ready} className="btn-primary w-full justify-center py-2.5">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
