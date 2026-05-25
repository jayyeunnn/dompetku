import { useState, useEffect, useRef } from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AmountInput from '../ui/AmountInput'
import Select from '../ui/Select'
import Input from '../ui/Input'
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
} from '../../lib/constants'
import { getToday, formatCurrency, formatDate } from '../../lib/formatters'
import { compressAndWatermark, uploadTransactionPhoto } from '../../lib/imageUtils'
import { useAuth } from '../../context/AuthContext'

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
  const { user } = useAuth()
  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [destWalletId, setDestWalletId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getToday())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Photo state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)

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
      setPhotoFile(null)
      setPhotoPreview(null)
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
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleTypeChange = (newType) => {
    setType(newType)
    setCategoryId('')
    setError('')
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    // Validate file size (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran foto maksimal 10MB')
      return
    }

    setPhotoFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      let photoUrl = null

      // Process photo if selected
      if (photoFile && user) {
        const category = ALL_CATEGORIES.find((c) => c.id === categoryId)
        const categoryName = category?.name || (type === 'transfer' ? 'Transfer' : 'Lainnya')

        const watermarkedBlob = await compressAndWatermark(photoFile, {
          amount,
          category: categoryName,
          date,
        })

        photoUrl = await uploadTransactionPhoto(watermarkedBlob, user.id)
      }

      await onSave({
        type,
        amount,
        wallet_id: walletId,
        destination_wallet_id: type === 'transfer' ? destWalletId : null,
        category_id: type === 'transfer' ? null : categoryId,
        description: description.trim() || null,
        date,
        photo_url: photoUrl,
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

        {/* Photo Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">
            Foto Bukti (opsional)
          </label>

          {photoPreview ? (
            /* Thumbnail preview */
            <div className="relative rounded-2xl overflow-hidden bg-background-secondary">
              <img
                src={photoPreview}
                alt="Preview foto bukti"
                className="w-full max-h-[200px] object-cover"
              />
              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-95"
                aria-label="Hapus foto"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            /* Upload area */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-text-tertiary">
                  add_a_photo
                </span>
              </div>
              <span className="text-sm text-text-tertiary">
                Ketuk untuk unggah foto struk
              </span>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

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
          {saving && photoFile ? 'Mengupload foto...' : `Simpan ${TABS.find((t) => t.key === type)?.label}`}
        </Button>
      </div>
    </Modal>
  )
}
