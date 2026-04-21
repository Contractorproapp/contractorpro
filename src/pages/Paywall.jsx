import { useState } from 'react'
import { Hammer, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { redirectToCheckout } from '../lib/stripe'

const FEATURES = [
  'AI-powered estimates in seconds',
  'Lead & follow-up tracker',
  'Professional invoicing',
  'Project notes & change orders',
  'Marketing copy generator',
  'Shareable client links',
  'Mobile-friendly on any device',
]

export default function Paywall() {
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      await redirectToCheckout(user.id, profile?.email || user.email)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Hammer size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Start your free trial</h1>
          <p className="text-gray-500 text-sm mt-1">7 days free · then $29/month · cancel anytime</p>
        </div>

        <div className="card p-6 space-y-5">
          <div className="text-center py-2">
            <span className="text-5xl font-bold">$29</span>
            <span className="text-gray-500 text-lg">/mo</span>
            <p className="text-sm text-gray-400 mt-1">Everything included. No hidden fees.</p>
          </div>

          <ul className="space-y-2.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Start Free Trial →'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Secure payment via Stripe. Cancel anytime from your account settings.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500">
          Wrong account?{' '}
          <button onClick={signOut} className="text-brand-600 font-medium hover:underline">Sign out</button>
        </p>
      </div>
    </div>
  )
}
