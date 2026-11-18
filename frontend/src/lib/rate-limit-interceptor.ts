import { isAxiosError, type AxiosInstance } from 'axios'
import { toast } from 'sonner'

export const TOO_MANY_REQUESTS_MESSAGE = 'Demasiados intentos, espera un minuto'

interface RateLimitInterceptorOptions {
  ignorePaths?: string[]
}

export function installRateLimitInterceptor(
  client: AxiosInstance,
  { ignorePaths = [] }: RateLimitInterceptorOptions = {},
) {
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        isAxiosError(error) &&
        error.response?.status === 429 &&
        !ignorePaths.includes(error.config?.url ?? '')
      ) {
        toast.error(TOO_MANY_REQUESTS_MESSAGE, { id: TOO_MANY_REQUESTS_MESSAGE })
      }
      return Promise.reject(error)
    },
  )
}
