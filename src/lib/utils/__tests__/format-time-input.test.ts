import { describe, it, expect } from 'vitest'
import { formatTimeInput, isValidTimeFormat, fullWidthToHalf } from '../format-time-input'

describe('format-time-input', () => {
  describe('fullWidthToHalf', () => {
    it('converts fullwidth digits', () => {
      expect(fullWidthToHalf('０１２３')).toBe('0123')
    })

    it('converts fullwidth colon', () => {
      expect(fullWidthToHalf('０７：００')).toBe('07:00')
    })

    it('passes through halfwidth', () => {
      expect(fullWidthToHalf('07:00')).toBe('07:00')
    })
  })

  describe('formatTimeInput', () => {
    it('returns empty for empty input', () => {
      expect(formatTimeInput('')).toBe('')
    })

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

    it('handles fullwidth input', () => {
      expect(formatTimeInput('０７００')).toBe('07:00')
    })

    it('handles fullwidth with colon', () => {
      expect(formatTimeInput('０７：００')).toBe('07:00')
    })

    it('returns digits for 1-2 digit input', () => {
      expect(formatTimeInput('7')).toBe('7')
      expect(formatTimeInput('07')).toBe('07')
    })

    it('handles 23:59', () => {
      expect(formatTimeInput('2359')).toBe('23:59')
    })

    it('handles midnight 00:00', () => {
      expect(formatTimeInput('0000')).toBe('00:00')
    })
  })

  describe('isValidTimeFormat', () => {
    it('accepts empty (optional field)', () => {
      expect(isValidTimeFormat('')).toBe(true)
    })

    it('accepts valid time', () => {
      expect(isValidTimeFormat('07:00')).toBe(true)
      expect(isValidTimeFormat('23:59')).toBe(true)
      expect(isValidTimeFormat('0:00')).toBe(true)
    })

    it('rejects invalid time', () => {
      expect(isValidTimeFormat('25:00')).toBe(false)
      expect(isValidTimeFormat('12:60')).toBe(false)
      expect(isValidTimeFormat('abc')).toBe(false)
    })
  })
})
