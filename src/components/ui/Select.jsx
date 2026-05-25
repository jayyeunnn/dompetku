import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  renderOption,
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full min-w-0 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full px-4 py-3 pr-10 rounded-xl appearance-none
            bg-background-secondary border border-transparent
            text-text-primary text-base
            transition-all duration-150
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface
          "
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
        />
      </div>
    </div>
  )
}
