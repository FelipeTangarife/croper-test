import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { Product, ProductSortField, SortOrder } from '../types'
import { formatPrice } from '../utils/format-price'
import { ProductActions } from './product-actions'

interface SortableHeadProps {
  field: ProductSortField
  label: string
  sortBy: ProductSortField
  order: SortOrder
  onSort: (field: ProductSortField) => void
  align?: 'left' | 'right'
}

function SortableHead({ field, label, sortBy, order, onSort, align = 'left' }: SortableHeadProps) {
  const isActive = sortBy === field
  const ariaSort = !isActive ? 'none' : order === 'asc' ? 'ascending' : 'descending'
  const Icon = !isActive ? ChevronsUpDownIcon : order === 'asc' ? ArrowUpIcon : ArrowDownIcon

  return (
    <TableHead aria-sort={ariaSort} className={cn(align === 'right' && 'text-right')}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Ordenar por ${label}`}
        onClick={() => onSort(field)}
        className={cn(align === 'right' ? '-mr-2.5' : '-ml-2.5', isActive && 'text-foreground')}
      >
        {label}
        <Icon className={cn(!isActive && 'text-muted-foreground')} />
      </Button>
    </TableHead>
  )
}

interface ProductsTableProps {
  products: Product[]
  sortBy: ProductSortField
  order: SortOrder
  onSort: (field: ProductSortField) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductsTable({
  products,
  sortBy,
  order,
  onSort,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  const sortProps = { sortBy, order, onSort }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">SKU</TableHead>
            <SortableHead field="name" label="Nombre" {...sortProps} />
            <TableHead>Categoría</TableHead>
            <SortableHead field="price" label="Precio" align="right" {...sortProps} />
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="pl-4 font-mono text-xs">{product.sku}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-muted-foreground">{product.category}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPrice(product.price)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{product.stock}</TableCell>
              <TableCell className="pr-4">
                <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
