export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-background-secondary border border-transparent
          text-text-primary placeholder:text-text-tertiary
          text-base
          transition-all duration-150
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface
          ${error ? 'border-expense ring-2 ring-expense/20' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-expense ml-1">{error}</p>
      )}
    </div>
  )
}
