import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [error, setError]   = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId || !user) { setStatus('error'); setError('Missing session. Contact support.'); return }

    const activate = async () => {
      const { data, error } = await supabase.functions.invoke('activate-subscription', {
        body: { session_id: sessionId, user_id: user.id },
      })
      if (error || !data?.success) {
        setStatus('error')
        setError(error?.message || 'Could not verify payment. Contact support.')
        return
      }
      await refreshProfile()
      setStatus('success')
      setTimeout(() => navigate('/'), 2500)
    }

    activate()
  }, [user])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle blueprint background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="card p-10 max-w-sm w-full text-center space-y-4 relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

        {status === 'verifying' && (
          <>
            <Loader2 size={40} className="animate-spin text-brand-500 mx-auto" />
            <p className="font-display font-semibold text-foreground">Activating your account…</p>
            <p className="stamp-label text-muted-foreground">Hold tight</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center ring-4 ring-green-50 dark:ring-green-500/5">
              <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">You're all set!</h2>
            <p className="text-sm text-muted-foreground">
              Welcome to ContractorPro. Taking you to the dashboard…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center ring-4 ring-red-50 dark:ring-red-500/5">
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="font-display font-bold text-foreground">Something went wrong</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => navigate('/subscribe')} className="btn-primary w-full justify-center">
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
