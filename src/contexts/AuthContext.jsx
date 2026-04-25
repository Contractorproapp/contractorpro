import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/onboarding` } })

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      // Land on root — ProtectedRoute decides where they actually go
      // (new -> onboarding, onboarded -> paywall or dashboard).
      options: { redirectTo: `${window.location.origin}/` },
    })

  const signOut = () => supabase.auth.signOut()

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })

  const updatePassword = (password) =>
    supabase.auth.updateUser({ password })

  const refreshProfile = () => user && fetchProfile(user.id)

  // Treat any active-billing state as subscribed. Stripe trials have status
  // `trialing`, paid subs are `active`. Both should grant app access.
  const isSubscribed =
    profile?.subscription_status === 'active' ||
    profile?.subscription_status === 'trialing'
  const onboardingComplete = profile?.onboarding_complete === true

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isSubscribed, onboardingComplete,
      signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
