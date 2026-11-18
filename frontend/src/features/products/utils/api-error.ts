import { isAxiosError } from 'axios'

export const DUPLICATE_SKU_MESSAGE = 'Ya existe un producto con ese SKU'

const NETWORK_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Algunos datos no son válidos. Revísalos e intenta de nuevo.',
  404: 'El producto ya no existe.',
  409: DUPLICATE_SKU_MESSAGE,
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  if (!error.response) return NETWORK_MESSAGE
  return STATUS_MESSAGES[error.response.status] ?? fallback
}

export function isDuplicateSkuError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}
