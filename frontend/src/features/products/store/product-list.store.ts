import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import {
  PAGE_SIZE_OPTIONS,
  PRODUCT_SORT_FIELDS,
  SORT_ORDERS,
  type ProductSortField,
  type SortOrder,
} from '../types'

const MAX_SEARCH_LENGTH = 50
const DEFAULT_LIMIT = PAGE_SIZE_OPTIONS[0]
const DEFAULT_SORT_BY: ProductSortField = 'createdAt'
const DEFAULT_ORDER: SortOrder = 'desc'

interface ProductListUrlState {
  page: number
  search: string
  limit: number
  sortBy: ProductSortField
  order: SortOrder
}

interface ProductListState extends ProductListUrlState {
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setLimit: (limit: number) => void
  toggleSort: (field: ProductSortField) => void
}

const parsePage = (value: string | null) => {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

const parseLimit = (value: string | null) => {
  const limit = Number(value)
  return PAGE_SIZE_OPTIONS.find((option) => option === limit) ?? DEFAULT_LIMIT
}

const parseSort = (
  sortBy: string | null,
  order: string | null,
): Pick<ProductListUrlState, 'sortBy' | 'order'> => {
  const field = PRODUCT_SORT_FIELDS.find((option) => option === sortBy)
  if (!field) return { sortBy: DEFAULT_SORT_BY, order: DEFAULT_ORDER }
  return { sortBy: field, order: SORT_ORDERS.find((option) => option === order) ?? 'asc' }
}

const isDefaultSort = ({ sortBy, order }: ProductListUrlState) =>
  sortBy === DEFAULT_SORT_BY && order === DEFAULT_ORDER

const setOrDelete = (params: URLSearchParams, key: string, value: string | undefined) => {
  if (value === undefined) params.delete(key)
  else params.set(key, value)
}

const urlStorage: PersistStorage<ProductListUrlState> = {
  getItem: () => {
    const params = new URLSearchParams(window.location.search)
    return {
      state: {
        page: parsePage(params.get('page')),
        search: (params.get('search') ?? '').slice(0, MAX_SEARCH_LENGTH),
        limit: parseLimit(params.get('limit')),
        ...parseSort(params.get('sortBy'), params.get('order')),
      },
      version: 0,
    }
  },
  setItem: (_name, { state }) => {
    const url = new URL(window.location.href)
    const defaultSort = isDefaultSort(state)
    setOrDelete(url.searchParams, 'page', state.page > 1 ? String(state.page) : undefined)
    setOrDelete(url.searchParams, 'search', state.search || undefined)
    setOrDelete(
      url.searchParams,
      'limit',
      state.limit !== DEFAULT_LIMIT ? String(state.limit) : undefined,
    )
    setOrDelete(url.searchParams, 'sortBy', defaultSort ? undefined : state.sortBy)
    setOrDelete(url.searchParams, 'order', defaultSort ? undefined : state.order)
    window.history.replaceState(window.history.state, '', url)
  },
  removeItem: () => {},
}

export const useProductListStore = create<ProductListState>()(
  persist(
    (set) => ({
      page: 1,
      search: '',
      limit: DEFAULT_LIMIT,
      sortBy: DEFAULT_SORT_BY,
      order: DEFAULT_ORDER,
      setPage: (page) => set({ page }),
      setSearch: (search) => set({ search, page: 1 }),
      setLimit: (limit) => set({ limit, page: 1 }),
      toggleSort: (field) =>
        set((state) => {
          if (state.sortBy !== field) return { sortBy: field, order: 'asc', page: 1 }
          if (state.order === 'asc') return { order: 'desc', page: 1 }
          return { sortBy: DEFAULT_SORT_BY, order: DEFAULT_ORDER, page: 1 }
        }),
    }),
    {
      name: 'product-list',
      storage: urlStorage,
      partialize: ({ page, search, limit, sortBy, order }) => ({
        page,
        search,
        limit,
        sortBy,
        order,
      }),
    },
  ),
)
