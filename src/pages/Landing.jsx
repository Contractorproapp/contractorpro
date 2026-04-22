import { Link } from 'react-router-dom'
import { Hammer, FileText, Users, Receipt, FolderOpen, Megaphone, Sparkles, Shield, Zap } from 'lucide-react'

const FEATURES = [
  { icon: FileText,   title: 'AI Estimates',        desc: 'Generate professional, itemized estimates in seconds from a few inputs.' },
  { icon: Users,      title: 'Lead Follow-Ups',     desc: 'Never lose a job. AI-written follow-up texts, emails, and call scripts.' },
  { icon: Receipt,    title: 'Invoicing',           desc: 'Send branded invoices with payment instructions and shareable links.' },
  { icon: FolderOpen, title: 'Project Tracking',    desc: 'Field notes and change orders organized by job. Share with clients.' },
  { icon: Megaphone,  title: 'Marketing Copy',      desc: 'Review responses, social posts, and SMS blasts — written for you.' },
  { icon: Shield,     title: 'Private & Secure',    desc: 'Your data is encrypted and isolated. No one else can see your business.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center"><Hammer size={18} className="text-white" /></div>
          <span className="font-bold text-lg">ContractorPro</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">Sign In</Link>
          <Link to="/signup" className="btn-primary text-sm">Start Free Trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium mb-5">
          <Sparkles size={13} /> AI-powered tools for contractors
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          Spend less time in the office.<br />
          <span className="text-brand-600">More time on the job.</span>
        </h1>
        <p className="text-lg text-gray-600 mt-5 max-w-2xl mx-auto">
          ContractorPro writes your estimates, invoices, follow-ups, and marketing — so you can focus on the work that actually pays.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link to="/signup" className="btn-primary text-base px-6 py-3">Start 7-Day Free Trial</Link>
          <span className="text-sm text-gray-500">$29/month after · cancel anytime</span>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-3">Everything your business runs on</h2>
          <p className="text-gray-500 text-center mb-12">One tool. Replaces five.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { n: '1', t: 'Sign up & add your logo', d: 'Create your account and upload your business logo. Takes 60 seconds.' },
            { n: '2', t: 'Connect your AI key',     d: 'Paste your Anthropic API key (pennies per estimate). You control the costs.' },
            { n: '3', t: 'Run your business',       d: 'Create estimates, track leads, send invoices — all in one place.' },
          ].map(s => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">{s.n}</div>
              <h3 className="font-semibold mt-4 mb-2">{s.t}</h3>
              <p className="text-sm text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Simple, honest pricing</h2>
          <p className="text-gray-400 mb-8">No per-user fees. No limits on estimates or invoices.</p>
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="text-5xl font-bold">$29<span className="text-lg font-normal text-gray-400">/month</span></div>
            <p className="text-gray-400 mt-2">After a 7-day free trial</p>
            <ul className="text-left space-y-2 mt-6 text-sm">
              <li className="flex gap-2"><Zap size={16} className="text-brand-400 shrink-0 mt-0.5" /> Unlimited estimates, invoices & projects</li>
              <li className="flex gap-2"><Zap size={16} className="text-brand-400 shrink-0 mt-0.5" /> AI-powered content generation</li>
              <li className="flex gap-2"><Zap size={16} className="text-brand-400 shrink-0 mt-0.5" /> Shareable links for clients</li>
              <li className="flex gap-2"><Zap size={16} className="text-brand-400 shrink-0 mt-0.5" /> Mobile-friendly</li>
              <li className="flex gap-2"><Zap size={16} className="text-brand-400 shrink-0 mt-0.5" /> Cancel anytime</li>
            </ul>
            <Link to="/signup" className="btn-primary w-full mt-6 justify-center">Start Free Trial →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link to="/terms" className="hover:text-gray-700">Terms</Link>
          <a href="mailto:Contractorproapp@proton.me" className="hover:text-gray-700">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} ContractorPro</p>
      </footer>
    </div>
  )
}
