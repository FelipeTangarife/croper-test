import { Navigate, Outlet, useLocation, type Location } from 'react-router'
import { useSessionExpiry } from '../hooks/use-session-expiry'
import { useAuthStore } from '../store/auth.store'

const DEFAULT_PRIVATE_PATH = '/products'

export function ProtectedRoute() {
  const hasSession = useAuthStore((state) => state.session !== null)
  const location = useLocation()
  useSessionExpiry()

  if (!hasSession) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function GuestRoute() {
  const hasSession = useAuthStore((state) => state.session !== null)
  const location = useLocation()

  if (hasSession) {
    const from = (location.state as { from?: Location } | null)?.from
    const target = from ? `${from.pathname}${from.search}` : DEFAULT_PRIVATE_PATH
    return <Navigate to={target} replace />
  }
  return <Outlet />
}
