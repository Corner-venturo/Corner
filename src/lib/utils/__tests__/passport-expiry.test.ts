import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkPassportExpiry, formatPassportExpiryWithStatus } from '../passport-expiry'

describe('passport-expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 5, 15)) // 2024-06-15
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkPassportExpiry', () => {
    it('returns unknown when no expiry date', () => {
      expect(checkPassportExpiry(null)).toEqual({ status: 'unknown', label: '', color: '' })
    })

    it('returns unknown for undefined', () => {
      expect(checkPassportExpiry(undefined)).toEqual({ status: 'unknown', label: '', color: '' })
    })

    it('returns expired for past date', () => {
      const result = checkPassportExpiry('2024-01-01')
      expect(result.status).toBe('expired')
      expect(result.label).toBe('已過期')
    })

    it('returns valid for date far in the future', () => {
      const result = checkPassportExpiry('2030-01-01')
      expect(result.status).toBe('valid')
    })

    it('returns insufficient when less than 6 months from today', () => {
      // Today is 2024-06-15, expiry is 2024-11-01 (< 6 months = 2024-12-15)
      const result = checkPassportExpiry('2024-11-01')
      expect(result.status).toBe('insufficient')
      expect(result.label).toBe('效期不足')
    })

    it('returns valid when more than 6 months from today', () => {
      const result = checkPassportExpiry('2025-06-01')
      expect(result.status).toBe('valid')
    })

    it('checks against departure date when provided', () => {
      // departure 2024-12-01, need expiry >= 2025-06-01
      const result = checkPassportExpiry('2025-03-01', '2024-12-01')
      expect(result.status).toBe('insufficient')
    })

    it('returns valid when enough time before departure', () => {
      const result = checkPassportExpiry('2025-07-01', '2024-12-01')
      expect(result.status).toBe('valid')
    })

    it('returns expired even with departure date', () => {
      const result = checkPassportExpiry('2024-01-01', '2024-12-01')
      expect(result.status).toBe('expired')
    })

    it('has correct color for expired', () => {
      const result = checkPassportExpiry('2024-01-01')
      expect(result.color).toContain('danger')
    })

    it('has correct color for insufficient', () => {
      const result = checkPassportExpiry('2024-11-01')
      expect(result.color).toContain('warning')
    })
  })

  describe('formatPassportExpiryWithStatus', () => {
    it('returns dash for null expiry', () => {
      const result = formatPassportExpiryWithStatus(null)
      expect(result.text).toBe('-')
      expect(result.statusLabel).toBe('')
    })

    it('returns date text with status for expired passport', () => {
      const result = formatPassportExpiryWithStatus('2024-01-01')
      expect(result.text).toBe('2024-01-01')
      expect(result.statusLabel).toBe('已過期')
    })

    it('returns empty status label for valid passport', () => {
      const result = formatPassportExpiryWithStatus('2030-01-01')
      expect(result.statusLabel).toBe('')
    })
  })
})
