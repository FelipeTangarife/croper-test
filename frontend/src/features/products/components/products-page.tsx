import { PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { useProducts } from '../hooks/use-products'
import { useProductListStore } from '../store/product-list.store'
import type { Product } from '../types'
import { DeleteProductDialog } from './delete-product-dialog'
import { ProductCards } from './product-cards'
import { ProductFormDialog } from './product-form-dialog'
import { ProductSearch } from './product-search'
import { ProductsPagination } from './products-pagination'
import {
  ProductsEmptyState,
  ProductsErrorState,
  ProductsNoResults,
  ProductsSkeleton,
} from './products-states'
import { ProductsTable } from './products-table'

type FormState = { open: false } | { open: true; product?: Product }

export function ProductsPage() {
  const page = useProductListStore((state) => state.page)
  const search = useProductListStore((state) => state.search)
  const limit = useProductListStore((state) => state.limit)
  const sortBy = useProductListStore((state) => state.sortBy)
  const order = useProductListStore((state) => state.order)
  const setPage = useProductListStore((state) => state.setPage)
  const setLimit = useProductListStore((state) => state.setLimit)
  const toggleSort = useProductListStore((state) => state.toggleSort)
  const { data, isPending, isError, isFetching, refetch } = useProducts({
    page,
    limit,
    search: search || undefined,
    sortBy,
    order,
  })
  const [formState, setFormState] = useState<FormState>({ open: false })
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const lastPage = Math.max(data?.meta.totalPages ?? 1, 1)
  useEffect(() => {
    if (data && page > lastPage) setPage(lastPage)
  }, [data, page, lastPage, setPage])

  const openCreate = () => setFormState({ open: true })
  const openEdit = (product: Product) => setFormState({ open: true, product })

  const handleDeleted = () => {
    if (data?.data.length === 1 && page > 1) setPage(page - 1)
  }

  const renderContent = () => {
    if (isPending) return <ProductsSkeleton />
    if (isError) return <ProductsErrorState onRetry={() => void refetch()} />
    if (data.meta.total === 0) {
      return search ? (
        <ProductsNoResults search={search} />
      ) : (
        <ProductsEmptyState onCreate={openCreate} />
      )
    }
    return (
      <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
        <div className="hidden md:block">
          <ProductsTable
            products={data.data}
            sortBy={sortBy}
            order={order}
            onSort={toggleSort}
            onEdit={openEdit}
            onDelete={setProductToDelete}
          />
        </div>
        <div className="md:hidden">
          <ProductCards products={data.data} onEdit={openEdit} onDelete={setProductToDelete} />
        </div>
        <div className="mt-4">
          <ProductsPagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona el inventario de productos.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nuevo producto
        </Button>
      </header>

      <ProductSearch />

      {renderContent()}

      <ProductFormDialog
        open={formState.open}
        product={formState.open ? formState.product : undefined}
        onOpenChange={(open) => {
          if (!open) setFormState({ open: false })
        }}
      />
      <DeleteProductDialog
        product={productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null)
        }}
        onDeleted={handleDeleted}
      />
    </main>
  )
}
