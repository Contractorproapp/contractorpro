import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, isSubscribed, onboardingComplete } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  if (!isSubscribed) return <Navigate to="/subscribe" replace />

  return children
}
