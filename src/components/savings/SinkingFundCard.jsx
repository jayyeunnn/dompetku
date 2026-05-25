import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import { formatCurrency } from '../../lib/formatters'
import { getIcon } from '../../lib/constants'
import { Plus, Check, Trash2 } from 'lucide-react'

export default function SinkingFundCard({ fund, onAllocate, onDelete }) {
  const {
    name,
    target_amount,
    current_amount,
    icon,
    color,
    deadline,
    is_completed,
  } = fund

  const target = Number(target_amount)
  const current = Number(current_amount)
  const remaining = Math.max(0, target - current)
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const Icon = getIcon(icon)

  return (
    <Card className="animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            {is_completed ? (
              <Check size={22} style={{ color }} />
            ) : (
              <Icon size={22} style={{ color }} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{name}</h3>
            {deadline && (
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Target: {new Date(deadline).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {is_completed && (
          <span className="px-2.5 py-1 bg-income-light text-income-dark text-[11px] font-bold rounded-full">
            Tercapai ✓
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar
          current={current}
          target={target}
          color={color}
          height="h-3"
        />
      </div>

      {/* Stats */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Terkumpul</p>
          <p className="text-lg font-bold tabular-nums" style={{ color }}>
            {formatCurrency(current)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-tertiary mb-0.5">
            {is_completed ? 'Target' : 'Sisa'}
          </p>
          <p className="text-sm font-semibold text-text-secondary tabular-nums">
            {is_completed ? formatCurrency(target) : formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Percentage badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-tertiary tabular-nums">
          {percentage.toFixed(0)}% tercapai
        </span>

        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(fund.id)}
              className="text-text-tertiary hover:text-expense"
            >
              <Trash2 size={16} />
            </Button>
          )}
          {!is_completed && onAllocate && (
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => onAllocate(fund)}
            >
              Alokasi
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
