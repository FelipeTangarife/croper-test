import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TOO_MANY_REQUESTS_MESSAGE,
  installRateLimitInterceptor,
} from './rate-limit-interceptor'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const respondWith = (status: number): AxiosAdapter =>
  vi.fn(async (config: InternalAxiosRequestConfig) => {
    const response = { data: {}, status, statusText: '', headers: {}, config }
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response)
  })

const createClient = (status: number) => {
  const client = axios.create({ adapter: respondWith(status) })
  installRateLimitInterceptor(client, { ignorePaths: ['/auth/login'] })
  return client
}

describe('installRateLimitInterceptor', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset()
  })

  it('shows the too many requests message once when the API answers 429', async () => {
    await expect(createClient(429).get('/products')).rejects.toBeInstanceOf(AxiosError)

    expect(toast.error).toHaveBeenCalledWith(TOO_MANY_REQUESTS_MESSAGE, {
      id: TOO_MANY_REQUESTS_MESSAGE,
    })
  })

  it('leaves ignored paths to their own screen', async () => {
    await expect(createClient(429).post('/auth/login', {})).rejects.toBeInstanceOf(
      AxiosError,
    )

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('ignores other errors', async () => {
    await expect(createClient(500).get('/products')).rejects.toBeInstanceOf(AxiosError)

    expect(toast.error).not.toHaveBeenCalled()
  })
})
