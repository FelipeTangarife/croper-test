import { useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

const MAX_TIMEOUT_MS = 2_147_483_647

export function useSessionExpiry() {
  const expiresAt = useAuthStore((state) => state.session?.expiresAt)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    if (expiresAt === undefined) return

    let timeout: ReturnType<typeof setTimeout> | undefined
    const check = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        logout('expired')
        return
      }
      timeout = setTimeout(check, Math.min(remaining, MAX_TIMEOUT_MS))
    }
    check()

    return () => clearTimeout(timeout)
  }, [expiresAt, logout])
}
