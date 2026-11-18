import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import {
  productFormSchema,
  toCreatePayload,
  toFormValues,
  toUpdatePayload,
  type ProductFormValues,
} from './product-form.schema'

const validValues = (): ProductFormValues => ({
  sku: 'caf-001',
  name: 'Café 500g',
  description: 'Café de origen, tostión media',
  price: 25000,
  stock: 120,
  category: 'Café',
  brand: 'Finca Felipe',
  weight: 500,
  unit: 'g',
  specs: [{ key: 'Origen', value: 'Huila' }],
})

const firstIssuePath = (values: Record<string, unknown>) => {
  const result = productFormSchema.safeParse(values)
  return result.success ? undefined : result.error.issues[0].path.join('.')
}

describe('productFormSchema', () => {
  it('accepts valid values and uppercases the sku', () => {
    const result = productFormSchema.parse(validValues())
    expect(result.sku).toBe('CAF-001')
  })

  it('accepts values without optional fields', () => {
    expect(
      firstIssuePath({
        ...validValues(),
        description: '',
        brand: '',
        weight: undefined,
        unit: '',
        specs: [],
      }),
    ).toBeUndefined()
  })

  it.each([
    ['sku', 'AB'],
    ['sku', 'A'.repeat(21)],
    ['sku', 'CAF_001'],
    ['name', 'ab'],
    ['name', 'a'.repeat(101)],
    ['description', 'a'.repeat(1001)],
    ['price', 25000.5],
    ['price', -1],
    ['price', undefined],
    ['stock', 1.5],
    ['stock', -1],
    ['stock', undefined],
    ['category', 'a'],
    ['category', 'a'.repeat(51)],
    ['weight', 0],
    ['weight', -1],
    ['unit', 'lb'],
  ])('rejects invalid %s (%s)', (field, value) => {
    expect(firstIssuePath({ ...validValues(), [field]: value })).toBe(field)
  })

  it('rejects more than 20 specs', () => {
    const specs = Array.from({ length: 21 }, (_, i) => ({
      key: `k${i}`,
      value: 'v',
    }))
    expect(firstIssuePath({ ...validValues(), specs })).toBe('specs')
  })

  it('rejects a spec with an empty key', () => {
    expect(
      firstIssuePath({ ...validValues(), specs: [{ key: ' ', value: 'v' }] }),
    ).toBe('specs.0.key')
  })

  it('shows validation messages in Spanish', () => {
    const result = productFormSchema.safeParse({ ...validValues(), price: undefined })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('El precio es obligatorio')
  })
})

describe('form payload mapping', () => {
  it('builds the create payload with details and without empty fields', () => {
    const values = productFormSchema.parse({
      ...validValues(),
      description: '',
      brand: '',
      unit: '',
    })
    expect(toCreatePayload(values)).toEqual({
      sku: 'CAF-001',
      name: 'Café 500g',
      price: 25000,
      stock: 120,
      category: 'Café',
      details: { weight: 500, specs: [{ key: 'Origen', value: 'Huila' }] },
    })
  })

  it('omits details when all of them are empty', () => {
    const values = productFormSchema.parse({
      ...validValues(),
      brand: '',
      weight: undefined,
      unit: '',
      specs: [],
    })
    expect(toCreatePayload(values)).not.toHaveProperty('details')
  })

  it('builds the update payload without sku and lets fields be cleared', () => {
    const values = productFormSchema.parse({
      ...validValues(),
      description: '',
      brand: '',
      weight: undefined,
      unit: '',
      specs: [],
    })
    expect(toUpdatePayload(values)).toEqual({
      name: 'Café 500g',
      description: '',
      price: 25000,
      stock: 120,
      category: 'Café',
      details: {},
    })
  })

  it('maps a product into form values', () => {
    const product: Product = {
      id: '1',
      sku: 'CAF-001',
      name: 'Café 500g',
      price: 25000,
      stock: 120,
      category: 'Café',
      details: { unit: 'g' },
      isActive: true,
      createdAt: '2026-11-18T00:00:00.000Z',
      updatedAt: '2026-11-18T00:00:00.000Z',
    }
    expect(toFormValues(product)).toEqual({
      sku: 'CAF-001',
      name: 'Café 500g',
      description: '',
      price: 25000,
      stock: 120,
      category: 'Café',
      brand: '',
      weight: undefined,
      unit: 'g',
      specs: [],
    })
  })
})
