import type { DefaultValues } from 'react-hook-form'
import { z } from 'zod'
import {
  PRODUCT_UNITS,
  type CreateProductPayload,
  type Product,
  type ProductDetails,
  type UpdateProductPayload,
} from '../types'

export const SKU_PATTERN = /^[A-Z0-9-]{3,20}$/
export const MAX_SPECS = 20

const nonNegativeInteger = (label: string) =>
  z
    .number({ error: `${label} es obligatorio` })
    .int(`${label} debe ser un número entero`)
    .min(0, `${label} no puede ser negativo`)

export const productFormSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      SKU_PATTERN,
      'El SKU debe tener de 3 a 20 caracteres: letras, números o guiones',
    ),
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres'),
  price: nonNegativeInteger('El precio'),
  stock: nonNegativeInteger('El stock'),
  category: z
    .string()
    .trim()
    .min(2, 'La categoría debe tener al menos 2 caracteres')
    .max(50, 'La categoría no puede superar los 50 caracteres'),
  brand: z.string().trim(),
  weight: z
    .number({ error: 'El peso debe ser un número' })
    .positive('El peso debe ser mayor a 0')
    .optional(),
  unit: z.enum(PRODUCT_UNITS, { error: 'Unidad no válida' }).or(z.literal('')),
  specs: z
    .array(
      z.object({
        key: z.string().trim().min(1, 'El nombre es obligatorio'),
        value: z.string().trim().min(1, 'El valor es obligatorio'),
      }),
    )
    .max(MAX_SPECS, `Máximo ${MAX_SPECS} especificaciones`),
})

export type ProductFormValues = z.input<typeof productFormSchema>
export type ProductFormOutput = z.output<typeof productFormSchema>

export const emptyFormValues: DefaultValues<ProductFormValues> = {
  sku: '',
  name: '',
  description: '',
  price: undefined,
  stock: undefined,
  category: '',
  brand: '',
  weight: undefined,
  unit: '',
  specs: [],
}

function buildDetails(values: ProductFormOutput): ProductDetails | undefined {
  const details: ProductDetails = {}
  if (values.brand) details.brand = values.brand
  if (values.weight !== undefined) details.weight = values.weight
  if (values.unit) details.unit = values.unit
  if (values.specs.length > 0) details.specs = values.specs
  return Object.keys(details).length > 0 ? details : undefined
}

export function toCreatePayload(values: ProductFormOutput): CreateProductPayload {
  const details = buildDetails(values)
  return {
    sku: values.sku,
    name: values.name,
    ...(values.description ? { description: values.description } : {}),
    price: values.price,
    stock: values.stock,
    category: values.category,
    ...(details ? { details } : {}),
  }
}

export function toUpdatePayload(values: ProductFormOutput): UpdateProductPayload {
  return {
    name: values.name,
    description: values.description,
    price: values.price,
    stock: values.stock,
    category: values.category,
    details: buildDetails(values) ?? {},
  }
}

export function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? '',
    price: product.price,
    stock: product.stock,
    category: product.category,
    brand: product.details?.brand ?? '',
    weight: product.details?.weight,
    unit: product.details?.unit ?? '',
    specs: product.details?.specs?.map(({ key, value }) => ({ key, value })) ?? [],
  }
}
