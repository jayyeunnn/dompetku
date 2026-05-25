import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTH_NAMES } from '../../lib/constants'

export default function MonthFilter({ year, month, onChange }) {
  const handlePrev = () => {
    if (month === 0) {
      onChange(year - 1, 11)
    } else {
      onChange(year, month - 1)
    }
  }

  const handleNext = () => {
    if (month === 11) {
      onChange(year + 1, 0)
    } else {
      onChange(year, month + 1)
    }
  }

  const now = new Date()
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="flex items-center justify-between px-1">
      <button
        onClick={handlePrev}
        className="p-2 rounded-xl hover:bg-background-secondary active:scale-95 transition-all"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft size={20} className="text-text-secondary" />
      </button>

      <div className="text-center">
        <h2 className="text-base font-bold text-text-primary">
          {MONTH_NAMES[month]}
        </h2>
        <p className="text-xs text-text-tertiary">{year}</p>
      </div>

      <button
        onClick={handleNext}
        disabled={isCurrentMonth}
        className="p-2 rounded-xl hover:bg-background-secondary active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight size={20} className="text-text-secondary" />
      </button>
    </div>
  )
}
