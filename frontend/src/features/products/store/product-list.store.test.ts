import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadStore = async () => {
  vi.resetModules()
  const { useProductListStore } = await import('./product-list.store')
  return useProductListStore
}

describe('useProductListStore', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('starts on page 1 without search', async () => {
    const store = await loadStore()
    expect(store.getState()).toMatchObject({ page: 1, search: '' })
  })

  it('restores page and search from the URL after a reload', async () => {
    window.history.replaceState(null, '', '/?page=3&search=cafe')
    const store = await loadStore()
    expect(store.getState()).toMatchObject({ page: 3, search: 'cafe' })
  })

  it.each(['0', '-2', 'abc', '1.5'])(
    'falls back to page 1 for an invalid page in the URL (%s)',
    async (page) => {
      window.history.replaceState(null, '', `/?page=${page}`)
      const store = await loadStore()
      expect(store.getState().page).toBe(1)
    },
  )

  it('writes page and search to the URL', async () => {
    const store = await loadStore()
    store.getState().setSearch('café')
    store.getState().setPage(2)
    const params = new URLSearchParams(window.location.search)
    expect(params.get('page')).toBe('2')
    expect(params.get('search')).toBe('café')
  })

  it('goes back to page 1 when the search changes', async () => {
    const store = await loadStore()
    store.getState().setPage(4)
    store.getState().setSearch('te')
    expect(store.getState().page).toBe(1)
    expect(window.location.search).toBe('?search=te')
  })

  it('starts with 10 items per page sorted newest first', async () => {
    const store = await loadStore()
    expect(store.getState()).toMatchObject({
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    })
  })

  it('restores page size and sort from the URL after a reload', async () => {
    window.history.replaceState(null, '', '/?limit=20&sortBy=price&order=asc')
    const store = await loadStore()
    expect(store.getState()).toMatchObject({
      limit: 20,
      sortBy: 'price',
      order: 'asc',
    })
  })

  it.each([
    ['limit=7', { limit: 10 }],
    ['sortBy=stock', { sortBy: 'createdAt', order: 'desc' }],
    ['sortBy=name&order=up', { sortBy: 'name', order: 'asc' }],
  ])('ignores invalid values in the URL (%s)', async (query, expected) => {
    window.history.replaceState(null, '', `/?${query}`)
    const store = await loadStore()
    expect(store.getState()).toMatchObject(expected)
  })

  it('changes the page size, goes back to page 1 and writes it to the URL', async () => {
    const store = await loadStore()
    store.getState().setPage(3)
    store.getState().setLimit(50)
    expect(store.getState()).toMatchObject({ limit: 50, page: 1 })
    expect(window.location.search).toBe('?limit=50')
  })

  it('cycles a column sort: ascending, descending, then back to default', async () => {
    const store = await loadStore()
    store.getState().setPage(2)

    store.getState().toggleSort('price')
    expect(store.getState()).toMatchObject({ sortBy: 'price', order: 'asc', page: 1 })
    expect(window.location.search).toBe('?sortBy=price&order=asc')

    store.getState().toggleSort('price')
    expect(store.getState()).toMatchObject({ sortBy: 'price', order: 'desc' })

    store.getState().toggleSort('price')
    expect(store.getState()).toMatchObject({ sortBy: 'createdAt', order: 'desc' })
    expect(window.location.search).toBe('')
  })

  it('starts ascending when switching to another column', async () => {
    const store = await loadStore()
    store.getState().toggleSort('price')
    store.getState().toggleSort('price')
    store.getState().toggleSort('name')
    expect(store.getState()).toMatchObject({ sortBy: 'name', order: 'asc' })
  })

  it('keeps the URL clean on the default state', async () => {
    const store = await loadStore()
    store.getState().setPage(2)
    store.getState().setPage(1)
    expect(window.location.search).toBe('')
  })
})
