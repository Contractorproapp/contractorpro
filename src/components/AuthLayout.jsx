import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Wrench, Receipt as ReceiptIcon } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

/**
 * Shared split-screen layout for all auth pages.
 * - Left (lg+): industrial blueprint hero — steel gradient, grid, stamped copy.
 * - Right: themed form panel.
 * On mobile the hero collapses to a thin orange-bordered top stripe with the logo.
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* Hero panel */}
      <div className="relative lg:w-1/2 lg:min-h-screen overflow-hidden bg-steel-950 text-steel-100 flex flex-col">
        {/* Orange top accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 z-10" />
        {/* Blueprint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Soft orange glow bottom-left */}
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 w-[460px] h-[460px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 65%)' }}
        />

        {/* Top brand row */}
        <div className="relative flex items-center justify-between px-6 lg:px-10 pt-6 lg:pt-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/hammer.svg"
              alt="ContractorPro"
              className="w-9 h-9 rounded-md ring-1 ring-black/30 transition-transform group-hover:rotate-[-6deg]"
            />
            <span className="font-display font-bold text-base tracking-tight">
              ContractorPro
            </span>
          </Link>
        </div>

        {/* Hero content — only visible lg+ */}
        <div className="relative hidden lg:flex flex-1 flex-col justify-center px-10 xl:px-16 max-w-xl">
          <p className="stamp-label text-brand-400 mb-4">// Field-Tested SaaS</p>
          <h2 className="font-display font-bold text-4xl xl:text-5xl tracking-tightest leading-[1.05] text-white">
            Your business,
            <br />
            built to spec.
          </h2>
          <p className="mt-5 text-steel-300 text-base leading-relaxed max-w-md">
            Estimates, invoices, projects, and clients — one rugged
            workspace for contractors who'd rather be on site than buried
            in paperwork.
          </p>

          <ul className="mt-10 space-y-4 max-w-md">
            <FeatureRow Icon={Wrench}       title="Built for the trades"   sub="Estimates → invoices in two taps" />
            <FeatureRow Icon={ReceiptIcon}  title="Get paid faster"        sub="Branded PDFs, Stripe-ready" />
            <FeatureRow Icon={ShieldCheck}  title="Your data, locked tight" sub="Encrypted at rest. Yours forever." />
          </ul>

          <p className="mt-12 text-xs uppercase tracking-stamp text-steel-500">
            Rev. 2026 · Made for contractors
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {eyebrow && (
            <p className="stamp-label text-brand-600 dark:text-brand-400 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-bold text-2xl lg:text-3xl tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}

          <div className="mt-6">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function FeatureRow({ Icon, title, sub }) {
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-md bg-steel-900 ring-1 ring-steel-800 flex items-center justify-center">
        <Icon size={16} className="text-brand-400" />
      </div>
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-steel-400 text-xs mt-0.5">{sub}</p>
      </div>
    </li>
  )
}
