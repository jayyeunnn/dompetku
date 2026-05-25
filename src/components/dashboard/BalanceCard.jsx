import { Wallet, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '../../lib/formatters'

export default function BalanceCard({ totalBalance, totalAllocated }) {
  const [isVisible, setIsVisible] = useState(true)
  const freeBalance = totalBalance - totalAllocated

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-blue-900 p-6 text-white animate-fade-in">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
            <Wallet size={20} />
          </div>
          <span className="text-sm font-medium text-white/80">
            Saldo Bebas
          </span>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label={isVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'}
        >
          {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {/* Amount */}
      <div className="relative mb-4">
        <p className="text-3xl font-extrabold tabular-nums animate-count-up">
          {isVisible ? formatCurrency(freeBalance) : '••••••••'}
        </p>
      </div>

      {/* Sub info */}
      <div className="relative flex items-center gap-4 pt-3 border-t border-white/15">
        <div className="flex-1">
          <p className="text-[11px] text-white/60 mb-0.5">Total Dompet</p>
          <p className="text-sm font-semibold tabular-nums">
            {isVisible ? formatCurrency(totalBalance) : '••••••'}
          </p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div className="flex-1">
          <p className="text-[11px] text-white/60 mb-0.5">Dialokasikan</p>
          <p className="text-sm font-semibold tabular-nums">
            {isVisible ? formatCurrency(totalAllocated) : '••••••'}
          </p>
        </div>
      </div>
    </div>
  )
}
