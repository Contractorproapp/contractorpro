import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * Shared page header — stamp eyebrow + display title + subtitle + action slot.
 * Use across all CRUD pages for visual consistency.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, className }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-wrap items-end justify-between gap-4', className)}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="stamp-label text-brand-600 dark:text-brand-400">{eyebrow}</p>
        )}
        <h1 className="font-display font-bold text-2xl lg:text-3xl tracking-tight text-foreground mt-1.5">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </motion.header>
  )
}
