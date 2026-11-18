import { SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { useProductListStore } from '../store/product-list.store'

const SEARCH_DEBOUNCE_MS = 400
const MAX_SEARCH_LENGTH = 50

export function ProductSearch() {
  const search = useProductListStore((state) => state.search)
  const setSearch = useProductListStore((state) => state.setSearch)
  const [value, setValue] = useState(search)
  const debouncedValue = useDebouncedValue(value.trim(), SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (debouncedValue !== search) setSearch(debouncedValue)
  }, [debouncedValue, search, setSearch])

  return (
    <div className="relative w-full sm:max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Buscar por nombre o SKU"
        placeholder="Buscar por nombre o SKU"
        maxLength={MAX_SEARCH_LENGTH}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-8"
      />
    </div>
  )
}
