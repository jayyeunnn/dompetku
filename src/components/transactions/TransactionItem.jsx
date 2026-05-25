import { formatCurrency, formatDate } from '../../lib/formatters'
import {
  ALL_CATEGORIES,
  TX_TYPE_CONFIG,
  getIcon,
} from '../../lib/constants'

export default function TransactionItem({ transaction, wallets = [] }) {
  const { type, amount, description, date, wallet_id, destination_wallet_id, category_id } = transaction
  const config = TX_TYPE_CONFIG[type]

  // Find category
  const category = ALL_CATEGORIES.find((c) => c.id === category_id)
  const categoryName = category?.name || (type === 'transfer' ? 'Transfer' : 'Lainnya')
  const iconName = category?.icon || config.icon
  const Icon = getIcon(iconName)

  // Find wallet names
  const wallet = wallets.find((w) => w.id === wallet_id)
  const destWallet = wallets.find((w) => w.id === destination_wallet_id)

  const walletLabel =
    type === 'transfer' && wallet && destWallet
      ? `${wallet.name} → ${destWallet.name}`
      : wallet?.name || ''

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-background-secondary/50 transition-colors">
      {/* Icon */}
      <div
        className="flex-shrink-0 p-2.5 rounded-xl"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon size={20} style={{ color: config.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">
            {description || categoryName}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-text-tertiary">
            {categoryName}
          </span>
          {walletLabel && (
            <>
              <span className="text-[11px] text-text-tertiary">•</span>
              <span className="text-[11px] text-text-tertiary truncate">
                {walletLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: config.color }}
        >
          {config.sign}
          {formatCurrency(amount)}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {formatDate(date, 'short')}
        </p>
      </div>
    </div>
  )
}
