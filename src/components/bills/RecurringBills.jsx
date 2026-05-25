import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AmountInput from '../ui/AmountInput'
import Select from '../ui/Select'
import { formatCurrency } from '../../lib/formatters'

export default function RecurringBills({
  bills,
  wallets,
  loading,
  onAddBill,
  onDeleteBill,
  onPayBill,
}) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  
  // Add Form State
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [newDueDay, setNewDueDay] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Pay Form State
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // Get current YYYY-MM period
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const handleOpenAdd = () => {
    setNewName('')
    setNewAmount(0)
    setNewDueDay(1)
    setAddError('')
    setAddModalOpen(true)
  }

  const handleAddSubmit = async () => {
    if (!newName.trim()) { setAddError('Nama tagihan tidak boleh kosong'); return }
    if (newAmount <= 0) { setAddError('Nominal harus lebih dari 0'); return }
    if (newDueDay < 1 || newDueDay > 31) { setAddError('Tanggal jatuh tempo tidak valid'); return }

    setIsAdding(true)
    setAddError('')
    try {
      await onAddBill({
        name: newName.trim(),
        amount: newAmount,
        due_day: parseInt(newDueDay, 10),
      })
      setAddModalOpen(false)
    } catch (err) {
      setAddError(err.message || 'Gagal menambahkan tagihan')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus tagihan "${name}"?`)) {
      try {
        await onDeleteBill(id)
      } catch (err) {
        alert(err.message || 'Gagal menghapus tagihan')
      }
    }
  }

  const handleOpenPay = (bill) => {
    setSelectedBill(bill)
    setSelectedWalletId('')
    setPayError('')
    setPayModalOpen(true)
  }

  const handlePaySubmit = async () => {
    if (!selectedWalletId) { setPayError('Pilih dompet sumber'); return }

    setIsPaying(true)
    setPayError('')
    try {
      await onPayBill(selectedBill, selectedWalletId)
      setPayModalOpen(false)
      setSelectedBill(null)
    } catch (err) {
      setPayError(err.message || 'Gagal melakukan pembayaran')
    } finally {
      setIsPaying(false)
    }
  }

  const walletOptions = wallets.map((w) => ({
    value: w.id,
    label: `${w.name} — Rp${Number(w.balance).toLocaleString('id-ID')}`,
  }))

  return (
    <div className="bg-background-secondary rounded-3xl p-5 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-expense-light flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-expense-dark">receipt_long</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary">Tagihan Bulan Ini</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          + Tambah
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-text-tertiary text-sm animate-pulse">
          Memuat tagihan...
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-6 text-text-tertiary">
          <p className="text-sm">Belum ada tagihan berulang.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const isPaid = bill.last_paid_period === currentPeriod

            return (
              <div
                key={bill.id}
                className="bg-background-primary rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border/50"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-text-primary">{bill.name}</h3>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary font-medium">{formatCurrency(bill.amount)}</span>
                    <span className="text-text-tertiary text-xs">Tgl {bill.due_day}</span>
                  </div>
                </div>

                <div className="flex justify-end mt-2 sm:mt-0 min-w-[120px] items-center gap-2">
                  <button
                    onClick={() => handleDelete(bill.id, bill.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:bg-expense-light hover:text-expense-dark transition-colors active:scale-95 flex-shrink-0"
                    aria-label="Hapus tagihan"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  {isPaid ? (
                    <div className="w-full sm:w-auto py-1.5 px-3 rounded-xl bg-income-light text-income-dark text-xs font-bold text-center flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Lunas
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleOpenPay(bill)}
                    >
                      Bayar Sekarang
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ====== ADD BILL MODAL ====== */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Tagihan Baru"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nama Tagihan"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contoh: Netflix, Listrik, Internet"
          />
          <AmountInput
            value={newAmount}
            onChange={setNewAmount}
            label="Nominal Tagihan"
          />
          <Input
            label="Tanggal Jatuh Tempo (1-31)"
            type="number"
            min="1"
            max="31"
            value={newDueDay}
            onChange={(e) => setNewDueDay(e.target.value)}
          />

          {addError && (
            <p className="text-sm text-expense-dark bg-expense-light p-3 rounded-xl">
              {addError}
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" className="flex-1" loading={isAdding} onClick={handleAddSubmit}>
              {isAdding ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====== PAY BILL MODAL ====== */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => { setPayModalOpen(false); setSelectedBill(null) }}
        title="Bayar Tagihan"
      >
        {selectedBill && (
          <div className="flex flex-col gap-5">
            <div className="text-center p-4 bg-background-secondary rounded-2xl">
              <p className="text-sm text-text-secondary mb-1">Membayar tagihan</p>
              <h3 className="font-bold text-lg text-text-primary mb-2">{selectedBill.name}</h3>
              <p className="text-2xl font-bold text-expense-dark">
                {formatCurrency(selectedBill.amount)}
              </p>
            </div>

            <Select
              label="Pilih Dompet Sumber"
              value={selectedWalletId}
              onChange={setSelectedWalletId}
              options={walletOptions}
              placeholder="Pilih dompet..."
            />

            {payError && (
              <p className="text-sm text-expense-dark bg-expense-light p-3 rounded-xl">
                {payError}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setPayModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" loading={isPaying} onClick={handlePaySubmit}>
                {isPaying ? 'Memproses...' : 'Konfirmasi Bayar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
