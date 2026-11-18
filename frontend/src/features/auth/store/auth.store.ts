import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, LoginResponse } from '../types'

export interface AuthSession {
  accessToken: string
  user: AuthUser
  expiresAt: number
}

export type LogoutReason = 'expired'

interface AuthState {
  session: AuthSession | null
  logoutReason: LogoutReason | null
  setSession: (response: LoginResponse) => void
  logout: (reason?: LogoutReason) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      logoutReason: null,
      setSession: ({ accessToken, expiresIn, user }) =>
        set({
          session: { accessToken, user, expiresAt: Date.now() + expiresIn * 1000 },
          logoutReason: null,
        }),
      logout: (reason) => set({ session: null, logoutReason: reason ?? null }),
    }),
    {
      name: 'auth-session',
      partialize: ({ session }) => ({ session }),
    },
  ),
)
