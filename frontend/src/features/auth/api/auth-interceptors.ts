import { isAxiosError, type AxiosInstance } from 'axios'
import { useAuthStore } from '../store/auth.store'
import { LOGIN_PATH } from './auth.api'

export function installAuthInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().session?.accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const { session, logout } = useAuthStore.getState()
      const isLoginRequest = isAxiosError(error) && error.config?.url === LOGIN_PATH
      if (isAxiosError(error) && error.response?.status === 401 && !isLoginRequest && session) {
        logout('expired')
      }
      return Promise.reject(error)
    },
  )
}
