import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AmountInput from '../ui/AmountInput'
import Select from '../ui/Select'
import Input from '../ui/Input'
import { formatCurrency, formatDate, getToday } from '../../lib/formatters'
import {
  ALL_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TX_TYPE_CONFIG,
} from '../../lib/constants'
import { compressAndWatermark, uploadTransactionPhoto, deleteTransactionPhoto } from '../../lib/imageUtils'
import { useAuth } from '../../context/AuthContext'

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

// Category icon background colors
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

export default function TransactionDetail({
  isOpen,
  onClose,
  transaction,
  wallets = [],
  onDelete,
  onUpdate,
}) {
  const { user } = useAuth()

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(0)
  const [editWalletId, setEditWalletId] = useState('')
  const [editDestWalletId, setEditDestWalletId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPhotoUrl, setEditPhotoUrl] = useState(null)
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && transaction) {
      setIsEditing(false)
      setConfirmDelete(false)
      setError('')
      setSaving(false)
      setDeleting(false)
    }
  }, [isOpen, transaction])

  // Populate edit form
  const enterEditMode = () => {
    if (!transaction) return
    setEditAmount(Number(transaction.amount) || 0)
    setEditWalletId(transaction.wallet_id || '')
    setEditDestWalletId(transaction.destination_wallet_id || '')
    setEditCategoryId(transaction.category_id || '')
    setEditDescription(transaction.description || '')
    setEditDate(transaction.date || getToday())
    setEditPhotoUrl(transaction.photo_url || null)
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    setRemoveExistingPhoto(false)
    setError('')
    setIsEditing(true)
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Ukuran foto maksimal 10MB'); return }
    setNewPhotoFile(file)
    setRemoveExistingPhoto(true)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => setNewPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    setRemoveExistingPhoto(true)
    setEditPhotoUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ==================== DELETE ====================
  const handleDelete = async () => {
    if (!transaction || !onDelete) return
    setDeleting(true)
    setError('')
    try {
      await onDelete(transaction)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menghapus transaksi')
      setDeleting(false)
    }
  }

  // ==================== SAVE EDIT ====================
  const handleSaveEdit = async () => {
    // The type is NOT editable — keep the original type
    const editType = transaction.type

    if (editAmount <= 0) { setError('Masukkan nominal yang valid'); return }
    if (!editWalletId) {
      setError(editType === 'income' ? 'Pilih dompet tujuan' : 'Pilih sumber dompet')
      return
    }
    if (editType === 'transfer' && !editDestWalletId) { setError('Pilih dompet tujuan transfer'); return }
    if (editType === 'transfer' && editWalletId === editDestWalletId) { setError('Dompet asal dan tujuan tidak boleh sama'); return }
    if (editType !== 'transfer' && !editCategoryId) { setError('Pilih kategori'); return }

    setSaving(true)
    setError('')

    try {
      // Handle photo
      let finalPhotoUrl = editPhotoUrl
      if (newPhotoFile && user) {
        const category = ALL_CATEGORIES.find((c) => c.id === editCategoryId)
        const categoryName = category?.name || (editType === 'transfer' ? 'Transfer' : 'Lainnya')
        const blob = await compressAndWatermark(newPhotoFile, {
          amount: editAmount, category: categoryName, date: editDate,
        })
        finalPhotoUrl = await uploadTransactionPhoto(blob, user.id)
        if (transaction.photo_url) await deleteTransactionPhoto(transaction.photo_url)
      } else if (removeExistingPhoto && transaction.photo_url) {
        await deleteTransactionPhoto(transaction.photo_url)
        finalPhotoUrl = null
      }

      const updatedData = {
        type: editType,
        amount: editAmount,
        wallet_id: editWalletId,
        destination_wallet_id: editType === 'transfer' ? editDestWalletId : null,
        category_id: editType !== 'transfer' ? editCategoryId : null,
        description: editDescription.trim() || null,
        date: editDate,
        photo_url: finalPhotoUrl,
      }

      await onUpdate(transaction, updatedData)
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  if (!transaction) return null

  const tx = transaction
  const config = TX_TYPE_CONFIG[tx.type]
  const category = ALL_CATEGORIES.find((c) => c.id === tx.category_id)
  const categoryName = category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Lainnya')
  const iconName = category?.icon || config.icon
  const matIcon = tx.type === 'transfer' ? 'swap_horiz' : getMaterialIcon(iconName)
  const catStyle = tx.type === 'transfer'
    ? { bg: '#dbe1ff', fg: '#004ac6' }
    : getCategoryStyle(tx.category_id)

  const wallet = wallets.find((w) => w.id === tx.wallet_id)
  const destWallet = wallets.find((w) => w.id === tx.destination_wallet_id)

  const typeLabel = config.label
  const typeBadgeClass =
    tx.type === 'income'
      ? 'bg-income-light text-income-dark'
      : tx.type === 'expense'
      ? 'bg-expense-light text-expense-dark'
      : 'bg-transfer-light text-transfer-dark'

  const amountColorClass =
    tx.type === 'income'
      ? 'text-secondary'
      : tx.type === 'expense'
      ? 'text-error'
      : 'text-primary'

  // Edit form options (type is NOT editable)
  const editCategories = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const editCategoryOptions = editCategories.map((c) => ({ value: c.id, label: c.name }))
  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} — Rp${Number(w.balance).toLocaleString('id-ID')}`,
  }))

  const currentPhotoDisplay = newPhotoPreview || (removeExistingPhoto ? null : editPhotoUrl)

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setIsEditing(false); setConfirmDelete(false); onClose() }}
      title={isEditing ? `Edit ${typeLabel}` : 'Detail Transaksi'}
    >
      {isEditing ? (
        /* ==================== EDIT MODE ==================== */
        <div className="flex flex-col gap-5">
          {/* Type badge (read-only) */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
              {typeLabel}
            </span>
          </div>

          <AmountInput value={editAmount} onChange={setEditAmount} label="Nominal" />

          <Select
            label={tx.type === 'income' ? 'Dompet Tujuan' : 'Sumber Dompet'}
            value={editWalletId}
            onChange={setEditWalletId}
            options={walletOptions}
            placeholder="Pilih dompet..."
          />

          {tx.type === 'transfer' && (
            <Select
              label="Dompet Tujuan"
              value={editDestWalletId}
              onChange={setEditDestWalletId}
              options={walletOptions.filter((w) => w.value !== editWalletId)}
              placeholder="Pilih dompet tujuan..."
            />
          )}

          {tx.type !== 'transfer' && (
            <Select
              label="Kategori"
              value={editCategoryId}
              onChange={setEditCategoryId}
              options={editCategoryOptions}
              placeholder="Pilih kategori..."
            />
          )}

          <Input
            label="Catatan (opsional)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Contoh: Beli Mouse Logitech"
          />

          <Input label="Tanggal" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />

          {/* Photo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Foto Bukti (opsional)</label>
            {currentPhotoDisplay ? (
              <div className="relative rounded-2xl overflow-hidden bg-background-secondary">
                <img src={currentPhotoDisplay} alt="Preview" className="w-full max-h-[200px] object-cover" />
                <button type="button" onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors active:scale-95" aria-label="Hapus foto">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer active:scale-[0.98]">
                <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-text-tertiary">add_a_photo</span>
                </div>
                <span className="text-sm text-text-tertiary">Ketuk untuk unggah foto struk</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-expense-light text-expense-dark text-sm font-medium animate-slide-down">{error}</div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={() => { setIsEditing(false); setError('') }} className="flex-1">Batal</Button>
            <Button variant="primary" size="lg" loading={saving} onClick={handleSaveEdit} className="flex-1">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      ) : (
        /* ==================== VIEW MODE ==================== */
        <div className="flex flex-col gap-5">
          {/* Action buttons */}
          <div className="flex justify-end gap-2 -mt-1 -mb-2">
            <button onClick={enterEditMode}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant" aria-label="Edit transaksi">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-expense-light hover:bg-red-200 transition-colors active:scale-95 text-expense-dark" aria-label="Hapus transaksi">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>

          {/* Confirm delete */}
          {confirmDelete && (
            <div className="bg-expense-light/50 rounded-2xl p-4 border border-expense/20 animate-slide-down">
              <p className="text-sm font-semibold text-expense-dark mb-1">Yakin ingin menghapus transaksi ini?</p>
              <p className="text-xs text-expense-dark/70 mb-3">Saldo dompet akan dikembalikan dan data akan dihapus permanen.</p>
              {error && <p className="text-xs text-expense-dark mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setConfirmDelete(false); setError('') }} className="flex-1">Batal</Button>
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete} className="flex-1">
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
              </div>
            </div>
          )}

          {/* Type badge + Amount */}
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: catStyle.bg }}>
              <span className="material-symbols-outlined text-[28px]" style={{ color: catStyle.fg, fontVariationSettings: "'FILL' 1" }}>{matIcon}</span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>{typeLabel}</span>
            <p className={`text-3xl font-bold tabular-nums tracking-tight ${amountColorClass}`}>{config.sign}{formatCurrency(tx.amount)}</p>
          </div>

          {/* Details */}
          <div className="bg-background-secondary rounded-2xl p-4 space-y-3">
            {tx.type !== 'transfer' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">Kategori</span>
                <span className="text-sm font-medium text-text-primary">{categoryName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-tertiary">{tx.type === 'income' ? 'Dompet Tujuan' : 'Sumber Dompet'}</span>
              <span className="text-sm font-medium text-text-primary">{wallet?.name || '-'}</span>
            </div>
            {tx.type === 'transfer' && destWallet && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-tertiary">Dompet Tujuan</span>
                <span className="text-sm font-medium text-text-primary">{destWallet.name}</span>
              </div>
            )}
            {tx.description && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-text-tertiary">Catatan</span>
                <span className="text-sm font-medium text-text-primary text-right max-w-[60%]">{tx.description}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-tertiary">Tanggal</span>
              <span className="text-sm font-medium text-text-primary">{formatDate(tx.date, 'long')}</span>
            </div>
          </div>

          {/* Photo */}
          {tx.photo_url && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-secondary">Foto Bukti</span>
              <div className="rounded-2xl overflow-hidden bg-background-secondary">
                <img src={tx.photo_url} alt="Bukti transaksi" className="w-full object-contain max-h-[400px]" loading="lazy" />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
