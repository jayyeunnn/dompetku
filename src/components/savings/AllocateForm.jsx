import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AmountInput from '../ui/AmountInput'
import Select from '../ui/Select'
import { formatCurrency } from '../../lib/formatters'

export default function AllocateForm({
  isOpen,
  onClose,
  fund,
  freeBalance,
  wallets = [],
  onAllocate,
}) {
  const [amount, setAmount] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form state whenever modal opens or fund changes
  useEffect(() => {
    if (isOpen) {
      setAmount(0)
      setWalletId('')
      setError('')
      setSaving(false)
    }
  }, [isOpen, fund?.id])

  if (!fund) return null

  // Ensure numeric values (Supabase NUMERIC type can return strings)
  const safeFreeBalance = Number(freeBalance) || 0
  const target = Number(fund.target_amount) || 0
  const current = Number(fund.current_amount) || 0
  const remaining = Math.max(0, target - current)

  // Selected wallet balance
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const selectedWalletBalance = selectedWallet ? (Number(selectedWallet.balance) || 0) : 0

  // The max amount user can allocate (capped by wallet balance, free balance, and remaining target)
  const effectiveMax = walletId
    ? Math.min(selectedWalletBalance, safeFreeBalance, remaining > 0 ? remaining : Infinity)
    : Math.min(safeFreeBalance, remaining > 0 ? remaining : Infinity)
  const maxAllocatable = Math.max(0, effectiveMax === Infinity ? safeFreeBalance : effectiveMax)

  // Wallet options with balance display
  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} — ${formatCurrency(Number(w.balance) || 0)}`,
  }))

  const handleQuickFill = (val) => {
    setAmount(val)
    setError('')
  }

  const handleFillMax = () => {
    if (maxAllocatable > 0) {
      setAmount(maxAllocatable)
      setError('')
    }
  }

  const handleSave = async () => {
    const numAmount = Number(amount) || 0

    if (numAmount <= 0) {
      setError('Masukkan nominal yang valid')
      return
    }

    if (!walletId) {
      setError('Pilih dompet sumber dana')
      return
    }

    if (safeFreeBalance <= 0) {
      setError('Saldo bebas Anda Rp0. Tambahkan pemasukan terlebih dahulu.')
      return
    }

    if (numAmount > selectedWalletBalance) {
      setError(`Saldo ${selectedWallet?.name || 'dompet'} tidak cukup. Tersedia: ${formatCurrency(selectedWalletBalance)}`)
      return
    }

    if (numAmount > safeFreeBalance) {
      setError(`Nominal melebihi saldo bebas (${formatCurrency(safeFreeBalance)})`)
      return
    }

    if (remaining > 0 && numAmount > remaining) {
      setError(`Nominal melebihi sisa target (${formatCurrency(remaining)})`)
      return
    }

    setSaving(true)
    setError('')

    try {
      await onAllocate(fund.id, numAmount, walletId)
      setAmount(0)
      setWalletId('')
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal mengalokasikan dana')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setAmount(0)
    setWalletId('')
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Alokasi ke ${fund.name}`}
    >
      <div className="flex flex-col gap-5">
        {/* Info Cards */}
        <div className="flex gap-4 p-4 rounded-2xl bg-surface-container-low">
          <div className="flex-1">
            <p className="text-xs text-on-surface-variant mb-0.5">Saldo Bebas</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(safeFreeBalance)}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-on-surface-variant mb-0.5">Sisa Target</p>
            <p className="text-sm font-bold text-on-surface tabular-nums">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Wallet Source Selector */}
        <Select
          label="Ambil dari Dompet"
          value={walletId}
          onChange={(val) => {
            setWalletId(val)
            setError('')
          }}
          options={walletOptions}
          placeholder="Pilih dompet..."
        />

        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={(val) => {
            setAmount(val)
            setError('')
          }}
          label="Nominal Alokasi"
        />

        {/* Quick fill buttons */}
        <div className="flex gap-2">
          {[50000, 100000, 500000]
            .filter((val) => val <= maxAllocatable)
            .map((val) => (
              <button
                key={val}
                onClick={() => handleQuickFill(val)}
                className="flex-1 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface-variant hover:bg-primary-fixed hover:text-primary transition-colors"
              >
                {formatCurrency(val)}
              </button>
            ))}
          {maxAllocatable > 0 && (
            <button
              onClick={handleFillMax}
              className="flex-1 py-2 rounded-xl bg-primary-fixed text-xs font-bold text-primary hover:bg-primary-fixed-dim transition-colors"
            >
              Penuh
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium animate-slide-down">
            {error}
          </div>
        )}

        {/* Save Button */}
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={saving}
          onClick={handleSave}
        >
          Alokasi Dana
        </Button>
      </div>
    </Modal>
  )
}
