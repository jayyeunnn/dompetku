export default function Card({ children, className = '', onClick, padding = true }) {
  const baseClasses = `bg-surface rounded-2xl shadow-card ${padding ? 'p-4' : ''}`
  const interactiveClasses = onClick ? 'card-interactive cursor-pointer' : ''

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
