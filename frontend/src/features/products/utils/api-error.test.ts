import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage, isDuplicateSkuError } from './api-error'

const FALLBACK = 'No se pudo guardar el producto. Intenta de nuevo.'

const httpError = (status: number) =>
  new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message: 'technical detail' },
  })

describe('getErrorMessage', () => {
  it.each([
    [400, 'Algunos datos no son válidos. Revísalos e intenta de nuevo.'],
    [404, 'El producto ya no existe.'],
    [409, 'Ya existe un producto con ese SKU'],
    [500, FALLBACK],
  ])('maps HTTP %d to a friendly message', (status, message) => {
    expect(getErrorMessage(httpError(status), FALLBACK)).toBe(message)
  })

  it('explains connection problems', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(getErrorMessage(error, FALLBACK)).toBe(
      'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    )
  })

  it('never exposes unknown error details', () => {
    expect(getErrorMessage(new Error('TypeError: x is undefined'), FALLBACK)).toBe(
      FALLBACK,
    )
  })
})

describe('isDuplicateSkuError', () => {
  it('detects a 409 response', () => {
    expect(isDuplicateSkuError(httpError(409))).toBe(true)
    expect(isDuplicateSkuError(httpError(400))).toBe(false)
    expect(isDuplicateSkuError(new Error('x'))).toBe(false)
  })
})
