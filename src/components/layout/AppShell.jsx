import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell({ children }) {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-safe">
      {/* Main Content */}
      {children}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
