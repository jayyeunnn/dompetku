import { useState } from 'react'
import { useWallets } from '../hooks/useWallets'
import { useSinkingFunds } from '../hooks/useSinkingFunds'
import AllocateForm from '../components/savings/AllocateForm'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import AmountInput from '../components/ui/AmountInput'
import { formatCurrency } from '../lib/formatters'
import { WALLET_COLORS } from '../lib/constants'

// Sinking fund icon map (lucide name → Material Symbol)
const FUND_ICON_MAP = {
  Target: 'target',
  PiggyBank: 'savings',
  Computer: 'computer',
  Shield: 'health_and_safety',
}

function getFundMaterialIcon(iconName) {
  return FUND_ICON_MAP[iconName] || 'savings'
}

export default function SavingsPage() {
  const { wallets, totalBalance, updateWalletBalance, refetch: refetchWallets } = useWallets()
  const {
    funds,
    totalAllocated,
    loading,
    addFund,
    allocate,
    deleteFund,
  } = useSinkingFunds()

  const freeBalance = Number(totalBalance) || 0

  // Allocate form
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [selectedFund, setSelectedFund] = useState(null)

  // New fund form
  const [newFundOpen, setNewFundOpen] = useState(false)
  const [newFundName, setNewFundName] = useState('')
  const [newFundTarget, setNewFundTarget] = useState(0)
  const [newFundColor, setNewFundColor] = useState(WALLET_COLORS[1])
  const [newFundDeadline, setNewFundDeadline] = useState('')
  const [addingFund, setAddingFund] = useState(false)

  const handleAllocate = (fund) => {
    setSelectedFund(fund)
    setAllocateOpen(true)
  }

  const handleAllocateSave = async (fundId, amount, walletId) => {
    const numAmount = Number(amount) || 0
    // 1. Add to sinking fund
    await allocate(fundId, numAmount)
    // 2. Deduct from wallet
    if (walletId) {
      await updateWalletBalance(walletId, numAmount, 'subtract')
    }
    // 3. Refresh data
    await refetchWallets()
  }

  const handleAddFund = async () => {
    if (!newFundName.trim() || newFundTarget <= 0) return
    setAddingFund(true)
    try {
      await addFund({
        name: newFundName.trim(),
        target_amount: newFundTarget,
        icon: 'Target',
        color: newFundColor,
        deadline: newFundDeadline || null,
      })
      setNewFundName('')
      setNewFundTarget(0)
      setNewFundDeadline('')
      setNewFundColor(WALLET_COLORS[1])
      setNewFundOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingFund(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Hapus tabungan target ini?')) {
      await deleteFund(id)
    }
  }

  const activeFunds = funds.filter((f) => !f.is_completed)
  const completedFunds = funds.filter((f) => f.is_completed)

  // Estimate months remaining
  function getEstimate(fund) {
    if (!fund.deadline) return 'Tanpa batas waktu'
    const deadline = new Date(fund.deadline)
    const now = new Date()
    const diffMs = deadline - now
    const diffMonths = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)))
    if (diffMonths <= 0) return 'Sudah lewat'
    return `Estimasi: ${diffMonths} Bulan`
  }

  return (
    <div className="bg-background text-on-background font-sans min-h-screen pb-24">
      {/* ====== TOP APP BAR ====== */}
      <header className="sticky top-0 z-40 w-full max-w-[448px] mx-auto bg-background flex justify-between items-center h-16 px-5">
        <div className="w-10" /> {/* Spacer */}
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Tabungan Target
        </h1>
        <button
          onClick={() => setNewFundOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-low transition-colors active:scale-95"
          aria-label="Tambah target"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-[448px] mx-auto pt-2 px-5 flex flex-col gap-6">

        {/* ====== HERO: TOTAL SAVINGS CARD ====== */}
        <section className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-4 text-on-primary shadow-sm relative overflow-hidden">
          {/* Decorative blur circle */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex flex-col gap-1 relative z-10">
            <p className="text-xs font-medium text-on-primary/80 uppercase tracking-wider">
              Total Dana Tersimpan
            </p>
            <h2 className="text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(totalAllocated)}
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs font-medium text-on-primary/90 relative z-10">
            <span>{activeFunds.length} Target Aktif</span>
            <span className="flex items-center gap-1">
              Saldo Bebas: {formatCurrency(freeBalance)}
            </span>
          </div>
        </section>

        {/* ====== SAVINGS LIST ====== */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-end mb-1">
            <h3 className="text-lg font-semibold text-on-surface">Target Anda</h3>
            {funds.length > 0 && (
              <span className="text-xs font-medium text-outline">
                {activeFunds.length} aktif
              </span>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-44 rounded-xl" />
              ))}
            </div>
          ) : funds.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[36px] text-primary">savings</span>
              </div>
              <p className="text-on-surface font-semibold text-lg">Belum ada target</p>
              <p className="text-on-surface-variant text-sm mt-1 mb-6 max-w-xs mx-auto">
                Mulai buat tabungan target untuk wujudkan impianmu!
              </p>
              <button
                onClick={() => setNewFundOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Buat Target Pertama
              </button>
            </div>
          ) : (
            <>
              {/* ====== ACTIVE FUNDS ====== */}
              {activeFunds.map((fund) => {
                const target = Number(fund.target_amount)
                const current = Number(fund.current_amount)
                const remaining = Math.max(0, target - current)
                const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
                const matIcon = getFundMaterialIcon(fund.icon)

                return (
                  <div
                    key={fund.id}
                    className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant flex flex-col gap-4 animate-slide-up"
                  >
                    {/* Fund header row */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${fund.color}20` }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: fund.color }}
                        >
                          {matIcon}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-semibold text-on-surface truncate">{fund.name}</h4>
                        <p className="text-sm text-on-surface-variant truncate">
                          {fund.deadline
                            ? `Target: ${new Date(fund.deadline).toLocaleDateString('id-ID', {
                                month: 'long',
                                year: 'numeric',
                              })}`
                            : 'Tanpa batas waktu'}
                        </p>
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(fund.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-colors"
                        aria-label="Hapus target"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    {/* Progress section */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-on-surface tabular-nums">
                          {formatCurrency(current)}
                        </span>
                        <span className="text-xs font-medium text-outline tabular-nums">
                          dari {formatCurrency(target)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: fund.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-outline-variant">
                        <span>{percentage.toFixed(0)}% Tercapai</span>
                        <span>{getEstimate(fund)}</span>
                      </div>
                    </div>

                    {/* Allocate button */}
                    <button
                      onClick={() => handleAllocate(fund)}
                      className="w-full h-10 bg-primary/10 text-primary rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/20 active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Alokasi Dana
                    </button>
                  </div>
                )
              })}

              {/* ====== COMPLETED FUNDS ====== */}
              {completedFunds.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-3 opacity-70 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                    Tercapai ({completedFunds.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {completedFunds.map((fund) => {
                      const target = Number(fund.target_amount)
                      const current = Number(fund.current_amount)
                      const matIcon = getFundMaterialIcon(fund.icon)

                      return (
                        <div
                          key={fund.id}
                          className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant flex items-center gap-4 opacity-80"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary-container"
                          >
                            <span className="material-symbols-outlined text-secondary text-[20px]">check</span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-semibold text-on-surface truncate">{fund.name}</h4>
                            <p className="text-xs text-on-surface-variant tabular-nums">
                              {formatCurrency(current)} / {formatCurrency(target)}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-full flex-shrink-0">
                            Tercapai ✓
                          </span>
                          <button
                            onClick={() => handleDelete(fund.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-colors flex-shrink-0"
                            aria-label="Hapus target"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* ====== ALLOCATE FORM MODAL ====== */}
      <AllocateForm
        isOpen={allocateOpen}
        onClose={() => {
          setAllocateOpen(false)
          setSelectedFund(null)
        }}
        fund={selectedFund}
        freeBalance={freeBalance}
        wallets={wallets}
        onAllocate={handleAllocateSave}
      />

      {/* ====== NEW FUND MODAL ====== */}
      <Modal
        isOpen={newFundOpen}
        onClose={() => setNewFundOpen(false)}
        title="Buat Tabungan Target"
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Nama Target"
            value={newFundName}
            onChange={(e) => setNewFundName(e.target.value)}
            placeholder="Contoh: Tabungan Beli PC"
          />

          <AmountInput
            value={newFundTarget}
            onChange={setNewFundTarget}
            label="Target Nominal"
          />

          <Input
            label="Deadline (opsional)"
            type="date"
            value={newFundDeadline}
            onChange={(e) => setNewFundDeadline(e.target.value)}
          />

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-on-surface-variant mb-2 block">
              Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewFundColor(color)}
                  className={`w-9 h-9 rounded-xl transition-all duration-150 ${
                    newFundColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="xl"
            fullWidth
            loading={addingFund}
            onClick={handleAddFund}
          >
            Buat Target
          </Button>
        </div>
      </Modal>
    </div>
  )
}
