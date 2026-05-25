import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useWallets } from '../hooks/useWallets'
import { useTransactions } from '../hooks/useTransactions'
import { useSinkingFunds } from '../hooks/useSinkingFunds'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionDetail from '../components/transactions/TransactionDetail'
import { deleteTransactionPhoto } from '../lib/imageUtils'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { formatCurrency } from '../lib/formatters'
import { WALLET_COLORS, ALL_CATEGORIES, TX_TYPE_CONFIG } from '../lib/constants'

// Map wallet icon names to Material Symbols
const WALLET_ICON_MAP = {
  Wallet: 'account_balance_wallet',
  Banknote: 'payments',
  CreditCard: 'credit_card',
  Smartphone: 'smartphone',
  PiggyBank: 'savings',
}

// Map category icon names to Material Symbols
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

// Wallet card color styles (maps hex to MD3 semantic containers)
const WALLET_COLOR_STYLES = {
  '#0EA5E9': { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  '#10B981': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  '#8B5CF6': { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed' },
  '#F59E0B': { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed' },
  '#EF4444': { bg: 'bg-error-container', text: 'text-on-error-container' },
  '#EC4899': { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  '#06B6D4': { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  '#00AED6': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  '#6366F1': { bg: 'bg-primary-fixed-dim', text: 'text-on-primary-fixed' },
  '#14B8A6': { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
}

function getWalletColorStyle(color) {
  return WALLET_COLOR_STYLES[color] || { bg: 'bg-primary-container', text: 'text-on-primary-container' }
}

function getMaterialIcon(lucideIconName) {
  return CATEGORY_ICON_MAP[lucideIconName] || 'label'
}

function getWalletMaterialIcon(lucideIconName) {
  return WALLET_ICON_MAP[lucideIconName] || 'account_balance_wallet'
}

// Get time-based greeting
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi!'
  if (hour < 15) return 'Selamat Siang!'
  if (hour < 18) return 'Selamat Sore!'
  return 'Selamat Malam!'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const { wallets, totalBalance, loading: walletsLoading, addWallet, updateWalletBalance, refetch: refetchWallets } = useWallets()
  const { transactions, loading: txLoading, addTransaction, deleteTransaction, updateTransaction, getRecent, refetch: refetchTx } = useTransactions()
  const { totalAllocated } = useSinkingFunds()

  // Transaction form state
  const [txFormOpen, setTxFormOpen] = useState(false)
  const [txType, setTxType] = useState('expense')

  // Add wallet form state
  const [walletFormOpen, setWalletFormOpen] = useState(false)
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletColor, setNewWalletColor] = useState(WALLET_COLORS[0])
  const [addingWallet, setAddingWallet] = useState(false)

  // Balance visibility toggle
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

  // Transaction detail modal state
  const [selectedTx, setSelectedTx] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handleOpenTxForm = (type) => {
    setTxType(type)
    setTxFormOpen(true)
  }

  const handleSaveTransaction = async (txData) => {
    const numAmount = Number(txData.amount) || 0

    // Save transaction to database
    await addTransaction(txData)

    // Update wallet balances
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

    // Refresh data from database
    await refetchWallets()
    await refetchTx()
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
    await refetchWallets()
    await refetchTx()
  }

  /**
   * UPDATE handler using NET DELTA approach.
   * Instead of calling updateWalletBalance twice on the same wallet (which causes
   * stale state), we compute a single net balance change per wallet and apply
   * each wallet's update only ONCE.
   */
  const handleUpdateTx = async (oldTx, newData) => {
    const oldAmount = Number(oldTx.amount) || 0
    const newAmount = Number(newData.amount) || 0

    // Build a delta map: walletId -> net balance change
    const deltas = {}
    const addDelta = (walletId, amount) => {
      if (!walletId) return
      deltas[walletId] = (deltas[walletId] || 0) + amount
    }

    // REVERT old transaction's effect
    if (oldTx.type === 'income') {
      addDelta(oldTx.wallet_id, -oldAmount)
    } else if (oldTx.type === 'expense') {
      addDelta(oldTx.wallet_id, +oldAmount)
    } else if (oldTx.type === 'transfer') {
      addDelta(oldTx.wallet_id, +oldAmount)
      addDelta(oldTx.destination_wallet_id, -oldAmount)
    }

    // APPLY new transaction's effect
    if (newData.type === 'income') {
      addDelta(newData.wallet_id, +newAmount)
    } else if (newData.type === 'expense') {
      addDelta(newData.wallet_id, -newAmount)
    } else if (newData.type === 'transfer') {
      addDelta(newData.wallet_id, -newAmount)
      addDelta(newData.destination_wallet_id, +newAmount)
    }

    // Apply each wallet's net delta (ONE call per wallet — no stale state issue)
    try {
      for (const [walletId, delta] of Object.entries(deltas)) {
        if (delta === 0) continue
        const op = delta > 0 ? 'add' : 'subtract'
        await updateWalletBalance(walletId, Math.abs(delta), op)
      }
    } catch (err) {
      console.error('Error updating wallet balances:', err)
    }

    // Update the transaction record
    await updateTransaction(oldTx.id, newData)

    // Refresh all data
    await refetchWallets()
    await refetchTx()
  }

  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return
    setAddingWallet(true)
    try {
      await addWallet({
        name: newWalletName.trim(),
        icon: 'Wallet',
        color: newWalletColor,
        balance: 0,
      })
      setNewWalletName('')
      setNewWalletColor(WALLET_COLORS[0])
      setWalletFormOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingWallet(false)
    }
  }

  const freeBalance = Number(totalBalance) || 0
  const recentTx = getRecent(5)
  const displayName = user?.user_metadata?.full_name || 'Pengguna'

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      {/* ====== TOP APP BAR ====== */}
      <header className="sticky top-0 bg-background z-40">
        <div className="flex justify-between items-center w-full px-5 h-16 max-w-[448px] mx-auto">
          <div className="flex items-center gap-2">
            {/* User avatar circle */}
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xs font-medium tracking-wide text-on-surface-variant">
                Halo, {getGreeting()}
              </h1>
              <p className="text-xl font-bold tracking-tight text-primary leading-tight">
                {displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:opacity-80 transition-opacity active:scale-95 text-on-surface"
              aria-label="Ubah Tema"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button
              onClick={signOut}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:opacity-80 transition-opacity active:scale-95 text-on-surface"
              aria-label="Keluar"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-[448px] mx-auto px-5 pb-24 space-y-6 pt-1">

        {/* ====== MAIN BALANCE CARD ====== */}
        <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] flex flex-col gap-2 animate-fade-in">
          <div className="flex justify-between items-start">
            <h2 className="text-sm text-on-surface-variant">Total Saldo Bebas</h2>
            <button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="text-outline hover:text-primary transition-colors"
              aria-label={isBalanceVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isBalanceVisible ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
          <p className="text-2xl font-bold text-on-surface tabular-nums tracking-tight animate-count-up">
            {isBalanceVisible ? formatCurrency(freeBalance) : '••••••••'}
          </p>
          {/* Sub-info row */}
          <div className="flex items-center gap-4 pt-2 border-t border-surface-container">
            <div className="flex-1">
              <p className="text-[11px] text-on-surface-variant">Total Dompet</p>
              <p className="text-xs font-semibold text-on-surface tabular-nums">
                {isBalanceVisible ? formatCurrency(totalBalance) : '••••••'}
              </p>
            </div>
            <div className="w-px h-6 bg-outline-variant" />
            <div className="flex-1">
              <p className="text-[11px] text-on-surface-variant">Dialokasikan</p>
              <p className="text-xs font-semibold text-on-surface tabular-nums">
                {isBalanceVisible ? formatCurrency(totalAllocated) : '••••••'}
              </p>
            </div>
          </div>
        </section>

        {/* ====== WALLETS HORIZONTAL SCROLL ====== */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-semibold text-on-surface">Dompet Saya</h3>
            <button
              onClick={() => setWalletFormOpen(true)}
              className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tambah
            </button>
          </div>

          {walletsLoading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[140px] h-[120px] skeleton rounded-lg" />
              ))}
            </div>
          ) : wallets.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-surface-container text-center">
              <span className="material-symbols-outlined text-[32px] text-outline mb-2">account_balance_wallet</span>
              <p className="text-sm text-on-surface-variant">Belum ada dompet</p>
              <button
                onClick={() => setWalletFormOpen(true)}
                className="text-xs font-semibold text-primary mt-2"
              >
                + Tambah Dompet Pertama
              </button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x px-1 -mx-1">
              {wallets.map((wallet) => {
                const colorStyle = getWalletColorStyle(wallet.color)
                const matIcon = getWalletMaterialIcon(wallet.icon)
                return (
                  <div
                    key={wallet.id}
                    className="min-w-[140px] bg-surface-container-lowest rounded-lg p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] border border-surface-container snap-start flex flex-col gap-1 animate-slide-up"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${colorStyle.bg} flex items-center justify-center mb-1`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px]`}
                        style={{ color: wallet.color }}
                      >
                        {matIcon}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant truncate">{wallet.name}</p>
                    <p className="text-sm font-semibold text-on-surface truncate tabular-nums">
                      {isBalanceVisible ? formatCurrency(wallet.balance) : '••••••'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ====== QUICK ACTIONS ====== */}
        <section className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleOpenTxForm('expense')}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error shadow-sm">
              <span className="material-symbols-outlined text-[24px]">arrow_upward</span>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">Pengeluaran</span>
          </button>
          <button
            onClick={() => handleOpenTxForm('income')}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm">
              <span className="material-symbols-outlined text-[24px]">arrow_downward</span>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">Pemasukan</span>
          </button>
          <button
            onClick={() => handleOpenTxForm('transfer')}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </div>
            <span className="text-xs font-medium text-on-surface-variant">Transfer</span>
          </button>
        </section>

        {/* ====== RECENT TRANSACTIONS ====== */}
        <section>
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-sm font-semibold text-on-surface">Transaksi Terakhir</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              Lihat Semua
            </button>
          </div>

          {txLoading ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-surface-container last:border-0">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] p-8 text-center">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">receipt_long</span>
              <p className="text-sm text-on-surface-variant">Belum ada transaksi</p>
              <p className="text-xs text-outline mt-1">Mulai catat pemasukan atau pengeluaranmu!</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden">
              {recentTx.map((tx, index) => {
                const config = TX_TYPE_CONFIG[tx.type]
                const category = ALL_CATEGORIES.find((c) => c.id === tx.category_id)
                const categoryName = category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Lainnya')
                const iconName = category?.icon || config.icon
                const matIcon = getMaterialIcon(iconName)

                // Determine amount color class using MD3 semantic colors
                const amountColorClass =
                  tx.type === 'income' ? 'text-secondary' : tx.type === 'expense' ? 'text-error' : 'text-primary'

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 border-b border-surface-container last:border-0 hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98]"
                    onClick={() => { setSelectedTx(tx); setDetailOpen(true) }}
                  >
                    {/* Icon circle */}
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{matIcon}</span>
                    </div>
                    {/* Description + category */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-base text-on-surface truncate font-medium">
                          {tx.description || categoryName}
                        </p>
                        {tx.photo_url && (
                          <span className="material-symbols-outlined text-[14px] text-outline flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant truncate">{categoryName}</p>
                    </div>
                    {/* Amount */}
                    <p className={`text-sm font-semibold ${amountColorClass} flex-shrink-0 tabular-nums`}>
                      {config.sign}{isBalanceVisible ? formatCurrency(tx.amount) : '••••••'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* ====== TRANSACTION FORM MODAL ====== */}
      <TransactionForm
        isOpen={txFormOpen}
        onClose={() => setTxFormOpen(false)}
        initialType={txType}
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

      {/* ====== ADD WALLET MODAL ====== */}
      <Modal
        isOpen={walletFormOpen}
        onClose={() => setWalletFormOpen(false)}
        title="Tambah Dompet"
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Nama Dompet"
            value={newWalletName}
            onChange={(e) => setNewWalletName(e.target.value)}
            placeholder="Contoh: BCA, GoPay, Cash"
          />

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewWalletColor(color)}
                  className={`w-9 h-9 rounded-xl transition-all duration-150 ${
                    newWalletColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Warna ${color}`}
                />
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="xl"
            fullWidth
            loading={addingWallet}
            onClick={handleAddWallet}
          >
            Tambah Dompet
          </Button>
        </div>
      </Modal>
    </div>
  )
}
