import { api } from '@/lib/api'
import type {
  CreateProductPayload,
  PaginatedProducts,
  Product,
  ProductListParams,
  UpdateProductPayload,
} from '../types'

export const productsApi = {
  async list(params: ProductListParams): Promise<PaginatedProducts> {
    const { data } = await api.get<PaginatedProducts>('/products', { params })
    return data
  },

  async create(payload: CreateProductPayload): Promise<Product> {
    const { data } = await api.post<Product>('/products', payload)
    return data
  },

  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },
}
