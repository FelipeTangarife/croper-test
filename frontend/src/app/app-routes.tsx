import { Navigate, Route, Routes } from 'react-router'
import { LoginPage } from '@/features/auth/components/login-page'
import { GuestRoute, ProtectedRoute } from '@/features/auth/components/route-guards'
import { ProductsPage } from '@/features/products/components/products-page'
import { AppLayout } from './app-layout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/products" element={<ProductsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}
