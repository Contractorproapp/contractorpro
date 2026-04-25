import { motion } from 'framer-motion'

/**
 * Branded shell for public-facing documents (invoice, estimate, project).
 * - Always light theme — these are customer-facing, predictable on print.
 * - Steel header strip with orange top accent + business identity.
 * - Subtle blueprint background, hidden on print.
 * - Sticky bottom action bar on mobile (caller passes `actions`).
 */
export default function PublicDocLayout({
  profile,
  docType,        // "INVOICE" | "ESTIMATE" | "PROJECT"
  docNumber,      // e.g. "INV-001" — optional
  statusBadge,    // optional ReactNode (badge component)
  actions,        // top-right action buttons (download, pay, etc.)
  stickyCta,      // optional ReactNode for sticky bottom bar (mobile primary CTA)
  children,
}) {
  return (
    <div className="min-h-screen bg-steel-50 text-steel-900 print:bg-white">
      {/* Subtle blueprint background — hidden on print */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.04] print:hidden"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top bar */}
      <header className="relative bg-steel-950 text-white print:bg-white print:text-steel-900 print:border-b print:border-steel-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 print:hidden" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.logo_url ? (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="w-11 h-11 rounded-md object-cover ring-1 ring-black/30 print:ring-steel-300"
              />
            ) : (
              <img
                src="/hammer.svg"
                alt="ContractorPro"
                className="w-11 h-11 rounded-md ring-1 ring-black/30 print:ring-steel-300"
              />
            )}
            <div className="min-w-0">
              <p className="font-display font-bold text-base sm:text-lg leading-tight truncate">
                {profile?.business_name || 'Contractor'}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-stamp text-steel-400 print:text-steel-500 mt-0.5">
                {profile?.email || profile?.phone || 'Licensed Contractor'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-stamp text-brand-400 print:text-brand-700">
              {docType}
            </p>
            {docNumber && (
              <p className="font-mono font-bold text-sm sm:text-base mt-0.5">{docNumber}</p>
            )}
            {statusBadge && <div className="mt-1 inline-flex">{statusBadge}</div>}
          </div>
        </div>
      </header>

      {/* Action row (download, pay, etc.) */}
      {actions && (
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 flex flex-wrap items-center justify-end gap-2 print:hidden">
          {actions}
        </div>
      )}

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`relative max-w-3xl mx-auto px-4 sm:px-6 ${actions ? 'mt-4' : 'mt-6'} pb-32 sm:pb-12 space-y-4 sm:space-y-5`}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <footer className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-6 print:pb-2">
        <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-stamp text-steel-500">
          <img src="/hammer.svg" alt="" aria-hidden className="w-4 h-4 rounded-sm opacity-60" />
          Powered by ContractorPro
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      {stickyCta && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-steel-200 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] print:hidden">
          <div className="max-w-3xl mx-auto">{stickyCta}</div>
        </div>
      )}
    </div>
  )
}

/**
 * Reusable section card for public docs — light, stamped section label,
 * print-friendly border.
 */
export function DocSection({ label, children, className = '' }) {
  return (
    <section className={`bg-white rounded-2xl border border-steel-200 print:rounded-none print:border print:shadow-none shadow-sm ${className}`}>
      {label && (
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-stamp text-steel-500 font-semibold">
            {label}
          </p>
        </div>
      )}
      <div className={label ? 'px-5 sm:px-6 pb-5' : 'p-5 sm:p-6'}>
        {children}
      </div>
    </section>
  )
}
