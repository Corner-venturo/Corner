import { describe, it, expect } from 'vitest'
import {
  generateReceiptNumber,
  isValidReceiptNumber,
  parseReceiptNumber,
  formatReceiptNumber,
} from '@/lib/utils/receipt-number-generator'

describe('receipt-number-generator', () => {
  describe('generateReceiptNumber', () => {
    it('should generate first receipt number', () => {
      expect(generateReceiptNumber('CNX250128A', [])).toBe('CNX250128A-R01')
    })

    it('should increment from existing', () => {
      const existing = [
        { receipt_number: 'CNX250128A-R01' },
        { receipt_number: 'CNX250128A-R02' },
      ]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R03')
    })

    it('should find max number even if unordered', () => {
      const existing = [
        { receipt_number: 'CNX250128A-R05' },
        { receipt_number: 'CNX250128A-R02' },
      ]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R06')
    })

    it('should use code field as fallback', () => {
      const existing = [{ code: 'CNX250128A-R03' }]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R04')
    })

    it('should ignore receipts from other tours', () => {
      const existing = [{ receipt_number: 'BKK250128A-R05' }]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R01')
    })
  })

  describe('isValidReceiptNumber', () => {
    it('should validate new format', () => {
      expect(isValidReceiptNumber('CNX250128A-R01')).toBe(true)
      expect(isValidReceiptNumber('BKK250228B-R99')).toBe(true)
    })

    it('should validate old format', () => {
      expect(isValidReceiptNumber('TP-R2501280001')).toBe(true)
      expect(isValidReceiptNumber('TC-R2501280001')).toBe(true)
    })

    it('should validate legacy format', () => {
      expect(isValidReceiptNumber('R2501280001')).toBe(true)
    })

    it('should reject invalid format', () => {
      expect(isValidReceiptNumber('INVALID')).toBe(false)
      expect(isValidReceiptNumber('')).toBe(false)
      expect(isValidReceiptNumber('CNX-R01')).toBe(false)
    })
  })

  describe('parseReceiptNumber', () => {
    it('should parse new format', () => {
      const result = parseReceiptNumber('CNX250128A-R01')
      expect(result).toEqual({
        tourCode: 'CNX250128A',
        sequence: 1,
        isNewFormat: true,
      })
    })

    it('should return null for invalid', () => {
      expect(parseReceiptNumber('INVALID')).toBeNull()
    })
  })

  describe('formatReceiptNumber', () => {
    it('should format full', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'full')).toBe('CNX250128A-R01')
    })

    it('should format short', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'short')).toBe('-R01')
    })

    it('should format date from new format', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'date')).toBe('2025/01/28')
    })
  })
})
