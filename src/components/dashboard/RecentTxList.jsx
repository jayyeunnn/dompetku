import TransactionItem from '../transactions/TransactionItem'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function RecentTxList({ transactions, wallets, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-tertiary text-sm">
          Belum ada transaksi
        </p>
        <p className="text-text-tertiary text-xs mt-1">
          Mulai catat keuanganmu sekarang!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {transactions.map((tx, index) => (
        <div
          key={tx.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <TransactionItem transaction={tx} wallets={wallets} />
        </div>
      ))}

      {transactions.length >= 5 && (
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center justify-center gap-1.5 py-3 mt-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Lihat Semua
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
