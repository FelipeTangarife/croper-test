import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/shared/components/ui/sonner'
import { productsApi } from '../api/products.api'
import { useProductListStore } from '../store/product-list.store'
import type { PaginatedProducts, Product } from '../types'
import { ProductsPage } from './products-page'

vi.mock('../api/products.api', () => ({
  productsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

const api = vi.mocked(productsApi)

const product = (overrides: Partial<Product> = {}): Product => ({
  id: '1',
  sku: 'CAF-001',
  name: 'Café 500g',
  price: 25000,
  stock: 120,
  category: 'Café',
  isActive: true,
  createdAt: '2026-11-18T00:00:00.000Z',
  updatedAt: '2026-11-18T00:00:00.000Z',
  ...overrides,
})

const pageOf = (
  data: Product[],
  meta: Partial<PaginatedProducts['meta']> = {},
): PaginatedProducts => ({
  data,
  meta: { total: data.length, page: 1, limit: 10, totalPages: data.length ? 1 : 0, ...meta },
})

const httpError = (status: number) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ProductsPage />
      <Toaster />
    </QueryClientProvider>,
  )
}

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  const dialog = screen.getByRole('dialog')
  await user.type(within(dialog).getByLabelText('SKU'), 'caf-002')
  await user.type(within(dialog).getByLabelText('Nombre'), 'Café 250g')
  await user.type(within(dialog).getByLabelText('Precio (COP)'), '15000')
  await user.type(within(dialog).getByLabelText('Stock'), '30')
  await user.type(within(dialog).getByLabelText('Categoría'), 'Café')
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.history.replaceState(null, '', '/')
    useProductListStore.setState({
      page: 1,
      search: '',
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    })
  })

  describe('listing', () => {
    it('shows a skeleton while loading', () => {
      api.list.mockReturnValue(new Promise(() => {}))
      renderPage()
      expect(screen.getByLabelText('Cargando productos')).toBeInTheDocument()
    })

    it('shows products with COP prices, the total and the current page', async () => {
      api.list.mockResolvedValue(pageOf([product()], { total: 42, totalPages: 5 }))
      renderPage()

      expect((await screen.findAllByText('Café 500g')).length).toBeGreaterThan(0)
      expect(screen.getAllByText('$25.000').length).toBeGreaterThan(0)
      expect(screen.getByText('42 productos')).toBeInTheDocument()
      expect(screen.getByText('Página 1 de 5')).toBeInTheDocument()
      expect(api.list).toHaveBeenCalledWith({ page: 1, limit: 10, search: undefined, sortBy: 'createdAt', order: 'desc' })
    })

    it('offers to create the first product when there are none', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([]))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Crear el primer producto' }))

      expect(within(screen.getByRole('dialog')).getByText('Nuevo producto')).toBeInTheDocument()
    })

    it('says when a search has no results', async () => {
      useProductListStore.setState({ search: 'zzz' })
      api.list.mockResolvedValue(pageOf([]))
      renderPage()

      expect(await screen.findByText('No encontramos productos para "zzz".')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Crear el primer producto' })).not.toBeInTheDocument()
    })

    it('lets the user retry when loading fails', async () => {
      const user = userEvent.setup()
      api.list.mockRejectedValueOnce(httpError(500)).mockResolvedValue(pageOf([product()]))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Reintentar' }))

      expect((await screen.findAllByText('Café 500g')).length).toBeGreaterThan(0)
      expect(api.list).toHaveBeenCalledTimes(2)
    })

    it('searches by name or SKU once the user stops typing', async () => {
      const user = userEvent.setup()
      useProductListStore.setState({ page: 3 })
      api.list.mockResolvedValue(pageOf([product()], { total: 30, totalPages: 3, page: 3 }))
      renderPage()

      await user.type(screen.getByRole('searchbox', { name: 'Buscar por nombre o SKU' }), 'cafe')

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, search: 'cafe', sortBy: 'createdAt', order: 'desc' }),
      )
      expect(api.list).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'c' }))
      expect(window.location.search).toBe('?search=cafe')
    })

    it('moves between pages and keeps the page in the URL', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()], { total: 25, totalPages: 3 }))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Página siguiente' }))

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith({ page: 2, limit: 10, search: undefined, sortBy: 'createdAt', order: 'desc' }),
      )
      expect(window.location.search).toBe('?page=2')
    })
  })

  describe('sorting and page size', () => {
    it('sorts by a column header: ascending, descending, then default', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      renderPage()

      const sortByPrice = await screen.findByRole('button', { name: 'Ordenar por Precio' })
      const priceHeader = screen.getByRole('columnheader', { name: /Precio/ })
      expect(priceHeader).toHaveAttribute('aria-sort', 'none')

      await user.click(sortByPrice)
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1, sortBy: 'price', order: 'asc' }),
        ),
      )
      expect(priceHeader).toHaveAttribute('aria-sort', 'ascending')
      expect(window.location.search).toBe('?sortBy=price&order=asc')

      await user.click(sortByPrice)
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'price', order: 'desc' }),
        ),
      )
      expect(priceHeader).toHaveAttribute('aria-sort', 'descending')

      await user.click(sortByPrice)
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'createdAt', order: 'desc' }),
        ),
      )
      expect(priceHeader).toHaveAttribute('aria-sort', 'none')
    })

    it('sorts by name', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Ordenar por Nombre' }))

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ sortBy: 'name', order: 'asc' }),
        ),
      )
    })

    it('changes the number of products per page and goes back to page 1', async () => {
      const user = userEvent.setup()
      useProductListStore.setState({ page: 2 })
      api.list.mockResolvedValue(pageOf([product()], { total: 25, page: 2, totalPages: 3 }))
      renderPage()

      await user.click(await screen.findByRole('combobox', { name: 'Productos por página' }))
      await user.click(await screen.findByRole('option', { name: '20' }))

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1, limit: 20 }),
        ),
      )
      expect(window.location.search).toBe('?limit=20')
    })
  })

  describe('create and edit', () => {
    it('creates a product from the modal', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      api.create.mockResolvedValue(product({ id: '2' }))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
      await fillRequiredFields(user)
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() =>
        expect(api.create).toHaveBeenCalledWith({
          sku: 'CAF-002',
          name: 'Café 250g',
          price: 15000,
          stock: 30,
          category: 'Café',
        }),
      )
      expect(await screen.findByText('Producto creado')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('validates the form before sending it', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(
        await screen.findByText('El nombre debe tener al menos 3 caracteres'),
      ).toBeInTheDocument()
      expect(screen.getByText('El precio es obligatorio')).toBeInTheDocument()
      expect(api.create).not.toHaveBeenCalled()
    })

    it('shows a duplicated SKU on the SKU field', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      api.create.mockRejectedValue(httpError(409))
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Nuevo producto' }))
      await fillRequiredFields(user)
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      const sku = within(screen.getByRole('dialog')).getByLabelText('SKU')
      await waitFor(() => expect(sku).toHaveAttribute('aria-invalid', 'true'))
      expect(sku).toHaveAccessibleDescription('Ya existe un producto con ese SKU')
    })

    it('edits a product with the SKU locked', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      api.update.mockResolvedValue(product({ price: 27000 }))
      renderPage()

      const [editButton] = await screen.findAllByRole('button', { name: 'Editar Café 500g' })
      await user.click(editButton)
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('Editar producto')).toBeInTheDocument()
      expect(within(dialog).getByLabelText('SKU')).toBeDisabled()
      expect(within(dialog).getByLabelText('SKU')).toHaveValue('CAF-001')

      const price = within(dialog).getByLabelText('Precio (COP)')
      await user.clear(price)
      await user.type(price, '27000')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(api.update).toHaveBeenCalled())
      const [id, payload] = api.update.mock.calls[0]
      expect(id).toBe('1')
      expect(payload).toMatchObject({ price: 27000, name: 'Café 500g' })
      expect(payload).not.toHaveProperty('sku')
      expect(await screen.findByText('Producto actualizado')).toBeInTheDocument()
    })
  })

  describe('delete', () => {
    it('asks for confirmation before deleting', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product(), product({ id: '2', name: 'Té verde' })]))
      api.remove.mockResolvedValue(undefined)
      renderPage()

      const [deleteButton] = await screen.findAllByRole('button', { name: 'Eliminar Café 500g' })
      await user.click(deleteButton)
      const dialog = screen.getByRole('alertdialog')
      expect(within(dialog).getByText(/no se puede deshacer/i)).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
      expect(api.remove).not.toHaveBeenCalled()

      await user.click(deleteButton)
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }),
      )

      await waitFor(() => expect(api.remove).toHaveBeenCalledWith('1'))
      expect(await screen.findByText('Producto eliminado')).toBeInTheDocument()
    })

    it('goes to the previous page after deleting the last product of a page', async () => {
      const user = userEvent.setup()
      useProductListStore.setState({ page: 2 })
      api.list.mockImplementation(async ({ page }) =>
        page === 2
          ? pageOf([product({ id: '11', name: 'Último' })], { total: 11, page: 2, totalPages: 2 })
          : pageOf([product()], { total: 10, page: 1, totalPages: 1 }),
      )
      api.remove.mockResolvedValue(undefined)
      renderPage()

      const [deleteButton] = await screen.findAllByRole('button', { name: 'Eliminar Último' })
      await user.click(deleteButton)
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }),
      )

      await waitFor(() => expect(useProductListStore.getState().page).toBe(1))
      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, search: undefined, sortBy: 'createdAt', order: 'desc' }),
      )
    })

    it('shows a clear message when deleting fails', async () => {
      const user = userEvent.setup()
      api.list.mockResolvedValue(pageOf([product()]))
      api.remove.mockRejectedValue(httpError(404))
      renderPage()

      const [deleteButton] = await screen.findAllByRole('button', { name: 'Eliminar Café 500g' })
      await user.click(deleteButton)
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }),
      )

      expect(await screen.findByText('El producto ya no existe.')).toBeInTheDocument()
    })
  })
})
