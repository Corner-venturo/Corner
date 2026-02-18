import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  minutesToTime,
  calculateDurationMinutes,
  addMinutesToTime,
  getDayOfWeekChinese,
  formatDisplayDate,
} from '../time-utils'

describe('time-utils', () => {
  describe('timeToMinutes', () => {
    it('converts 00:00 to 0', () => {
      expect(timeToMinutes('00:00')).toBe(0)
    })

    it('converts 01:30 to 90', () => {
      expect(timeToMinutes('01:30')).toBe(90)
    })

    it('converts 12:00 to 720', () => {
      expect(timeToMinutes('12:00')).toBe(720)
    })

    it('converts 23:59 to 1439', () => {
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('minutesToTime', () => {
    it('converts 0 to 00:00', () => {
      expect(minutesToTime(0)).toBe('00:00')
    })

    it('converts 90 to 01:30', () => {
      expect(minutesToTime(90)).toBe('01:30')
    })

    it('converts 720 to 12:00', () => {
      expect(minutesToTime(720)).toBe('12:00')
    })

    it('wraps around 24 hours', () => {
      expect(minutesToTime(1440)).toBe('00:00')
    })

    it('handles minutes > 24h', () => {
      expect(minutesToTime(1500)).toBe('01:00')
    })
  })

  describe('calculateDurationMinutes', () => {
    it('calculates duration between two times', () => {
      expect(calculateDurationMinutes('09:00', '17:00')).toBe(480)
    })

    it('returns 0 for same time', () => {
      expect(calculateDurationMinutes('12:00', '12:00')).toBe(0)
    })

    it('returns negative for reverse order', () => {
      expect(calculateDurationMinutes('17:00', '09:00')).toBe(-480)
    })
  })

  describe('addMinutesToTime', () => {
    it('adds minutes to time', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30')
    })

    it('adds hours worth of minutes', () => {
      expect(addMinutesToTime('09:00', 120)).toBe('11:00')
    })

    it('wraps around midnight', () => {
      expect(addMinutesToTime('23:00', 120)).toBe('01:00')
    })

    it('adds 0 minutes', () => {
      expect(addMinutesToTime('15:30', 0)).toBe('15:30')
    })
  })

  describe('getDayOfWeekChinese', () => {
    it('returns 日 for Sunday', () => {
      expect(getDayOfWeekChinese(new Date(2024, 0, 14))).toBe('日')
    })

    it('returns 一 for Monday', () => {
      expect(getDayOfWeekChinese(new Date(2024, 0, 15))).toBe('一')
    })

    it('returns 六 for Saturday', () => {
      expect(getDayOfWeekChinese(new Date(2024, 0, 20))).toBe('六')
    })
  })

  describe('formatDisplayDate', () => {
    it('formats date as MM/DD (weekday)', () => {
      const result = formatDisplayDate(new Date(2024, 0, 15))
      expect(result).toBe('01/15 (一)')
    })

    it('formats another date correctly', () => {
      const result = formatDisplayDate(new Date(2024, 11, 25))
      expect(result).toBe('12/25 (三)')
    })
  })
})
