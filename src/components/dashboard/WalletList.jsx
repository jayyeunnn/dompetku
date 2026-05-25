import Card from '../ui/Card'
import { formatCurrency } from '../../lib/formatters'
import { getIcon } from '../../lib/constants'

export default function WalletList({ wallets, loading }) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton min-w-[150px] h-[88px] rounded-2xl flex-shrink-0"
          />
        ))}
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-6 text-text-tertiary text-sm">
        Belum ada dompet. Tambahkan dompet pertamamu!
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {wallets.map((wallet, index) => {
        const Icon = getIcon(wallet.icon)
        return (
          <Card
            key={wallet.id}
            className="min-w-[150px] flex-shrink-0 snap-start"
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            <div className="animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: `${wallet.color}15` }}
                >
                  <Icon
                    size={16}
                    style={{ color: wallet.color }}
                  />
                </div>
                <span className="text-xs font-medium text-text-secondary truncate">
                  {wallet.name}
                </span>
              </div>
              <p className="text-base font-bold text-text-primary tabular-nums">
                {formatCurrency(wallet.balance)}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
