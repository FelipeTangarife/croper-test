import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoginResponse } from '../types'

const STORAGE_KEY = 'auth-session'

const loginResponse: LoginResponse = {
  accessToken: 'token-123',
  expiresIn: 3600,
  user: { id: '1', email: 'admin@croper.test', name: 'Admin' },
}

const loadStore = async () => {
  vi.resetModules()
  const { useAuthStore } = await import('./auth.store')
  return useAuthStore
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts without a session', async () => {
    const store = await loadStore()
    expect(store.getState().session).toBeNull()
  })

  it('stores the token, the user and the expiration date', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-18T10:00:00.000Z') })
    const store = await loadStore()

    store.getState().setSession(loginResponse)

    expect(store.getState().session).toEqual({
      accessToken: 'token-123',
      user: loginResponse.user,
      expiresAt: new Date('2026-11-18T11:00:00.000Z').getTime(),
    })
  })

  it('keeps the session after a reload', async () => {
    const first = await loadStore()
    first.getState().setSession(loginResponse)

    const reloaded = await loadStore()

    expect(reloaded.getState().session?.accessToken).toBe('token-123')
    expect(reloaded.getState().session?.user.name).toBe('Admin')
  })

  it('clears the session on logout', async () => {
    const store = await loadStore()
    store.getState().setSession(loginResponse)

    store.getState().logout()

    expect(store.getState()).toMatchObject({ session: null, logoutReason: null })
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('token-123')
  })

  it('remembers that the session expired, without persisting the reason', async () => {
    const store = await loadStore()
    store.getState().setSession(loginResponse)

    store.getState().logout('expired')

    expect(store.getState()).toMatchObject({ session: null, logoutReason: 'expired' })
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('expired')
  })

  it('forgets the expired reason after a new login', async () => {
    const store = await loadStore()
    store.getState().logout('expired')

    store.getState().setSession(loginResponse)

    expect(store.getState().logoutReason).toBeNull()
  })
})
