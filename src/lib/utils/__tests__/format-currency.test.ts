import { describe, it, expect } from 'vitest'
import { formatCurrency, formatMoney, formatTWD, formatUSD } from '../format-currency'

describe('format-currency', () => {
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

    it('returns empty for null', () => {
      expect(formatCurrency(null)).toBe('')
    })

    it('returns empty for undefined', () => {
      expect(formatCurrency(undefined)).toBe('')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('NT$ 0')
    })

    it('handles negative amounts', () => {
      expect(formatCurrency(-5000)).toBe('-NT$ 5,000')
    })

    it('handles large amounts', () => {
      expect(formatCurrency(1234567)).toBe('NT$ 1,234,567')
    })

    it('handles decimals', () => {
      expect(formatCurrency(99.5, 'USD')).toBe('$ 99.5')
    })
  })

  describe('formatMoney', () => {
    it('formats number with commas', () => {
      expect(formatMoney(12345)).toBe('12,345')
    })

    it('returns empty for null', () => {
      expect(formatMoney(null)).toBe('')
    })

    it('returns empty for undefined', () => {
      expect(formatMoney(undefined)).toBe('')
    })

    it('handles zero', () => {
      expect(formatMoney(0)).toBe('0')
    })

    it('handles negative', () => {
      expect(formatMoney(-999)).toBe('-999')
    })
  })

  describe('formatTWD', () => {
    it('is shortcut for TWD', () => {
      expect(formatTWD(5000)).toBe('NT$ 5,000')
    })
  })

  describe('formatUSD', () => {
    it('is shortcut for USD', () => {
      expect(formatUSD(5000)).toBe('$ 5,000')
    })
  })
})
