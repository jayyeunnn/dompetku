import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/transactions', icon: 'receipt_long', label: 'Transaksi' },
  { to: '/savings', icon: 'savings', label: 'Target' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50 flex justify-around items-center px-2 py-3 bg-surface-container-lowest max-w-[448px] rounded-t-xl shadow-[0_-1px_3px_0_rgba(0,0,0,0.1)] pb-safe">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-colors active:scale-90 duration-200 ${
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="text-xs font-medium mt-1">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
