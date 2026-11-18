import { PackageIcon, PlusIcon, RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import type { ReactNode } from 'react'

const SKELETON_ROWS = 5

export function ProductsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando productos" className="grid gap-3">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}

function StateMessage({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-12 text-center">
      <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function ProductsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <StateMessage
      icon={<PackageIcon />}
      title="Aún no hay productos"
      description="Crea tu primer producto para empezar a gestionar el inventario."
    >
      <Button onClick={onCreate}>
        <PlusIcon />
        Crear el primer producto
      </Button>
    </StateMessage>
  )
}

export function ProductsNoResults({ search }: { search: string }) {
  return (
    <StateMessage
      icon={<PackageIcon />}
      title={`No encontramos productos para "${search}".`}
      description="Prueba con otro nombre o SKU."
    />
  )
}

export function ProductsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StateMessage
      icon={<TriangleAlertIcon />}
      title="No pudimos cargar los productos."
      description="Revisa tu conexión e intenta de nuevo."
    >
      <Button variant="outline" onClick={onRetry}>
        <RotateCwIcon />
        Reintentar
      </Button>
    </StateMessage>
  )
}
