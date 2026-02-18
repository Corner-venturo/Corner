import { describe, it, expect } from 'vitest'
import { fullWidthToHalf, formatTimeInput, isValidTimeFormat } from './format-time-input'

describe('fullWidthToHalf', () => {
  it('converts full-width digits', () => {
    expect(fullWidthToHalf('０１２３')).toBe('0123')
  })

  it('converts full-width colon', () => {
    expect(fullWidthToHalf('０７：００')).toBe('07:00')
  })

  it('leaves half-width unchanged', () => {
    expect(fullWidthToHalf('07:00')).toBe('07:00')
  })
})

describe('formatTimeInput', () => {
  it('formats 4-digit input', () => {
    expect(formatTimeInput('0700')).toBe('07:00')
  })

  it('formats 3-digit input', () => {
    expect(formatTimeInput('700')).toBe('07:00')
  })

  it('passes through valid HH:MM', () => {
    expect(formatTimeInput('07:00')).toBe('07:00')
  })

  it('pads single-digit hour', () => {
    expect(formatTimeInput('7:00')).toBe('07:00')
  })

  it('converts full-width input', () => {
    expect(formatTimeInput('０７００')).toBe('07:00')
  })

  it('converts full-width with colon', () => {
    expect(formatTimeInput('０７：００')).toBe('07:00')
  })

  it('returns empty for empty input', () => {
    expect(formatTimeInput('')).toBe('')
  })

  it('returns digits for 1-2 digit input', () => {
    expect(formatTimeInput('7')).toBe('7')
    expect(formatTimeInput('07')).toBe('07')
  })

  it('handles 23:59 edge case', () => {
    expect(formatTimeInput('2359')).toBe('23:59')
  })

  it('handles midnight', () => {
    expect(formatTimeInput('0000')).toBe('00:00')
  })
})

describe('isValidTimeFormat', () => {
  it('validates correct times', () => {
    expect(isValidTimeFormat('07:00')).toBe(true)
    expect(isValidTimeFormat('23:59')).toBe(true)
    expect(isValidTimeFormat('0:00')).toBe(true)
  })

  it('rejects invalid times', () => {
    expect(isValidTimeFormat('25:00')).toBe(false)
    expect(isValidTimeFormat('12:60')).toBe(false)
    expect(isValidTimeFormat('abc')).toBe(false)
  })

  it('accepts empty as valid (optional field)', () => {
    expect(isValidTimeFormat('')).toBe(true)
  })
})
