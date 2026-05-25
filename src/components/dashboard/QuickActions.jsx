import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'

export default function QuickActions({ onIncome, onExpense, onTransfer }) {
  const actions = [
    {
      label: 'Pemasukan',
      icon: ArrowDownLeft,
      onClick: onIncome,
      bgColor: 'bg-income-light',
      textColor: 'text-income-dark',
      iconColor: 'text-income',
    },
    {
      label: 'Pengeluaran',
      icon: ArrowUpRight,
      onClick: onExpense,
      bgColor: 'bg-expense-light',
      textColor: 'text-expense-dark',
      iconColor: 'text-expense',
    },
    {
      label: 'Transfer',
      icon: ArrowLeftRight,
      onClick: onTransfer,
      bgColor: 'bg-transfer-light',
      textColor: 'text-transfer-dark',
      iconColor: 'text-transfer',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ label, icon: Icon, onClick, bgColor, textColor, iconColor }) => (
        <button
          key={label}
          onClick={onClick}
          className={`
            flex flex-col items-center gap-2 p-4 rounded-2xl
            ${bgColor} transition-all duration-150
            active:scale-95 hover:shadow-sm
          `}
        >
          <div className={`p-2.5 rounded-xl bg-white/60 ${iconColor}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          <span className={`text-xs font-semibold ${textColor}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
