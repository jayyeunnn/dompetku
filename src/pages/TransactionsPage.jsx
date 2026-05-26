import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useWallets } from '../hooks/useWallets'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionDetail from '../components/transactions/TransactionDetail'
import { deleteTransactionPhoto } from '../lib/imageUtils'
import { formatCurrency, formatDate } from '../lib/formatters'
import { ALL_CATEGORIES, TX_TYPE_CONFIG, MONTH_NAMES } from '../lib/constants'
import { useTheme } from '../context/ThemeContext'

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

// Category icon background colors (warm tinted circles)
const CATEGORY_BG_MAP = {
  'expense-food': { bg: '#fff4e6', fg: '#e67e22' },
  'expense-transport': { bg: '#e7f5ff', fg: '#1c7ed6' },
  'expense-household': { bg: '#f3f0ff', fg: '#7048e8' },
  'expense-hardware': { bg: '#e3fafc', fg: '#0c8599' },
  'expense-peripheral': { bg: '#e3fafc', fg: '#0c8599' },
  'expense-games': { bg: '#e7f5ff', fg: '#1c7ed6' },
  'expense-subscription': { bg: '#fff0f6', fg: '#c2255c' },
  'expense-photography': { bg: '#fff4e6', fg: '#e67e22' },
  'expense-health': { bg: '#ebfbee', fg: '#2f9e44' },
  'expense-fashion': { bg: '#fff0f6', fg: '#c2255c' },
  'income-salary': { bg: '#ebfbee', fg: '#2f9e44' },
  'income-freelance': { bg: '#ebfbee', fg: '#2f9e44' },
  'income-side': { bg: '#ebfbee', fg: '#2f9e44' },
}

function getCategoryStyle(categoryId) {
  return CATEGORY_BG_MAP[categoryId] || { bg: '#f3f4f5', fg: '#737686' }
}

function getMaterialIcon(lucideIconName) {
  return CATEGORY_ICON_MAP[lucideIconName] || 'label'
}

export default function TransactionsPage() {
  const { toggleTheme, isDark } = useTheme()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [txFormOpen, setTxFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'gallery'

  // Transaction detail modal
  const [selectedTx, setSelectedTx] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { transactions, loading, groupedByDate, summary, addTransaction, deleteTransaction, updateTransaction, refetch } =
    useTransactions(year, month)
  const { wallets, updateWalletBalance, refetch: refetchWallets } = useWallets()

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
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
  }

  const handleSaveTransaction = async (txData) => {
    const numAmount = Number(txData.amount) || 0

    await addTransaction(txData)

    try {
      if (txData.type === 'income') {
        await updateWalletBalance(txData.wallet_id, numAmount, 'add')
      } else if (txData.type === 'expense') {
        await updateWalletBalance(txData.wallet_id, numAmount, 'subtract')
      } else if (txData.type === 'transfer') {
        await updateWalletBalance(txData.wallet_id, numAmount, 'subtract')
        await updateWalletBalance(txData.destination_wallet_id, numAmount, 'add')
      }
    } catch (err) {
      console.error('Error updating wallet balance:', err)
    }

    await refetch()
    await refetchWallets()
  }

  const handleOpenDetail = (tx) => {
    setSelectedTx(tx)
    setDetailOpen(true)
  }

  /**
   * DELETE handler: revert wallet balance, delete photo, delete transaction.
   */
  const handleDeleteTx = async (tx) => {
    const numAmount = Number(tx.amount) || 0

    // 1. Revert wallet balance
    try {
      if (tx.type === 'income') {
        await updateWalletBalance(tx.wallet_id, numAmount, 'subtract')
      } else if (tx.type === 'expense') {
        await updateWalletBalance(tx.wallet_id, numAmount, 'add')
      } else if (tx.type === 'transfer') {
        await updateWalletBalance(tx.wallet_id, numAmount, 'add')
        if (tx.destination_wallet_id) {
          await updateWalletBalance(tx.destination_wallet_id, numAmount, 'subtract')
        }
      }
    } catch (err) {
      console.error('Error reverting wallet balance:', err)
    }

    // 2. Delete photo from storage if exists
    if (tx.photo_url) {
      await deleteTransactionPhoto(tx.photo_url)
    }

    // 3. Delete transaction record
    await deleteTransaction(tx.id)

    // 4. Refresh
    await refetch()
    await refetchWallets()
  }

  /**
   * UPDATE handler using NET DELTA approach.
   * Compute a single net change per wallet, then apply ONE call per wallet.
   */
  const handleUpdateTx = async (oldTx, newData) => {
    const oldAmount = Number(oldTx.amount) || 0
    const newAmount = Number(newData.amount) || 0

    const deltas = {}
    const addDelta = (walletId, amount) => {
      if (!walletId) return
      deltas[walletId] = (deltas[walletId] || 0) + amount
    }

    // REVERT old transaction
    if (oldTx.type === 'income') {
      addDelta(oldTx.wallet_id, -oldAmount)
    } else if (oldTx.type === 'expense') {
      addDelta(oldTx.wallet_id, +oldAmount)
    } else if (oldTx.type === 'transfer') {
      addDelta(oldTx.wallet_id, +oldAmount)
      addDelta(oldTx.destination_wallet_id, -oldAmount)
    }

    // APPLY new transaction
    if (newData.type === 'income') {
      addDelta(newData.wallet_id, +newAmount)
    } else if (newData.type === 'expense') {
      addDelta(newData.wallet_id, -newAmount)
    } else if (newData.type === 'transfer') {
      addDelta(newData.wallet_id, -newAmount)
      addDelta(newData.destination_wallet_id, +newAmount)
    }

    try {
      for (const [walletId, delta] of Object.entries(deltas)) {
        if (delta === 0) continue
        const op = delta > 0 ? 'add' : 'subtract'
        await updateWalletBalance(walletId, Math.abs(delta), op)
      }
    } catch (err) {
      console.error('Error updating wallet balances:', err)
    }

    await updateTransaction(oldTx.id, newData)
    await refetch()
    await refetchWallets()
  }

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b) - new Date(a)
  )

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // Helper to get tx display info
  const getTxDisplayInfo = (tx) => {
    const config = TX_TYPE_CONFIG[tx.type]
    const category = ALL_CATEGORIES.find((c) => c.id === tx.category_id)
    const categoryName = category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Lainnya')
    const iconName = category?.icon || config.icon
    const matIcon = getMaterialIcon(iconName)
    const catStyle = getCategoryStyle(tx.category_id)

    const isTransfer = tx.type === 'transfer'
    const finalIcon = isTransfer ? 'swap_horiz' : matIcon
    const finalBg = isTransfer ? '#dbe1ff' : catStyle.bg
    const finalFg = isTransfer ? '#004ac6' : catStyle.fg

    const amountColorClass =
      tx.type === 'income'
        ? 'text-secondary'
        : tx.type === 'expense'
        ? 'text-error'
        : 'text-primary'

    const wallet = wallets.find((w) => w.id === tx.wallet_id)
    const destWallet = wallets.find((w) => w.id === tx.destination_wallet_id)
    const subLabel = isTransfer && wallet && destWallet
      ? `${wallet.name} → ${destWallet.name}`
      : category?.parent || categoryName

    return { config, categoryName, finalIcon, finalBg, finalFg, amountColorClass, subLabel }
  }

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      {/* ====== TOP APP BAR ====== */}
      <header className="sticky top-0 z-50 bg-background flex items-center justify-between px-5 h-16 max-w-[448px] mx-auto border-b border-surface-container/30">
        <div className="w-10" /> {/* Spacer for centering */}
        <h1 className="text-xl font-bold tracking-tight text-primary">Riwayat Transaksi</h1>
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
      <main className="max-w-[448px] mx-auto flex-1 pb-24">

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

        {/* ====== MONTHLY SUMMARY CARD ====== */}
        <section className="px-5 mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-2 divide-x divide-outline-variant">
              <div className="flex flex-col items-center justify-center py-2">
                <span className="text-xs font-medium text-on-surface-variant mb-1">Pemasukan</span>
                <span className="text-sm font-bold text-secondary tabular-nums">
                  {formatCurrency(summary.income)}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-2">
                <span className="text-xs font-medium text-on-surface-variant mb-1">Pengeluaran</span>
                <span className="text-sm font-bold text-error tabular-nums">
                  {formatCurrency(summary.expense)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====== VIEW MODE TOGGLE ====== */}
        {!loading && transactions.length > 0 && (
          <section className="px-5 mt-5 flex justify-end">
            <div className="flex bg-surface-container-high rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_list</span>
                List
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === 'gallery'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                Galeri
              </button>
            </div>
          </section>
        )}

        {/* ====== TRANSACTION LIST / GALLERY ====== */}
        <section className="px-5 mt-4 space-y-6">
          {loading ? (
            /* Skeleton loading */
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[36px] text-outline">receipt_long</span>
              </div>
              <p className="text-on-surface font-semibold text-lg">Belum ada transaksi</p>
              <p className="text-on-surface-variant text-sm mt-1 mb-6 max-w-xs mx-auto">
                Bulan ini belum ada catatan keuangan
              </p>
              <button
                onClick={() => setTxFormOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah Transaksi
              </button>
            </div>
          ) : viewMode === 'gallery' ? (
            /* ====== GALLERY GRID VIEW ====== */
            <div className="grid grid-cols-3 gap-2">
              {transactions.map((tx) => {
                const { config, categoryName, finalIcon, finalBg, finalFg, amountColorClass } = getTxDisplayInfo(tx)

                return (
                  <button
                    key={tx.id}
                    onClick={() => handleOpenDetail(tx)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-surface-container-high active:scale-[0.96] transition-transform focus:outline-none"
                  >
                    {tx.photo_url ? (
                      /* Photo thumbnail */
                      <img
                        src={tx.photo_url}
                        alt={categoryName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      /* Placeholder: category bg + icon */
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: finalBg }}
                      >
                        <span
                          className="material-symbols-outlined text-[32px]"
                          style={{ color: finalFg, fontVariationSettings: "'FILL' 1" }}
                        >
                          {finalIcon}
                        </span>
                      </div>
                    )}

                    {/* Bottom overlay with amount */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                      <p className="text-[10px] font-bold text-white tabular-nums truncate">
                        {config.sign}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            /* ====== LIST VIEW (default) ====== */
            sortedDates.map((date) => (
              <div key={date}>
                {/* Date group header */}
                <h2 className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-4 opacity-70">
                  {formatDate(date, 'relative')}
                  {formatDate(date, 'relative') !== formatDate(date, 'medium') && (
                    <span className="ml-1 normal-case tracking-normal">
                      — {formatDate(date, 'medium')}
                    </span>
                  )}
                </h2>

                {/* Transaction items */}
                <div className="space-y-2">
                  {groupedByDate[date].map((tx) => {
                    const { config, categoryName, finalIcon, finalBg, finalFg, amountColorClass, subLabel } = getTxDisplayInfo(tx)

                    return (
                      <div
                        key={tx.id}
                        onClick={() => handleOpenDetail(tx)}
                        className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          {/* Category icon circle */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: finalBg }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                color: finalFg,
                                fontVariationSettings: "'FILL' 1",
                              }}
                            >
                              {finalIcon}
                            </span>
                          </div>
                          {/* Description + category */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-on-surface truncate">
                                {tx.description || categoryName}
                              </span>
                              {tx.photo_url && (
                                <span className="material-symbols-outlined text-[13px] text-outline flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                              )}
                            </div>
                            <span className="text-sm text-on-surface-variant truncate">
                              {subLabel}
                            </span>
                          </div>
                        </div>
                        {/* Amount */}
                        <span className={`text-sm font-bold ${amountColorClass} flex-shrink-0 tabular-nums`}>
                          {config.sign} {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* ====== FAB - Add Transaction ====== */}
      <button
        onClick={() => setTxFormOpen(true)}
        className="
          fixed bottom-24 right-5 z-30
          w-14 h-14 rounded-2xl
          bg-primary text-on-primary shadow-lg
          flex items-center justify-center
          hover:opacity-90 active:scale-90
          transition-all duration-200
        "
        aria-label="Tambah transaksi"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>

      {/* ====== TRANSACTION FORM MODAL ====== */}
      <TransactionForm
        isOpen={txFormOpen}
        onClose={() => setTxFormOpen(false)}
        wallets={wallets}
        onSave={handleSaveTransaction}
      />

      {/* ====== TRANSACTION DETAIL MODAL ====== */}
      <TransactionDetail
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTx(null) }}
        transaction={selectedTx}
        wallets={wallets}
        onDelete={handleDeleteTx}
        onUpdate={handleUpdateTx}
      />
    </div>
  )
}
