export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-14 px-4">
      {Icon && (
        <div className="mx-auto w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <Icon size={26} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
