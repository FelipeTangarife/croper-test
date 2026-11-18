import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { LOGIN_PATH } from '@/features/auth/api/auth.api'
import { installAuthInterceptors } from '@/features/auth/api/auth-interceptors'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { installRateLimitInterceptor } from '@/lib/rate-limit-interceptor'
import { Toaster } from '@/shared/components/ui/sonner'
import { AppRoutes } from './app-routes'

installAuthInterceptors(api)
installRateLimitInterceptor(api, { ignorePaths: [LOGIN_PATH] })

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
