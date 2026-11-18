import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore, type AuthSession } from '@/features/auth/store/auth.store'
import { productsApi } from '@/features/products/api/products.api'
import { AppRoutes } from './app-routes'

vi.mock('@/features/auth/api/auth.api', () => ({
  authApi: { login: vi.fn() },
}))

vi.mock('@/features/products/api/products.api', () => ({
  productsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

const login = vi.mocked(authApi.login)
const listProducts = vi.mocked(productsApi.list)

const user = { id: '1', email: 'admin@croper.test', name: 'Felipe Admin' }

const activeSession = (expiresInMs = 60 * 60 * 1000): AuthSession => ({
  accessToken: 'token-123',
  user,
  expiresAt: Date.now() + expiresInMs,
})

const unauthorized = () =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 401,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })

const renderAt = (path: string) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const fillLogin = async (u: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  await u.type(screen.getByLabelText('Correo'), email)
  await u.type(screen.getByLabelText('Contraseña'), password)
  await u.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    useAuthStore.setState({ session: null, logoutReason: null })
    listProducts.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
  })

  it('sends visitors without a session to the login', async () => {
    renderAt('/products')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(listProducts).not.toHaveBeenCalled()
  })

  it('logs in and shows the products with the user name in the header', async () => {
    const u = userEvent.setup()
    login.mockResolvedValue({ accessToken: 'token-123', expiresIn: 3600, user })
    renderAt('/products')

    await fillLogin(u, 'admin@croper.test', 'Admin1234!')

    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.getByText('Felipe Admin')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'admin@croper.test', password: 'Admin1234!' })
    expect(useAuthStore.getState().session?.accessToken).toBe('token-123')
  })

  it('shows "Credenciales inválidas" when the login fails', async () => {
    const u = userEvent.setup()
    login.mockRejectedValue(unauthorized())
    renderAt('/login')

    await fillLogin(u, 'admin@croper.test', 'Wrong1234!')

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('validates the login form before calling the API', async () => {
    const u = userEvent.setup()
    renderAt('/login')

    await u.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('sends users with a session from the login to the products', async () => {
    useAuthStore.setState({ session: activeSession() })
    renderAt('/login')

    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
  })

  it('keeps the session after a reload while the token is valid', async () => {
    useAuthStore.setState({ session: activeSession() })
    renderAt('/products')

    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.getByText('Felipe Admin')).toBeInTheDocument()
  })

  it('sends to the login with the expired message when the stored token already expired', async () => {
    useAuthStore.setState({ session: activeSession(-1000) })
    renderAt('/products')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión expiró, vuelve a ingresar',
    )
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('logs out automatically when the token expires while using the app', async () => {
    useAuthStore.setState({ session: activeSession(300) })
    renderAt('/products')
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()

    expect(
      await screen.findByText('Tu sesión expiró, vuelve a ingresar', {}, { timeout: 2000 }),
    ).toBeInTheDocument()
  })

  it('sends to the login with the expired message when the API rejects the token', async () => {
    useAuthStore.setState({ session: activeSession() })
    listProducts.mockImplementation(async () => {
      useAuthStore.getState().logout('expired')
      throw unauthorized()
    })
    renderAt('/products')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión expiró, vuelve a ingresar',
    )
  })

  it('logs out from the header', async () => {
    const u = userEvent.setup()
    useAuthStore.setState({ session: activeSession() })
    renderAt('/products')

    await u.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await waitFor(() => expect(useAuthStore.getState().session).toBeNull())
  })
})
