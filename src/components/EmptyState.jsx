/**
 * Themed empty-state card with industrial accent.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card p-12 text-center">
      {Icon && (
        <div className="mx-auto w-14 h-14 rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-500/20 ring-1 ring-brand-200/60 dark:ring-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  )
}
