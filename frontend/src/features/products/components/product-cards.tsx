import type { Product } from '../types'
import { formatPrice } from '../utils/format-price'
import { ProductActions } from './product-actions'

interface ProductCardsProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductCards({ products, onEdit, onDelete }: ProductCardsProps) {
  return (
    <ul className="grid gap-3">
      {products.map((product) => (
        <li key={product.id} className="rounded-xl border p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
            <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <dl className="mt-3 flex gap-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Precio</dt>
              <dd className="font-medium tabular-nums">{formatPrice(product.price)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-medium tabular-nums">{product.stock}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
