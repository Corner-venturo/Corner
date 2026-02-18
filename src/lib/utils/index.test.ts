import { describe, it, expect, vi } from 'vitest'
import {
  formatDateForInput,
  getGenderFromIdNumber,
  calculateAge,
  validateIdNumber,
  validatePassportNumber,
} from './index'

// Mock alert
vi.mock('@/lib/ui/alert-dialog', () => ({
  alert: vi.fn(),
}))

describe('formatDateForInput', () => {
  it('formats Date to YYYY-MM-DD', () => {
    expect(formatDateForInput(new Date(2024, 0, 15))).toBe('2024-01-15')
  })
  it('formats string date', () => {
    expect(formatDateForInput('2024-06-01')).toMatch(/2024-06-0[12]/)
  })
  it('returns empty for null', () => {
    expect(formatDateForInput(null)).toBe('')
  })
  it('returns empty for undefined', () => {
    expect(formatDateForInput(undefined)).toBe('')
  })
  it('returns empty for invalid', () => {
    expect(formatDateForInput('bad')).toBe('')
  })
  it('pads single digits', () => {
    expect(formatDateForInput(new Date(2024, 0, 5))).toBe('2024-01-05')
  })
})

describe('validateIdNumber', () => {
  it('validates correct format', () => {
    expect(validateIdNumber('A123456789')).toBe(true)
  })
  it('rejects lowercase', () => {
    expect(validateIdNumber('a123456789')).toBe(false)
  })
  it('rejects too short', () => {
    expect(validateIdNumber('A1234')).toBe(false)
  })
  it('rejects empty', () => {
    expect(validateIdNumber('')).toBe(false)
  })
  it('rejects no letter prefix', () => {
    expect(validateIdNumber('1234567890')).toBe(false)
  })
  it('rejects letters in number part', () => {
    expect(validateIdNumber('A12345678B')).toBe(false)
  })
})

describe('getGenderFromIdNumber', () => {
  it('returns M for male ID', () => {
    expect(getGenderFromIdNumber('A123456789')).toBe('M')
  })
  it('returns F for female ID', () => {
    expect(getGenderFromIdNumber('A223456789')).toBe('F')
  })
  it('returns empty for invalid', () => {
    expect(getGenderFromIdNumber('12345')).toBe('')
  })
  it('returns empty for empty string', () => {
    expect(getGenderFromIdNumber('')).toBe('')
  })
})

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    expect(calculateAge('1990-01-15', '2024-01-20')).toBe(34)
  })
  it('before birthday this year', () => {
    expect(calculateAge('1990-06-15', '2024-01-01')).toBe(33)
  })
  it('on birthday', () => {
    expect(calculateAge('1990-01-15', '2024-01-15')).toBe(34)
  })
  it('returns 0 for empty birth date', () => {
    expect(calculateAge('', '2024-01-01')).toBe(0)
  })
  it('returns 0 for empty departure date', () => {
    expect(calculateAge('1990-01-15', '')).toBe(0)
  })
  it('uses return_date when provided', () => {
    // Person born June 15, departure Jan 1, return July 1
    expect(calculateAge('1990-06-15', '2024-01-01', '2024-07-01')).toBe(34)
  })
  it('child age', () => {
    expect(calculateAge('2020-06-15', '2024-01-01')).toBe(3)
  })
})

describe('validatePassportNumber', () => {
  it('validates 9 digit number', () => {
    expect(validatePassportNumber('123456789')).toBe(true)
  })
  it('validates 8 digit number', () => {
    expect(validatePassportNumber('12345678')).toBe(true)
  })
  it('validates alphanumeric', () => {
    expect(validatePassportNumber('A1234567B')).toBe(true)
  })
  it('rejects empty', () => {
    expect(validatePassportNumber('')).toBe(false)
  })
  it('rejects too short', () => {
    expect(validatePassportNumber('1234')).toBe(false)
  })
})
