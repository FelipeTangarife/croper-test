import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { installAuthInterceptors } from '@/features/auth/api/auth-interceptors'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/shared/components/ui/sonner'
import { AppRoutes } from './app-routes'

installAuthInterceptors(api)

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
