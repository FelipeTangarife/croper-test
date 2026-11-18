import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../store/auth.store'
import { installAuthInterceptors } from './auth-interceptors'

const respondWith = (status: number): AxiosAdapter =>
  vi.fn(async (config: InternalAxiosRequestConfig) => {
    const response = { data: {}, status, statusText: '', headers: {}, config }
    if (status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
    }
    return response
  })

const createClient = (status: number) => {
  const adapter = respondWith(status)
  const client = axios.create({ adapter })
  installAuthInterceptors(client)
  return { client, adapter: vi.mocked(adapter) }
}

const signIn = () =>
  useAuthStore.getState().setSession({
    accessToken: 'token-123',
    expiresIn: 3600,
    user: { id: '1', email: 'admin@croper.test', name: 'Admin' },
  })

describe('installAuthInterceptors', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ session: null, logoutReason: null })
  })

  it('adds the bearer token to every request', async () => {
    signIn()
    const { client, adapter } = createClient(200)

    await client.get('/products')

    const [config] = adapter.mock.calls[0]
    expect(config.headers.Authorization).toBe('Bearer token-123')
  })

  it('sends no token when there is no session', async () => {
    const { client, adapter } = createClient(200)

    await client.get('/products')

    const [config] = adapter.mock.calls[0]
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('logs out with the expired reason when the API answers 401', async () => {
    signIn()
    const { client } = createClient(401)

    await expect(client.get('/products')).rejects.toBeInstanceOf(AxiosError)

    expect(useAuthStore.getState()).toMatchObject({
      session: null,
      logoutReason: 'expired',
    })
  })

  it('does not log out when the login itself answers 401', async () => {
    const { client } = createClient(401)

    await expect(client.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError)

    expect(useAuthStore.getState().logoutReason).toBeNull()
  })

  it('keeps the session on other errors', async () => {
    signIn()
    const { client } = createClient(500)

    await expect(client.get('/products')).rejects.toBeInstanceOf(AxiosError)

    expect(useAuthStore.getState().session?.accessToken).toBe('token-123')
  })
})
