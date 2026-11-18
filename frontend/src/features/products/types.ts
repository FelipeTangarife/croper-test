export const PRODUCT_UNITS = ['kg', 'g', 'l', 'ml', 'unidad'] as const
export type ProductUnit = (typeof PRODUCT_UNITS)[number]

export interface ProductSpec {
  key: string
  value: string
}

export interface ProductDetails {
  brand?: string
  weight?: number
  unit?: ProductUnit
  specs?: ProductSpec[]
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  details?: ProductDetails
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedProducts {
  data: Product[]
  meta: PaginationMeta
}

export const PRODUCT_SORT_FIELDS = ['name', 'price', 'createdAt'] as const
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number]

export const SORT_ORDERS = ['asc', 'desc'] as const
export type SortOrder = (typeof SORT_ORDERS)[number]

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export interface ProductListParams {
  page: number
  limit: number
  search?: string
  sortBy: ProductSortField
  order: SortOrder
}

export interface CreateProductPayload {
  sku: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  details?: ProductDetails
}

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, 'sku'>>
