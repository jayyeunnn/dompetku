/**
 * Format number as IDR currency
 * @param {number} amount
 * @param {boolean} showPrefix - show "Rp" prefix
 * @returns {string}
 */
export function formatCurrency(amount, showPrefix = true) {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount || 0))

  if (showPrefix) {
    return `Rp${formatted}`
  }
  return formatted
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date
 * @param {string} format - 'short', 'medium', 'long'
 * @returns {string}
 */
export function formatDate(date, format = 'medium') {
  const d = new Date(date)

  const options = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'long', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    relative: {},
  }

  if (format === 'relative') {
    return getRelativeDate(d)
  }

  return d.toLocaleDateString('id-ID', options[format] || options.medium)
}

/**
 * Get relative date string (Hari ini, Kemarin, etc.)
 */
function getRelativeDate(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current month's start and end dates
 */
export function getMonthRange(year, month) {
  const start = new Date(year, month, 1).toISOString().split('T')[0]
  const end = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

/**
 * Parse numeric input (handle Indonesian format)
 */
export function parseAmount(value) {
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^\d]/g, '')
  return parseInt(cleaned, 10) || 0
}
