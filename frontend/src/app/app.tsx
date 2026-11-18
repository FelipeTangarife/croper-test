import { QueryClientProvider } from '@tanstack/react-query'
import { ProductsPage } from '@/features/products/components/products-page'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/shared/components/ui/sonner'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductsPage />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
