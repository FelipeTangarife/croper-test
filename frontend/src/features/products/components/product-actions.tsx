import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { Product } from '../types'

interface ProductActionsProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductActions({ product, onEdit, onDelete }: ProductActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar ${product.name}`}
        onClick={() => onEdit(product)}
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar ${product.name}`}
        onClick={() => onDelete(product)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2Icon />
      </Button>
    </div>
  )
}
