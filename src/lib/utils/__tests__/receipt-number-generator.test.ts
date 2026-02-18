import { describe, it, expect } from 'vitest'
import {
  generateReceiptNumber,
  isValidReceiptNumber,
  parseReceiptNumber,
  formatReceiptNumber,
} from '../receipt-number-generator'

describe('receipt-number-generator', () => {
  describe('generateReceiptNumber', () => {
    it('generates first receipt number', () => {
      expect(generateReceiptNumber('CNX250128A', [])).toBe('CNX250128A-R01')
    })

    it('increments from existing receipts', () => {
      const existing = [
        { receipt_number: 'CNX250128A-R01' },
        { receipt_number: 'CNX250128A-R02' },
      ]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R03')
    })

    it('handles gaps in numbering', () => {
      const existing = [
        { receipt_number: 'CNX250128A-R01' },
        { receipt_number: 'CNX250128A-R05' },
      ]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R06')
    })

    it('ignores receipts from other tours', () => {
      const existing = [
        { receipt_number: 'TYO250201B-R03' },
        { receipt_number: 'CNX250128A-R01' },
      ]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R02')
    })

    it('handles receipts with code field', () => {
      const existing = [{ code: 'CNX250128A-R01' }]
      expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R02')
    })

    it('handles empty existing array', () => {
      expect(generateReceiptNumber('TYO250201B', [])).toBe('TYO250201B-R01')
    })
  })

  describe('isValidReceiptNumber', () => {
    it('validates new format', () => {
      expect(isValidReceiptNumber('CNX250128A-R01')).toBe(true)
    })

    it('validates old TP format', () => {
      expect(isValidReceiptNumber('TP-R2501280001')).toBe(true)
    })

    it('validates old TC format', () => {
      expect(isValidReceiptNumber('TC-R2501280001')).toBe(true)
    })

    it('validates legacy format', () => {
      expect(isValidReceiptNumber('R2501280001')).toBe(true)
    })

    it('rejects invalid format', () => {
      expect(isValidReceiptNumber('INVALID')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isValidReceiptNumber('')).toBe(false)
    })
  })

  describe('parseReceiptNumber', () => {
    it('parses new format', () => {
      const result = parseReceiptNumber('CNX250128A-R01')
      expect(result).toEqual({
        tourCode: 'CNX250128A',
        sequence: 1,
        isNewFormat: true,
      })
    })

    it('parses old TP format', () => {
      const result = parseReceiptNumber('TP-R2501280001')
      expect(result).toMatchObject({
        sequence: 1,
        isNewFormat: false,
        year: 2025,
        month: 1,
        day: 28,
        workspaceCode: 'TP',
      })
    })

    it('parses legacy format', () => {
      const result = parseReceiptNumber('R2501280001')
      expect(result).toMatchObject({
        sequence: 1,
        isNewFormat: false,
        year: 2025,
        month: 1,
        day: 28,
      })
    })

    it('returns null for invalid', () => {
      expect(parseReceiptNumber('INVALID')).toBeNull()
    })
  })

  describe('formatReceiptNumber', () => {
    it('full format returns as-is', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'full')).toBe('CNX250128A-R01')
    })

    it('short format for new format', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'short')).toBe('-R01')
    })

    it('short format for old format', () => {
      expect(formatReceiptNumber('TP-R2501280001', 'short')).toBe('-R2501280001')
    })

    it('date format for new format', () => {
      expect(formatReceiptNumber('CNX250128A-R01', 'date')).toBe('2025/01/28')
    })

    it('date format for old format', () => {
      expect(formatReceiptNumber('TP-R2501280001', 'date')).toBe('2025/01/28')
    })

    it('returns as-is for invalid', () => {
      expect(formatReceiptNumber('INVALID', 'full')).toBe('INVALID')
    })
  })
})
