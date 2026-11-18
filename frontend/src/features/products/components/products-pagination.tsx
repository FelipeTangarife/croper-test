import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '../types'

const PAGE_SIZE_ITEMS = PAGE_SIZE_OPTIONS.map((size) => ({
  value: size,
  label: String(size),
}))

interface ProductsPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function ProductsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: ProductsPaginationProps) {
  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 text-sm sm:flex-row"
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <p>{total === 1 ? '1 producto' : `${total} productos`}</p>
        <div className="flex items-center gap-2">
          <span aria-hidden="true">Por página</span>
          <Select
            items={PAGE_SIZE_ITEMS}
            value={limit}
            onValueChange={(value) => {
              if (value !== null) onLimitChange(value)
            }}
          >
            <SelectTrigger size="sm" aria-label="Productos por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
          Anterior
        </Button>
        <span className="px-2 tabular-nums">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
