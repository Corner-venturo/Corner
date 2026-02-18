import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  minutesToTime,
  calculateDurationMinutes,
  addMinutesToTime,
  getDayOfWeekChinese,
  formatDisplayDate,
  calculateUsableTime,
  calculateEndTimeWithMeals,
} from './time-utils'
import type { DailyTimeSlot } from './types'
import { DEFAULT_SCHEDULING_CONFIG } from './types'

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
  it('converts 1439 to 23:59', () => {
    expect(minutesToTime(1439)).toBe('23:59')
  })
  it('wraps around 24h', () => {
    expect(minutesToTime(1440)).toBe('00:00')
  })
  it('pads single digits', () => {
    expect(minutesToTime(5)).toBe('00:05')
  })
})

describe('calculateDurationMinutes', () => {
  it('calculates duration', () => {
    expect(calculateDurationMinutes('08:00', '12:00')).toBe(240)
  })
  it('returns 0 for same time', () => {
    expect(calculateDurationMinutes('10:00', '10:00')).toBe(0)
  })
  it('returns negative for reverse', () => {
    expect(calculateDurationMinutes('12:00', '08:00')).toBe(-240)
  })
})

describe('addMinutesToTime', () => {
  it('adds minutes', () => {
    expect(addMinutesToTime('08:00', 30)).toBe('08:30')
  })
  it('crosses hour boundary', () => {
    expect(addMinutesToTime('08:45', 30)).toBe('09:15')
  })
  it('adds 0 minutes', () => {
    expect(addMinutesToTime('10:00', 0)).toBe('10:00')
  })
})

describe('getDayOfWeekChinese', () => {
  it('returns 日 for Sunday', () => {
    expect(getDayOfWeekChinese(new Date(2024, 0, 7))).toBe('日')
  })
  it('returns 一 for Monday', () => {
    expect(getDayOfWeekChinese(new Date(2024, 0, 8))).toBe('一')
  })
  it('returns 六 for Saturday', () => {
    expect(getDayOfWeekChinese(new Date(2024, 0, 6))).toBe('六')
  })
})

describe('formatDisplayDate', () => {
  it('formats as MM/DD (週幾)', () => {
    const result = formatDisplayDate(new Date(2024, 0, 8)) // Monday
    expect(result).toBe('01/08 (一)')
  })
  it('formats December', () => {
    const result = formatDisplayDate(new Date(2024, 11, 25))
    expect(result).toMatch(/12\/25/)
  })
})

describe('calculateUsableTime', () => {
  it('deducts lunch for full day', () => {
    const slot: DailyTimeSlot = {
      dayNumber: 1,
      date: '2024-01-15',
      displayDate: '01/15 (一)',
      availableMinutes: 600, // 10 hours
      startTime: '08:00',
      endTime: '18:00',
      isFirstDay: false,
      isLastDay: false,
    }
    const usable = calculateUsableTime(slot)
    // Should deduct lunch and dinner
    expect(usable).toBeLessThan(600)
  })
  it('returns 0 for no available time', () => {
    const slot: DailyTimeSlot = {
      dayNumber: 1,
      date: '2024-01-15',
      displayDate: '01/15 (一)',
      availableMinutes: 0,
      startTime: '18:00',
      endTime: '18:00',
      isFirstDay: false,
      isLastDay: false,
    }
    expect(calculateUsableTime(slot)).toBe(0)
  })
  it('does not deduct meals outside range', () => {
    const slot: DailyTimeSlot = {
      dayNumber: 1,
      date: '2024-01-15',
      displayDate: '01/15 (一)',
      availableMinutes: 120,
      startTime: '08:00',
      endTime: '10:00',
      isFirstDay: false,
      isLastDay: false,
    }
    expect(calculateUsableTime(slot)).toBe(120)
  })
})

describe('calculateEndTimeWithMeals', () => {
  it('returns end time for short activity before lunch', () => {
    const result = calculateEndTimeWithMeals('09:00', 60)
    expect(result).toBe('10:00')
  })
  it('skips over lunch time', () => {
    // Activity from 11:00, 120 min → should cross lunch
    const result = calculateEndTimeWithMeals('11:00', 120)
    // 60 min before lunch (12:00), then lunch break, then 60 min after
    expect(timeToMinutes(result)).toBeGreaterThan(timeToMinutes('13:00'))
  })
})
