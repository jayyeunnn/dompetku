import { useState, useRef, useEffect } from 'react'
import { formatCurrency, parseAmount } from '../../lib/formatters'

export default function AmountInput({
  value,
  onChange,
  label = 'Nominal',
  placeholder = '0',
  autoFocus = false,
}) {
  const [displayValue, setDisplayValue] = useState(
    value ? formatCurrency(value, false) : ''
  )
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Sync displayValue when value prop changes externally (e.g. quick fill buttons)
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('')
    } else if (value > 0) {
      setDisplayValue(formatCurrency(value, false))
    }
  }, [value])

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    if (raw === '') {
      setDisplayValue('')
      onChange(0)
      return
    }
    const num = parseInt(raw, 10)
    setDisplayValue(formatCurrency(num, false))
    onChange(num)
  }

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-tertiary">
          Rp
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="
            w-full pl-14 pr-4 py-4 rounded-2xl
            bg-background-secondary border-2 border-transparent
            text-2xl font-bold text-text-primary tabular-nums
            placeholder:text-text-tertiary placeholder:font-normal
            transition-all duration-150
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface
          "
        />
      </div>
    </div>
  )
}
