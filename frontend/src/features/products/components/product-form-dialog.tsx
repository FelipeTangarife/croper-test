import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { Product } from '../types'
import { ProductForm } from './product-form'

interface ProductFormDialogProps {
  open: boolean
  product?: Product
  onOpenChange: (open: boolean) => void
}

export function ProductFormDialog({ open, product, onOpenChange }: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Actualiza los datos del producto.'
              : 'Completa los datos para agregar un producto al inventario.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ProductForm
            key={product?.id ?? 'new'}
            product={product}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
