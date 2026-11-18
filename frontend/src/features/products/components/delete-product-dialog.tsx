import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { useDeleteProduct } from '../hooks/use-products'
import type { Product } from '../types'
import { getErrorMessage } from '../utils/api-error'

interface DeleteProductDialogProps {
  product: Product | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteProductDialog({
  product,
  onOpenChange,
  onDeleted,
}: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct()

  const handleConfirm = () => {
    if (!product) return
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success('Producto eliminado')
        onDeleted()
      },
      onError: (error) => {
        const message = getErrorMessage(
          error,
          'No se pudo eliminar el producto. Intenta de nuevo.',
        )
        toast.error(message, { id: message })
      },
      onSettled: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={product !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar "{product?.name}". Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProduct.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteProduct.isPending}
            onClick={handleConfirm}
          >
            {deleteProduct.isPending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
