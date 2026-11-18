const copFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

export const formatPrice = (value: number) => `$${copFormatter.format(value)}`
