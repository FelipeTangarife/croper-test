import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useCreateProduct, useUpdateProduct } from '../hooks/use-products'
import {
  MAX_SPECS,
  emptyFormValues,
  productFormSchema,
  toCreatePayload,
  toFormValues,
  toUpdatePayload,
  type ProductFormOutput,
  type ProductFormValues,
} from '../schemas/product-form.schema'
import { PRODUCT_UNITS, type Product } from '../types'
import {
  DUPLICATE_SKU_MESSAGE,
  getErrorMessage,
  isDuplicateSkuError,
} from '../utils/api-error'

const UNIT_ITEMS = [
  { value: null, label: 'Sin unidad' },
  ...PRODUCT_UNITS.map((unit) => ({ value: unit, label: unit })),
]

const toOptionalNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : Number(value)

const fieldA11y = (id: string, error?: string, hint?: string) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
})

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = Boolean(product)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? toFormValues(product) : emptyFormValues,
  })
  const specs = useFieldArray({ control, name: 'specs' })

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          payload: toUpdatePayload(values),
        })
        toast.success('Producto actualizado')
      } else {
        await createProduct.mutateAsync(toCreatePayload(values))
        toast.success('Producto creado')
      }
      onSuccess()
    } catch (error) {
      if (isDuplicateSkuError(error)) {
        setError('sku', { message: DUPLICATE_SKU_MESSAGE }, { shouldFocus: true })
        return
      }
      toast.error(
        getErrorMessage(
          error,
          isEditing
            ? 'No se pudo actualizar el producto. Intenta de nuevo.'
            : 'No se pudo crear el producto. Intenta de nuevo.',
        ),
      )
    }
  })

  const skuHint = isEditing ? 'El SKU no se puede modificar.' : undefined

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sku" label="SKU" error={errors.sku?.message} hint={skuHint}>
          <Input
            {...fieldA11y('sku', errors.sku?.message, skuHint)}
            {...register('sku')}
            disabled={isEditing}
            autoComplete="off"
            className="uppercase"
          />
        </Field>
        <Field id="name" label="Nombre" error={errors.name?.message}>
          <Input {...fieldA11y('name', errors.name?.message)} {...register('name')} />
        </Field>
        <Field
          id="description"
          label="Descripción (opcional)"
          error={errors.description?.message}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldA11y('description', errors.description?.message)}
            {...register('description')}
            rows={3}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
          />
        </Field>
        <Field id="price" label="Precio (COP)" error={errors.price?.message}>
          <Input
            {...fieldA11y('price', errors.price?.message)}
            {...register('price', { setValueAs: toOptionalNumber })}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
          />
        </Field>
        <Field id="stock" label="Stock" error={errors.stock?.message}>
          <Input
            {...fieldA11y('stock', errors.stock?.message)}
            {...register('stock', { setValueAs: toOptionalNumber })}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
          />
        </Field>
        <Field id="category" label="Categoría" error={errors.category?.message}>
          <Input
            {...fieldA11y('category', errors.category?.message)}
            {...register('category')}
          />
        </Field>
        <Field id="brand" label="Marca (opcional)" error={errors.brand?.message}>
          <Input {...fieldA11y('brand', errors.brand?.message)} {...register('brand')} />
        </Field>
        <Field id="weight" label="Peso (opcional)" error={errors.weight?.message}>
          <Input
            {...fieldA11y('weight', errors.weight?.message)}
            {...register('weight', { setValueAs: toOptionalNumber })}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
          />
        </Field>
        <Field id="unit" label="Unidad (opcional)" error={errors.unit?.message}>
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <Select
                items={UNIT_ITEMS}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  {...fieldA11y('unit', errors.unit?.message)}
                  onBlur={field.onBlur}
                  className="w-full"
                >
                  <SelectValue placeholder="Sin unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_ITEMS.map((item) => (
                    <SelectItem key={item.label} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">
          Especificaciones (opcional, máximo {MAX_SPECS})
        </legend>
        {specs.fields.map((spec, index) => {
          const keyError = errors.specs?.[index]?.key?.message
          const valueError = errors.specs?.[index]?.value?.message
          return (
            <div
              key={spec.id}
              className="flex items-start gap-2 rounded-lg border p-2 sm:rounded-none sm:border-0 sm:p-0"
            >
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <div className="min-w-0">
                  <Input
                    {...fieldA11y(`specs-${index}-key`, keyError)}
                    {...register(`specs.${index}.key`)}
                    aria-label={`Nombre de la especificación ${index + 1}`}
                    placeholder="Nombre (ej. Origen)"
                  />
                  {keyError && (
                    <p id={`specs-${index}-key-error`} className="mt-1 text-xs text-destructive">
                      {keyError}
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <Input
                    {...fieldA11y(`specs-${index}-value`, valueError)}
                    {...register(`specs.${index}.value`)}
                    aria-label={`Valor de la especificación ${index + 1}`}
                    placeholder="Valor (ej. Huila)"
                  />
                  {valueError && (
                    <p id={`specs-${index}-value-error`} className="mt-1 text-xs text-destructive">
                      {valueError}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar especificación ${index + 1}`}
                onClick={() => specs.remove(index)}
              >
                <XIcon />
              </Button>
            </div>
          )
        })}
        {errors.specs?.message && (
          <p className="text-xs text-destructive">{errors.specs.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={specs.fields.length >= MAX_SPECS}
          onClick={() => specs.append({ key: '', value: '' })}
        >
          <PlusIcon />
          Agregar especificación
        </Button>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
