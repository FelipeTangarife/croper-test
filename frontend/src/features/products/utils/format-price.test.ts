import { describe, expect, it } from 'vitest'
import { formatPrice } from './format-price'

describe('formatPrice', () => {
  it.each([
    [25000, '$25.000'],
    [1000, '$1.000'],
    [1250000, '$1.250.000'],
    [0, '$0'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatPrice(value)).toBe(expected)
  })
})
