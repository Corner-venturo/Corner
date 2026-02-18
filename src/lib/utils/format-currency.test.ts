import { describe, it, expect } from 'vitest'
import { formatCurrency, formatMoney, formatTWD, formatUSD } from './format-currency'

describe('formatCurrency', () => {
  it('formats TWD by default', () => {
    expect(formatCurrency(1000)).toBe('NT$ 1,000')
  })

  it('formats USD', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$ 1,000')
  })

  it('formats CNY', () => {
    expect(formatCurrency(1000, 'CNY')).toBe('¥ 1,000')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-500)).toBe('-NT$ 500')
  })

  it('returns empty string for null', () => {
    expect(formatCurrency(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatCurrency(undefined)).toBe('')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('NT$ 0')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('NT$ 1,000,000')
  })
})

describe('formatMoney', () => {
  it('formats with locale separators', () => {
    expect(formatMoney(1234567)).toMatch(/1.*234.*567/)
  })

  it('returns empty for null', () => {
    expect(formatMoney(null)).toBe('')
  })

  it('returns empty for undefined', () => {
    expect(formatMoney(undefined)).toBe('')
  })
})

describe('formatTWD', () => {
  it('delegates to formatCurrency with TWD', () => {
    expect(formatTWD(500)).toBe('NT$ 500')
  })
})

describe('formatUSD', () => {
  it('delegates to formatCurrency with USD', () => {
    expect(formatUSD(500)).toBe('$ 500')
  })
})
