import { useState, useEffect } from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AmountInput from '../ui/AmountInput'
import Select from '../ui/Select'
import Input from '../ui/Input'
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../../lib/constants'
import { getToday, formatCurrency } from '../../lib/formatters'

const TABS = [
  { key: 'expense', label: 'Pengeluaran', icon: ArrowUpRight, color: 'expense' },
  { key: 'income', label: 'Pemasukan', icon: ArrowDownLeft, color: 'income' },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'transfer' },
]

export default function TransactionForm({
  isOpen,
  onClose,
  initialType = 'expense',
  wallets = [],
  onSave,
}) {
  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [destWalletId, setDestWalletId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getToday())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Sync type with initialType whenever the form opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType)
      setAmount(0)
      setWalletId('')
      setDestWalletId('')
      setCategoryId('')
      setDescription('')
      setDate(getToday())
      setError('')
    }
  }, [isOpen, initialType])

  const resetForm = () => {
    setAmount(0)
    setWalletId('')
    setDestWalletId('')
    setCategoryId('')
    setDescription('')
    setDate(getToday())
    setError('')
  }

  const handleTypeChange = (newType) => {
    setType(newType)
    setCategoryId('')
    setError('')
  }

  const handleSave = async () => {
    // Validation
    if (amount <= 0) {
      setError('Masukkan nominal yang valid')
      return
    }
    if (!walletId) {
      setError(type === 'income' ? 'Pilih dompet tujuan' : 'Pilih sumber dompet')
      return
    }
    if (type === 'transfer' && !destWalletId) {
      setError('Pilih dompet tujuan transfer')
      return
    }
    if (type === 'transfer' && walletId === destWalletId) {
      setError('Dompet asal dan tujuan tidak boleh sama')
      return
    }
    if (type !== 'transfer' && !categoryId) {
      setError('Pilih kategori')
      return
    }

    // Balance validation: prevent spending more than wallet balance
    if (type === 'expense' || type === 'transfer') {
      const sourceWallet = wallets.find((w) => w.id === walletId)
      if (sourceWallet) {
        const walletBalance = Number(sourceWallet.balance) || 0
        const numAmount = Number(amount) || 0
        if (numAmount > walletBalance) {
          setError(
            `Saldo ${sourceWallet.name} tidak cukup. Saldo tersedia: ${formatCurrency(walletBalance)}`
          )
          return
        }
      }
    }

    setSaving(true)
    setError('')

    try {
      await onSave({
        type,
        amount,
        wallet_id: walletId,
        destination_wallet_id: type === 'transfer' ? destWalletId : null,
        category_id: type === 'transfer' ? null : categoryId,
        description: description.trim() || null,
        date,
      })
      resetForm()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.name}`,
  }))

  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} — Rp${Number(w.balance).toLocaleString('id-ID')}`,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title="Tambah Transaksi"
    >
      <div className="flex flex-col gap-5">
        {/* Type Tabs */}
        <div className="flex bg-background-secondary rounded-2xl p-1 gap-1">
          {TABS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                text-sm font-semibold transition-all duration-200
                ${
                  type === key
                    ? `bg-${color} text-white shadow-sm`
                    : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          label="Nominal"
        />

        {/* Wallet Source */}
        <Select
          label={type === 'income' ? 'Dompet Tujuan' : 'Sumber Dompet'}
          value={walletId}
          onChange={setWalletId}
          options={walletOptions}
          placeholder="Pilih dompet..."
        />

        {/* Destination Wallet (Transfer only) */}
        {type === 'transfer' && (
          <Select
            label="Dompet Tujuan"
            value={destWalletId}
            onChange={setDestWalletId}
            options={walletOptions.filter((w) => w.value !== walletId)}
            placeholder="Pilih dompet tujuan..."
          />
        )}

        {/* Category (Not for transfers) */}
        {type !== 'transfer' && (
          <Select
            label="Kategori"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder="Pilih kategori..."
          />
        )}

        {/* Description */}
        <Input
          label="Catatan (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Beli Mouse Logitech"
        />

        {/* Date */}
        <Input
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-expense-light text-expense-dark text-sm font-medium animate-slide-down">
            {error}
          </div>
        )}

        {/* Save Button */}
        <Button
          variant={type}
          size="xl"
          fullWidth
          loading={saving}
          onClick={handleSave}
        >
          Simpan {TABS.find((t) => t.key === type)?.label}
        </Button>
      </div>
    </Modal>
  )
}
