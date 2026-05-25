import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'home' },
  { to: '/transactions', icon: 'receipt_long' },
  { to: '/savings', icon: 'savings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-xs z-50 flex justify-around items-center py-2.5 bg-white rounded-full shadow-md mb-6">
      {navItems.map(({ to, icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex items-center justify-center transition-transform active:scale-95 duration-200"
        >
          {({ isActive }) => (
            <div
              className={`px-5 py-1.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100/50'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}


