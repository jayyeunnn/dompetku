const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:bg-primary-hover',
  secondary:
    'bg-primary-light text-primary hover:bg-blue-100 active:bg-blue-200',
  income:
    'bg-income text-white hover:bg-income-dark',
  expense:
    'bg-expense text-white hover:bg-expense-dark',
  transfer:
    'bg-transfer text-white hover:bg-transfer-dark',
  ghost:
    'bg-transparent text-text-secondary hover:bg-background-secondary',
  outline:
    'bg-transparent border border-border text-text-primary hover:bg-background-secondary',
  danger:
    'bg-expense-light text-expense-dark hover:bg-red-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-6 py-3.5 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) {
  const classes = `
    inline-flex items-center justify-center gap-2
    font-semibold transition-all duration-150
    disabled:opacity-50 disabled:pointer-events-none
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : Icon ? (
        <Icon size={18} />
      ) : null}
      {children}
    </button>
  )
}
