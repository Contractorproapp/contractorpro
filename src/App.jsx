import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import UsageWarning from './components/UsageWarning'
import { ToastProvider } from './components/Toast'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import CommandPalette from './components/CommandPalette'
import QuickAdd from './components/QuickAdd'
import MobileTabs from './components/MobileTabs'
import TopSearch from './components/TopSearch'

import Login               from './pages/Login'
import Signup              from './pages/Signup'
import Onboarding          from './pages/Onboarding'
import Paywall             from './pages/Paywall'
import SubscriptionSuccess from './pages/SubscriptionSuccess'
import Estimates           from './pages/Estimates'
import Dashboard           from './pages/Dashboard'
import Leads               from './pages/Leads'
import Invoices            from './pages/Invoices'
import Projects            from './pages/Projects'
import Marketing           from './pages/Marketing'
import Clients             from './pages/Clients'
import Calendar            from './pages/Calendar'
import Expenses            from './pages/Expenses'
import Profile             from './pages/Profile'
import PublicInvoice       from './pages/PublicInvoice'
import PublicProject       from './pages/PublicProject'
import PublicEstimate      from './pages/PublicEstimate'
import Privacy             from './pages/Privacy'
import Terms               from './pages/Terms'
import Landing             from './pages/Landing'
import { useAuth }         from './contexts/AuthContext'
import { Navigate }        from 'react-router-dom'

function Root() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>
  return <Landing />
}

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 lg:pt-20 overflow-y-auto">
        {children}
      </main>
      <MobileTabs onMore={() => window.dispatchEvent(new CustomEvent('open-mobile-drawer'))} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <UsageWarning />
      <BrowserRouter>
        <KeyboardShortcuts />
        <CommandPalette />
        <TopSearch />
        <QuickAdd />
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Signup />} />

          {/* Post-signup flow (auth required, sub not required) */}
          <Route path="/onboarding"         element={<Onboarding />} />
          <Route path="/subscribe"          element={<Paywall />} />
          <Route path="/subscribe/success"  element={<SubscriptionSuccess />} />

          {/* Public shareable pages — no login needed */}
          <Route path="/invoice/:token"  element={<PublicInvoice />} />
          <Route path="/project/:token"  element={<PublicProject />} />
          <Route path="/estimate/:token" element={<PublicEstimate />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms"   element={<Terms />} />

          {/* Landing (public) or Dashboard (auth'd) */}
          <Route path="/" element={<Root />} />
          <Route path="/estimates" element={
            <ProtectedRoute>
              <AppShell><Estimates /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute>
              <AppShell><Leads /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <AppShell><Invoices /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <AppShell><Projects /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/marketing" element={
            <ProtectedRoute>
              <AppShell><Marketing /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <AppShell><Clients /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <AppShell><Calendar /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <AppShell><Expenses /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppShell><Profile /></AppShell>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
