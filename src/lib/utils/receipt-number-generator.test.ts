import { describe, it, expect } from 'vitest'
import {
  generateReceiptNumber,
  isValidReceiptNumber,
  parseReceiptNumber,
  formatReceiptNumber,
} from './receipt-number-generator'

describe('generateReceiptNumber', () => {
  it('generates first receipt number', () => {
    expect(generateReceiptNumber('CNX250128A', [])).toBe('CNX250128A-R01')
  })

  it('increments from existing', () => {
    const existing = [{ receipt_number: 'CNX250128A-R01' }, { receipt_number: 'CNX250128A-R02' }]
    expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R03')
  })

  it('handles code field as fallback', () => {
    const existing = [{ code: 'CNX250128A-R05' }]
    expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R06')
  })

  it('ignores receipts from other tours', () => {
    const existing = [{ receipt_number: 'BKK250128A-R10' }]
    expect(generateReceiptNumber('CNX250128A', existing)).toBe('CNX250128A-R01')
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

  it('validates legacy R format', () => {
    expect(isValidReceiptNumber('R2501280001')).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(isValidReceiptNumber('INVALID')).toBe(false)
    expect(isValidReceiptNumber('')).toBe(false)
  })
})

describe('parseReceiptNumber', () => {
  it('parses new format', () => {
    const result = parseReceiptNumber('CNX250128A-R01')
    expect(result).toEqual({ tourCode: 'CNX250128A', sequence: 1, isNewFormat: true })
  })

  it('parses old TP format', () => {
    const result = parseReceiptNumber('TP-R2501280001')
    expect(result?.isNewFormat).toBe(false)
    expect(result?.year).toBe(2025)
    expect(result?.month).toBe(1)
    expect(result?.day).toBe(28)
    expect(result?.sequence).toBe(1)
    expect(result?.workspaceCode).toBe('TP')
  })

  it('parses legacy R format', () => {
    const result = parseReceiptNumber('R2501280005')
    expect(result?.sequence).toBe(5)
    expect(result?.workspaceCode).toBeUndefined()
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
    // Old format contains -R, so split('-R') gives ['TP', '2501280001']
    expect(formatReceiptNumber('TP-R2501280001', 'short')).toBe('-R2501280001')
  })

  it('date format for new format', () => {
    expect(formatReceiptNumber('CNX250128A-R01', 'date')).toBe('2025/01/28')
  })

  it('date format for old format', () => {
    expect(formatReceiptNumber('TP-R2501280001', 'date')).toBe('2025/01/28')
  })

  it('returns original for invalid format', () => {
    expect(formatReceiptNumber('INVALID', 'short')).toBe('INVALID')
  })
})
