import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-sm w-full text-center space-y-4">
        {status === 'verifying' && (
          <>
            <Loader2 size={40} className="animate-spin text-brand-500 mx-auto" />
            <p className="font-semibold">Activating your account…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">You're all set!</h2>
            <p className="text-gray-500 text-sm">Welcome to ContractorPro. Taking you to the dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-600 font-semibold">Something went wrong</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={() => navigate('/subscribe')} className="btn-primary">Try Again</button>
          </>
        )}
      </div>
    </div>
  )
}
