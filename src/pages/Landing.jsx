import { Link } from 'react-router-dom'
import {
  FileText, Users, Receipt, FolderOpen, Megaphone, Sparkles, Shield, Zap,
  ArrowRight, CheckCircle2, Wrench,
} from 'lucide-react'
import { motion } from 'framer-motion'

const FEATURES = [
  { icon: FileText,   title: 'AI Estimates',     desc: 'Generate professional, itemized estimates in seconds from a few inputs.' },
  { icon: Users,      title: 'Lead Follow-Ups',  desc: 'Never lose a job. AI-written follow-up texts, emails, and call scripts.' },
  { icon: Receipt,    title: 'Invoicing',        desc: 'Send branded invoices with payment instructions and shareable links.' },
  { icon: FolderOpen, title: 'Project Tracking', desc: 'Field notes and change orders organized by job. Share with clients.' },
  { icon: Megaphone,  title: 'Marketing Copy',   desc: 'Review responses, social posts, and SMS blasts — written for you.' },
  { icon: Shield,     title: 'Private & Secure', desc: 'Your data is encrypted and isolated. No one else can see your business.' },
]

const STEPS = [
  { n: '01', t: 'Sign up & add your logo', d: 'Create your account and upload your business logo. Takes 60 seconds.' },
  { n: '02', t: 'Connect your AI key',     d: 'Paste your Anthropic API key (pennies per estimate). You control the costs.' },
  { n: '03', t: 'Run your business',       d: 'Create estimates, track leads, send invoices — all in one place.' },
]

const PERKS = [
  'Unlimited estimates, invoices & projects',
  'AI-powered content generation',
  'Branded PDFs + shareable client links',
  'Mobile-friendly · works on any device',
  'Cancel anytime',
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- Nav ---------- */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/hammer.svg" alt="ContractorPro" className="w-9 h-9 rounded-md ring-1 ring-black/10 dark:ring-white/10" />
          <span className="font-display font-bold text-lg tracking-tight">ContractorPro</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="btn-primary text-sm">Start Free Trial</Link>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* Blueprint background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />
        {/* Soft orange glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 60%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 px-3 py-1 rounded-full text-xs font-semibold tracking-tight mb-6 ring-1 ring-brand-200/60 dark:ring-brand-500/20">
            <Sparkles size={13} /> AI-powered tools for contractors
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tightest leading-[1.05]">
            Spend less time in the office.
            <br />
            <span className="text-brand-600 dark:text-brand-400">More time on the job.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            ContractorPro writes your estimates, invoices, follow-ups, and marketing — so you can focus on the work that actually pays.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/signup" className="btn-primary text-base px-6 py-3">
              Start 7-Day Free Trial <ArrowRight size={16} />
            </Link>
            <span className="text-sm text-muted-foreground">$29/month after · cancel anytime</span>
          </div>
          <p className="stamp-label text-muted-foreground mt-10">Rev. 2026 · Built for the trades</p>
        </motion.div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="bg-muted/40 dark:bg-card/40 py-20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="stamp-label text-brand-600 dark:text-brand-400">// What's Inside</p>
            <h2 className="font-display font-bold text-3xl tracking-tight mt-2">Everything your business runs on</h2>
            <p className="text-muted-foreground mt-2">One tool. Replaces five.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="card p-6"
                >
                  <div className="w-10 h-10 rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/20 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display font-semibold text-base">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="stamp-label text-brand-600 dark:text-brand-400">// Setup</p>
          <h2 className="font-display font-bold text-3xl tracking-tight mt-2">How it works</h2>
          <p className="text-muted-foreground mt-2">Three steps. About five minutes.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="card p-6 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
              <div className="font-display font-bold text-3xl text-brand-600 dark:text-brand-400 tracking-tightest">{s.n}</div>
              <h3 className="font-display font-semibold text-base mt-3">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section className="bg-steel-950 text-white py-20 relative overflow-hidden">
        {/* Blueprint background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Top orange accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

        <div className="relative max-w-xl mx-auto px-4 sm:px-6 text-center">
          <p className="stamp-label text-brand-400 mb-2">// Pricing</p>
          <h2 className="font-display font-bold text-3xl tracking-tight">Simple, honest pricing</h2>
          <p className="text-steel-400 mt-2">No per-user fees. No limits on estimates or invoices.</p>

          <div className="bg-steel-900 rounded-2xl p-8 border border-steel-800 mt-8 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />
            <div className="font-display font-bold text-5xl tracking-tightest">
              $29<span className="text-lg font-normal text-steel-400">/month</span>
            </div>
            <p className="text-steel-400 mt-2 text-sm">After a 7-day free trial</p>

            <ul className="text-left space-y-2.5 mt-7">
              {PERKS.map(p => (
                <li key={p} className="flex gap-2.5 text-sm">
                  <CheckCircle2 size={16} className="text-brand-400 shrink-0 mt-0.5" />
                  <span className="text-steel-100">{p}</span>
                </li>
              ))}
            </ul>

            <Link to="/signup" className="btn-primary w-full mt-7 justify-center">
              Start Free Trial <ArrowRight size={16} />
            </Link>

            <p className="text-xs text-steel-400 mt-4 leading-relaxed">
              Plus your own Anthropic API usage — typically{' '}
              <strong className="text-steel-100">pennies per estimate</strong>. You bring your own API key so AI costs are billed directly to you by Anthropic (no markup from us).
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="py-10 border-t border-border text-center text-sm text-muted-foreground">
        <div className="flex justify-center items-center gap-1.5 mb-3">
          <img src="/hammer.svg" alt="" aria-hidden className="w-5 h-5 rounded-sm opacity-70" />
          <span className="font-display font-semibold text-foreground">ContractorPro</span>
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms"   className="hover:text-foreground transition-colors">Terms</Link>
          <a href="mailto:Contractorproapp@proton.me" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <p className="stamp-label">© {new Date().getFullYear()} ContractorPro · Made for the trades</p>
      </footer>
    </div>
  )
}
