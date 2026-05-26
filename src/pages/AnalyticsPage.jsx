import { useState, useEffect } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useWallets } from '../hooks/useWallets'
import { formatCurrency } from '../lib/formatters'
import { ALL_CATEGORIES, MONTH_NAMES } from '../lib/constants'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// Color map for categories in donut chart
const CATEGORY_COLORS = {
  'expense-food': '#e67e22',       // Orange
  'expense-transport': '#1c7ed6',  // Blue
  'expense-household': '#7048e8',  // Purple
  'expense-hardware': '#0c8599',   // Teal
  'expense-peripheral': '#009688', // Green-teal
  'expense-games': '#2b6cb0',      // Indigo
  'expense-subscription': '#c2255c', // Pink/Red
  'expense-photography': '#d69e2e', // Yellow/Gold
  'expense-health': '#2f9e44',     // Green
  'expense-fashion': '#e53e3e',    // Red
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

// Map Lucide icon names to Material Symbols
const CATEGORY_ICON_MAP = {
  Briefcase: 'work',
  Code: 'code',
  Gift: 'redeem',
  Utensils: 'restaurant',
  Car: 'directions_car',
  Home: 'home',
  Monitor: 'devices',
  Mouse: 'mouse',
  Gamepad2: 'sports_esports',
  Tv: 'tv',
  Camera: 'photo_camera',
  Dumbbell: 'fitness_center',
  Shirt: 'checkroom',
  ArrowDownLeft: 'arrow_downward',
  ArrowUpRight: 'arrow_upward',
  ArrowLeftRight: 'swap_horiz',
  Tag: 'label',
}

const getCategoryIcon = (catId) => {
  const cat = ALL_CATEGORIES.find(c => c.id === catId)
  return CATEGORY_ICON_MAP[cat?.icon] || 'label'
}

// Helper to format short amounts (e.g. 500000 -> 500rb, 1500000 -> 1.5jt)
const formatShortAmount = (val) => {
  if (val === 0) return '0'
  if (val >= 1000000) return `${(val/1000000).toFixed(1).replace('.0', '')}jt`
  if (val >= 1000) return `${Math.round(val/1000)}rb`
  return val
}

// Helper to draw a path representing a bar with rounded top corners
const drawRoundedBarPath = (x, y, w, h, r) => {
  const radius = Math.min(r, h, w / 2)
  if (radius <= 0) {
    return `M ${x} ${y + h} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} Z`
  }
  return `
    M ${x} ${y + h}
    L ${x} ${y + radius}
    A ${radius} ${radius} 0 0 1 ${x + radius} ${y}
    L ${x + w - radius} ${y}
    A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius}
    L ${x + w} ${y + h}
    Z
  `
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const { totalBalance } = useWallets()
  
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const { transactions, loading, summary } = useTransactions(year, month)
  
  // Budget Limit States
  const budgetKey = user ? `budget_${user.id}_${year}_${month}` : null
  const [budgetLimit, setBudgetLimit] = useState(0)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState('')

  // Sync custom budget when user, year, or month changes
  useEffect(() => {
    if (budgetKey) {
      const saved = localStorage.getItem(budgetKey)
      setBudgetLimit(saved ? Number(saved) : 0)
    } else {
      setBudgetLimit(0)
    }
    setIsEditingBudget(false)
  }, [budgetKey])

  // Category Budget Limit States
  const [categoryBudgets, setCategoryBudgets] = useState({})
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [tempCategoryBudgets, setTempCategoryBudgets] = useState({})

  // Load category budgets from localStorage when user, year, or month changes
  useEffect(() => {
    if (!user) return
    const budgets = {}
    ALL_CATEGORIES.forEach(cat => {
      if (cat.type === 'expense') {
        const key = `catbudget_${user.id}_${cat.id}_${year}_${month}`
        const val = localStorage.getItem(key)
        if (val) {
          budgets[cat.id] = Number(val)
        }
      }
    })
    setCategoryBudgets(budgets)
  }, [user, year, month])

  const handleOpenBudgetModal = () => {
    const temp = {}
    ALL_CATEGORIES.forEach(cat => {
      if (cat.type === 'expense') {
        temp[cat.id] = categoryBudgets[cat.id] || ''
      }
    })
    setTempCategoryBudgets(temp)
    setIsBudgetModalOpen(true)
  }

  const handleSaveCategoryBudgets = () => {
    if (!user) return
    const newBudgets = { ...categoryBudgets }
    Object.entries(tempCategoryBudgets).forEach(([catId, val]) => {
      const numVal = Number(val)
      const key = `catbudget_${user.id}_${catId}_${year}_${month}`
      if (isNaN(numVal) || numVal <= 0) {
        delete newBudgets[catId]
        localStorage.removeItem(key)
      } else {
        newBudgets[catId] = numVal
        localStorage.setItem(key, numVal.toString())
      }
    })
    setCategoryBudgets(newBudgets)
    setIsBudgetModalOpen(false)
  }

  const handleCategoryBudgetChange = (catId, valString) => {
    const cleaned = valString.replace(/[^\d]/g, '')
    setTempCategoryBudgets(prev => ({
      ...prev,
      [catId]: cleaned ? Number(cleaned) : ''
    }))
  }

  // Chart states
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null)
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState(null)

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
    setActiveCategoryIndex(null)
    setHoveredWeekIndex(null)
  }

  const handleNextMonth = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    if (isCurrentMonth) return
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
    setActiveCategoryIndex(null)
    setHoveredWeekIndex(null)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // 1. Data Aggregations
  const totalIncome = summary.income
  const totalExpense = summary.expense
  const savings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0

  // Default budget calculation: if no income, budget is total Balance + total Expense (min 2,000,000)
  const defaultBudget = totalIncome > 0 
    ? totalIncome 
    : Math.max(2000000, (Number(totalBalance) || 0) + totalExpense)

  const budget = budgetLimit > 0 ? budgetLimit : defaultBudget
  const ratio = budget > 0 ? Math.min(100, Math.round((totalExpense / budget) * 100)) : 0
  const remainingBudget = Math.max(0, budget - totalExpense)

  // Budget Inline Editing Handlers
  const handleStartEditBudget = () => {
    setTempBudget(budget.toString())
    setIsEditingBudget(true)
  }

  const handleSaveBudget = () => {
    const val = Number(tempBudget)
    if (!isNaN(val) && val >= 0) {
      setBudgetLimit(val)
      if (budgetKey) {
        if (val === 0) {
          localStorage.removeItem(budgetKey)
        } else {
          localStorage.setItem(budgetKey, val.toString())
        }
      }
    }
    setIsEditingBudget(false)
  }

  const handleKeyDownBudget = (e) => {
    if (e.key === 'Enter') {
      handleSaveBudget()
    } else if (e.key === 'Escape') {
      setIsEditingBudget(false)
    }
  }

  // Calculate daily average expense
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  let daysToDivide = daysInMonth(year, month)
  if (isCurrentMonth) {
    daysToDivide = now.getDate()
  }
  const dailyAverage = totalExpense / (daysToDivide || 1)

  // 2. Category Breakdown for Donut Chart
  const expenseTransactions = transactions.filter(t => t.type === 'expense')
  const categoryMap = {}
  
  expenseTransactions.forEach(tx => {
    const catId = tx.category_id || 'other'
    categoryMap[catId] = (categoryMap[catId] || 0) + Number(tx.amount)
  })

  const categoryBreakdown = Object.entries(categoryMap).map(([catId, amount], index) => {
    const cat = ALL_CATEGORIES.find(c => c.id === catId)
    return {
      id: catId,
      name: cat?.name || 'Lainnya',
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      color: CATEGORY_COLORS[catId] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] || '#737686'
    }
  }).sort((a, b) => b.amount - a.amount)

  // Donut Chart Segment Calculations
  const radius = 38
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  const donutSegments = categoryBreakdown.map((item, index) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
    const strokeDashoffset = - (accumulatedPercent / 100) * circumference
    accumulatedPercent += item.percentage

    return {
      ...item,
      index,
      strokeDasharray,
      strokeDashoffset
    }
  })

  // 3. Weekly Spending Calculation
  const weeklyExpenses = [0, 0, 0, 0, 0] // 5 weeks
  expenseTransactions.forEach(tx => {
    const txDate = new Date(tx.date)
    const day = txDate.getDate()
    
    if (day <= 7) weeklyExpenses[0] += Number(tx.amount)
    else if (day <= 14) weeklyExpenses[1] += Number(tx.amount)
    else if (day <= 21) weeklyExpenses[2] += Number(tx.amount)
    else if (day <= 28) weeklyExpenses[3] += Number(tx.amount)
    else weeklyExpenses[4] += Number(tx.amount)
  })

  const maxWeeklyExpense = Math.max(...weeklyExpenses, 10000)
  const weekLabels = [
    { label: 'Minggu 1', desc: 'Tanggal 1 - 7', shortDesc: 'Tgl 1-7' },
    { label: 'Minggu 2', desc: 'Tanggal 8 - 14', shortDesc: 'Tgl 8-14' },
    { label: 'Minggu 3', desc: 'Tanggal 15 - 21', shortDesc: 'Tgl 15-21' },
    { label: 'Minggu 4', desc: 'Tanggal 22 - 28', shortDesc: 'Tgl 22-28' },
    { label: 'Minggu 5', desc: `Tanggal 29 - ${daysInMonth(year, month)}`, shortDesc: 'Tgl 29+' }
  ]

  const activeCategory = activeCategoryIndex !== null ? categoryBreakdown[activeCategoryIndex] : null

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      {/* ====== TOP APP BAR ====== */}
      <header className="sticky top-0 z-50 bg-background flex items-center justify-between px-5 h-16 max-w-[448px] mx-auto border-b border-surface-container/30">
        <div className="w-10" />
        <h1 className="text-xl font-bold tracking-tight text-primary">Analisis Keuangan</h1>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:opacity-80 transition-opacity active:scale-95 text-on-surface"
          aria-label="Ubah Tema"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-[448px] mx-auto pb-28">
        
        {/* ====== MONTH SELECTOR ====== */}
        <section className="bg-surface-container-lowest px-5 py-4 flex items-center justify-between shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors active:scale-90"
            aria-label="Bulan sebelumnya"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_month
            </span>
            <span className="text-sm font-semibold tracking-wide text-on-surface">
              {MONTH_NAMES[month]} {year}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Bulan berikutnya"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </section>

        {loading ? (
          /* Skeleton Loader */
          <div className="p-5 space-y-6">
            <div className="h-[100px] skeleton rounded-xl" />
            <div className="h-[240px] skeleton rounded-xl" />
            <div className="h-[180px] skeleton rounded-xl" />
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-5">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px] text-outline">bar_chart</span>
            </div>
            <p className="text-on-surface font-semibold text-lg font-sans">Belum ada transaksi</p>
            <p className="text-on-surface-variant text-sm mt-1 max-w-xs mx-auto">
              Tidak ada data transaksi untuk dianalisis pada bulan {MONTH_NAMES[month]} {year}.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            
            {/* ====== INCOME VS EXPENSE SUMMARY CARDS ====== */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant font-medium">Pemasukan</span>
                <span className="text-base font-bold text-secondary truncate tabular-nums">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant font-medium">Pengeluaran</span>
                <span className="text-base font-bold text-error truncate tabular-nums">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
            </section>

            {/* ====== SAVINGS RATE & DAILY AVERAGE ====== */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {/* Custom Melingkar SVG Progress untuk Savings Rate */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="transparent"
                      stroke="var(--color-surface-container)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="transparent"
                      stroke="var(--color-income)"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - savingsRate / 100)}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-secondary tabular-nums">
                    {savingsRate}%
                  </span>
                </div>
                <div>
                  <h4 className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Savings Rate</h4>
                  <p className="text-xs font-semibold text-on-surface truncate">
                    {savings >= 0 ? `Hemat ${formatCurrency(savings)}` : 'Defisit Saldo'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-surface-container pl-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Rata-rata Harian</h4>
                  <p className="text-xs font-bold text-on-surface truncate tabular-nums">
                    {formatCurrency(dailyAverage)}
                  </p>
                </div>
              </div>
            </section>

            {/* ====== INCOME VS EXPENSE RATIO BAR ====== */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                <span>Rasio Pengeluaran</span>
                <span className="font-bold text-primary tabular-nums">
                  {ratio}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                {ratio > 0 ? (
                  <>
                    {/* Terpakai (Expense) on the left - grows left to right */}
                    <div
                      className="bg-error h-full transition-all duration-500"
                      style={{ width: `${ratio}%` }}
                    />
                    {/* Tersisa (Remaining) on the right */}
                    <div
                      className="bg-secondary h-full transition-all duration-500"
                      style={{ width: `${100 - ratio}%` }}
                    />
                  </>
                ) : (
                  <div className="bg-surface-container-high h-full w-full" />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium mt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-error inline-block"></span>
                  Terpakai ({formatCurrency(totalExpense)})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${remainingBudget > 0 ? 'bg-secondary' : 'bg-outline'}`}></span>
                  Tersisa ({formatCurrency(remainingBudget)})
                </span>
              </div>
            </section>

            {/* ====== CATEGORY BUDGETS CARD ====== */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-on-surface">Anggaran Kategori</h3>
                <button
                  onClick={handleOpenBudgetModal}
                  className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Atur Anggaran
                </button>
              </div>

              {Object.keys(categoryBudgets).length === 0 ? (
                <div className="text-center py-6 px-4 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/60 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-[24px]">payments</span>
                  <p className="text-[11px] text-on-surface-variant max-w-[280px]">
                    Belum ada anggaran kategori diatur untuk bulan ini.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenBudgetModal}
                    className="mt-1 text-[11px] py-1.5 px-3 h-auto"
                  >
                    Mulai Buat Anggaran
                  </Button>
                </div>
              ) : (
                <div className="border border-surface-container rounded-xl overflow-hidden bg-surface-container-lowest divide-y divide-surface-container">
                  {ALL_CATEGORIES.filter(c => c.type === 'expense' && categoryBudgets[c.id] > 0).map(cat => {
                    const limit = categoryBudgets[cat.id]
                    const spent = categoryMap[cat.id] || 0
                    const pct = Math.min(100, Math.round((spent / limit) * 100))
                    const remaining = limit - spent
                    const isOver = spent > limit

                    return (
                      <div key={cat.id} className="flex flex-col gap-2.5 p-4 hover:bg-surface-container-low/40 transition-colors">
                        {/* Upper row: icon, name, spent vs limit, and status */}
                        <div className="flex items-center gap-4">
                          {/* Icon circle */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${CATEGORY_COLORS[cat.id] || '#737686'}15`, color: CATEGORY_COLORS[cat.id] || '#737686' }}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {getCategoryIcon(cat.id)}
                            </span>
                          </div>

                          {/* Middle: Category name & details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] text-on-surface truncate font-semibold">
                              {cat.name}
                            </p>
                            <p className="text-[11px] text-on-surface-variant truncate tabular-nums mt-0.5">
                              Terpakai ({formatCurrency(spent)})
                            </p>
                          </div>

                          {/* Right: Remaining status and percentage */}
                          <div className="text-right shrink-0">
                            <p className={`text-[13px] font-bold tabular-nums ${
                              isOver ? 'text-error' : pct >= 80 ? 'text-amber-600' : 'text-secondary'
                            }`}>
                              {isOver ? `Lebih ${formatCurrency(spent - limit)}` : `Sisa ${formatCurrency(remaining)}`}
                            </p>
                            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                              {pct}% Terpakai
                            </p>
                          </div>
                        </div>

                        {/* Lower row: Progress bar */}
                        <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 100 ? 'bg-error' : pct >= 80 ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ====== CATEGORY DONUT CHART CARD ====== */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">Distribusi Pengeluaran</h3>
              </div>
              
              {totalExpense === 0 ? (
                <div className="text-center py-6 text-xs text-text-tertiary">Belum ada pengeluaran di bulan ini.</div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Donut Chart SVG */}
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-surface-container)"
                        strokeWidth={strokeWidth}
                      />
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={seg.id}
                          cx="48"
                          cy="48"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={activeCategoryIndex === i ? strokeWidth + 2 : strokeWidth}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="transition-all duration-300 ease-out origin-center -rotate-90 cursor-pointer"
                          onMouseEnter={() => setActiveCategoryIndex(i)}
                          onMouseLeave={() => setActiveCategoryIndex(null)}
                        />
                      ))}
                    </svg>
                    
                    {/* Donut Center Label */}
                    <div className="absolute text-center flex flex-col items-center justify-center px-6 w-36 pointer-events-none">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold truncate max-w-full">
                        {activeCategory ? activeCategory.name : 'Total Belanja'}
                      </span>
                      <span className="text-sm font-bold text-on-surface truncate max-w-full tabular-nums mt-0.5">
                        {activeCategory ? formatCurrency(activeCategory.amount) : formatCurrency(totalExpense)}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium tabular-nums mt-0.5">
                        {activeCategory ? `${Math.round(activeCategory.percentage)}%` : '100%'}
                      </span>
                    </div>
                  </div>

                  {/* Category Legend list */}
                  <div className="w-full mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-3 mt-2 px-1 select-none">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">category</span>
                      </div>
                      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kategori Pengeluaran</h4>
                    </div>
                    {categoryBreakdown.slice(0, 5).map((item, i) => (
                      <div
                        key={item.id}
                        onMouseEnter={() => setActiveCategoryIndex(i)}
                        onMouseLeave={() => setActiveCategoryIndex(null)}
                        className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                          activeCategoryIndex === i ? 'bg-surface-container' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rounded square colored icon badge */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200"
                            style={{ 
                              backgroundColor: `${item.color}15`, 
                              color: item.color,
                              transform: activeCategoryIndex === i ? 'scale(1.05)' : 'scale(1)' 
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {getCategoryIcon(item.id)}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-on-surface truncate">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-on-surface tabular-nums block">{formatCurrency(item.amount)}</span>
                          <span className="text-[10px] text-on-surface-variant font-medium tabular-nums">{Math.round(item.percentage)}%</span>
                        </div>
                      </div>
                    ))}
                    
                    {categoryBreakdown.length > 5 && (
                      <p className="text-[10px] text-center text-on-surface-variant italic mt-1">
                        + {categoryBreakdown.length - 5} Kategori lainnya
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ====== WEEKLY SPENDING BAR CHART CARD ====== */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">Tren Pengeluaran Mingguan</h3>
              </div>
              
              {totalExpense === 0 ? (
                <div className="text-center py-6 text-xs text-text-tertiary">Belum ada pengeluaran untuk dianalisis.</div>
              ) : (
                <div className="relative w-full h-[180px] mt-2 flex items-center justify-center">
                  <svg className="w-full h-full select-none" viewBox="0 0 320 170">
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="weeklyBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines & Labels */}
                    {/* 100% line */}
                    <line x1="40" y1="20" x2="310" y2="20" stroke="var(--color-surface-container-high)" strokeDasharray="3 3" />
                    <text x="32" y="23" textAnchor="end" className="text-[8px] font-bold fill-outline tabular-nums">
                      {formatShortAmount(maxWeeklyExpense)}
                    </text>

                    {/* 50% line */}
                    <line x1="40" y1="75" x2="310" y2="75" stroke="var(--color-surface-container-high)" strokeDasharray="3 3" />
                    <text x="32" y="78" textAnchor="end" className="text-[8px] font-bold fill-outline tabular-nums">
                      {formatShortAmount(maxWeeklyExpense / 2)}
                    </text>

                    {/* 0% line */}
                    <line x1="40" y1="130" x2="310" y2="130" stroke="var(--color-outline-variant)" strokeOpacity="0.5" />
                    <text x="32" y="133" textAnchor="end" className="text-[8px] font-bold fill-outline tabular-nums">
                      0
                    </text>

                    {/* Bars */}
                    {weeklyExpenses.map((val, i) => {
                      const barWidth = 26
                      const gap = 35
                      const x = 40 + i * (barWidth + gap)
                      
                      const ratio = maxWeeklyExpense > 0 ? val / maxWeeklyExpense : 0
                      const barHeight = ratio * 110 // max drawing height is 110px (from 20 to 130)
                      const y = 130 - barHeight
                      
                      const isHovered = hoveredWeekIndex === i
                      const simpleAmount = val === 0 ? '0' : val >= 1000000 ? `${(val/1000000).toFixed(1).replace('.0', '')}jt` : val >= 1000 ? `${Math.round(val/1000)}rb` : val
                      
                      // Using path for top rounded corners only
                      const pathD = drawRoundedBarPath(x, y, barWidth, barHeight, 6)

                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredWeekIndex(i)}
                          onMouseLeave={() => setHoveredWeekIndex(null)}
                        >
                          {/* Invisible interactive background rect for easier hover targeting */}
                          <rect
                            x={x - 8}
                            y="10"
                            width={barWidth + 16}
                            height="125"
                            fill="transparent"
                          />
                          
                          {/* Visual Bar Path (rounded top) */}
                          <path
                            d={pathD}
                            fill="url(#weeklyBarGradient)"
                            className="transition-all duration-300 ease-out"
                            style={{
                              transformOrigin: `${x + barWidth / 2}px 130px`,
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                              filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0, 74, 198, 0.25))' : 'none'
                            }}
                            opacity={hoveredWeekIndex === null || isHovered ? 1 : 0.6}
                          />

                          {/* Static label above the bar (only if not hovered and val > 0) */}
                          {val > 0 && !isHovered && (
                            <text
                              x={x + barWidth / 2}
                              y={y - 5}
                              textAnchor="middle"
                              className="text-[8px] font-bold fill-outline transition-all duration-200"
                            >
                              {simpleAmount}
                            </text>
                          )}

                          {/* Hover Tooltip (rendered dynamically inside SVG) */}
                          {isHovered && (
                            <g className="transition-all duration-200">
                              {/* Tooltip Background */}
                              <rect
                                x={x + barWidth / 2 - 40}
                                y={Math.max(2, y - 24)}
                                width="80"
                                height="16"
                                rx="4"
                                fill="var(--color-inverse-surface)"
                              />
                              {/* Tooltip Arrow */}
                              <polygon
                                points={`${x + barWidth / 2 - 4},${y - 8} ${x + barWidth / 2 + 4},${y - 8} ${x + barWidth / 2},${y - 4}`}
                                fill="var(--color-inverse-surface)"
                              />
                              {/* Tooltip Text */}
                              <text
                                x={x + barWidth / 2}
                                y={Math.max(12, y - 13)}
                                textAnchor="middle"
                                className="text-[7.5px] font-bold fill-inverse-on-surface"
                              >
                                {formatCurrency(val)}
                              </text>
                            </g>
                          )}

                          {/* Integrated Date & Week Label directly inside SVG */}
                          <text
                            x={x + barWidth / 2}
                            y="145"
                            textAnchor="middle"
                            className={`text-[8.5px] font-bold transition-colors ${
                              isHovered ? 'fill-primary font-black' : 'fill-on-surface'
                            }`}
                          >
                            M{i + 1}
                          </text>
                          <text
                            x={x + barWidth / 2}
                            y="156"
                            textAnchor="middle"
                            className="text-[7.5px] font-medium fill-outline"
                          >
                            {weekLabels[i].shortDesc}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </section>
            
          </div>
        )}
      </main>

      {/* ====== ATUR ANGGARAN KATEGORI MODAL ====== */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Atur Anggaran Kategori"
      >
        <div className="flex flex-col gap-4">
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Masukkan nominal batas pengeluaran bulanan untuk kategori di bawah ini. Kosongkan atau isi 0 untuk menonaktifkan anggaran kategori tersebut.
          </p>

          <div className="max-h-[280px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {ALL_CATEGORIES.filter(c => c.type === 'expense').map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-3 p-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${CATEGORY_COLORS[cat.id] || '#737686'}15`, color: CATEGORY_COLORS[cat.id] || '#737686' }}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {getCategoryIcon(cat.id)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface truncate">{cat.name}</span>
                </div>
                <div className="w-32 shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tempCategoryBudgets[cat.id] !== undefined && tempCategoryBudgets[cat.id] !== '' ? formatCurrency(Number(tempCategoryBudgets[cat.id]), false) : ''}
                    onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                    className="w-full text-right px-2.5 py-1.5 bg-surface-container rounded-lg border border-outline-variant focus:border-primary text-xs font-bold focus:outline-none"
                    placeholder="Tidak ada"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 mt-2 pt-3 border-t border-surface-container">
            <Button
              variant="secondary"
              onClick={() => setIsBudgetModalOpen(false)}
              className="flex-1 text-[12px] py-2 px-3 h-auto"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCategoryBudgets}
              className="flex-1 text-[12px] py-2 px-3 h-auto"
            >
              Simpan Anggaran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
