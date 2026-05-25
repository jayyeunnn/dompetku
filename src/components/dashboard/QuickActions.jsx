import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Mic } from 'lucide-react'

export default function QuickActions({ onIncome, onExpense, onTransfer, onVoice }) {
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
    {
      label: 'Catat Suara',
      icon: Mic,
      onClick: onVoice,
      bgColor: 'bg-primary-light',
      textColor: 'text-primary-dark',
      iconColor: 'text-primary',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ label, icon: Icon, onClick, bgColor, textColor, iconColor }) => (
        <button
          key={label}
          onClick={onClick}
          className={`
            flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-2xl
            ${bgColor} transition-all duration-150
            active:scale-95 hover:shadow-sm
          `}
        >
          <div className={`p-2 rounded-xl bg-white/60 ${iconColor}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <span className={`text-[10px] sm:text-xs font-semibold ${textColor} text-center truncate w-full`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
