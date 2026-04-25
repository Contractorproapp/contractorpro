import { useState } from 'react'
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { redirectToCheckout } from '../lib/stripe'
import AuthLayout from '../components/AuthLayout'

const FEATURES = [
  'AI-powered estimates in seconds',
  'Lead & follow-up tracker',
  'Professional invoicing + PDFs',
  'Project notes & change orders',
  'Marketing copy generator',
  'Shareable client links',
  'Mobile-friendly on any device',
]

export default function Paywall() {
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Returning customers (already have a Stripe customer record) don't get a
  // second free trial — they go straight to paid. Drives both UI copy and
  // the server-side trial logic in create-checkout-session.
  const isReturning = !!profile?.stripe_customer_id

  const handleSubscribe = async () => {
    setLoading(true); setError('')
    try {
      await redirectToCheckout(user.id, profile?.email || user.email)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={isReturning ? '// Resubscribe' : '// Setup · Step 2 of 2'}
      title={isReturning ? 'Welcome back' : 'Start your free trial'}
      subtitle={
        isReturning
          ? '$29/month · cancel anytime.'
          : '7 days free · then $29/month · cancel anytime.'
      }
      footer={
        <>Wrong account?{' '}
          <button onClick={signOut} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Sign out
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Price plate */}
        <div className="relative card p-5 text-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
          <p className="stamp-label text-brand-600 dark:text-brand-400">// All-Inclusive</p>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="font-display font-bold text-5xl tracking-tightest text-foreground">$29</span>
            <span className="text-muted-foreground text-lg font-display">/mo</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isReturning ? 'Billed today, then monthly' : 'No hidden fees · No tier upsells'}
          </p>
        </div>

        {/* Features list */}
        <ul className="space-y-2.5">
          {FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
              <CheckCircle2 size={16} className="text-green-500 dark:text-green-400 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : isReturning
              ? <>Subscribe — $29/mo <ArrowRight size={16} /></>
              : <>Start Free Trial <ArrowRight size={16} /></>}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={12} /> Secure payment via Stripe. Cancel anytime.
        </p>
      </div>
    </AuthLayout>
  )
}
