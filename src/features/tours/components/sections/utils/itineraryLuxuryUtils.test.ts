import { describe, it, expect } from 'vitest'
import { calculateDayLabels, calculateDayDate, getDayOfWeek, isLastMainDay } from './itineraryLuxuryUtils'

describe('calculateDayLabels', () => {
  it('labels sequential days', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: false },
    ] as any
    expect(calculateDayLabels(itinerary)).toEqual(['Day 1', 'Day 2', 'Day 3'])
  })

  it('labels alternative days with suffix', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: true },
      { isAlternative: false },
    ] as any
    expect(calculateDayLabels(itinerary)).toEqual(['Day 1', 'Day 1-B', 'Day 2'])
  })

  it('handles multiple alternatives', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: true },
      { isAlternative: true },
      { isAlternative: false },
    ] as any
    expect(calculateDayLabels(itinerary)).toEqual(['Day 1', 'Day 1-B', 'Day 1-C', 'Day 2'])
  })

  it('handles empty itinerary', () => {
    expect(calculateDayLabels([])).toEqual([])
  })

  it('handles single day', () => {
    const itinerary = [{ isAlternative: false }] as any
    expect(calculateDayLabels(itinerary)).toEqual(['Day 1'])
  })

  it('handles 5 days with alternatives', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: true },
      { isAlternative: false },
    ] as any
    expect(calculateDayLabels(itinerary)).toEqual(['Day 1', 'Day 2', 'Day 3', 'Day 3-B', 'Day 4'])
  })
})

describe('calculateDayDate', () => {
  it('returns formatted date for day 1', () => {
    expect(calculateDayDate('2025-03-15', 1)).toBe('MAR 15')
  })

  it('returns next day for day 2', () => {
    expect(calculateDayDate('2025-03-15', 2)).toBe('MAR 16')
  })

  it('handles month boundary', () => {
    expect(calculateDayDate('2025-03-31', 2)).toBe('APR 1')
  })

  it('returns empty for undefined date', () => {
    expect(calculateDayDate(undefined, 1)).toBe('')
  })

  it('returns empty for day 0', () => {
    expect(calculateDayDate('2025-03-15', 0)).toBe('')
  })

  it('returns empty for negative day', () => {
    expect(calculateDayDate('2025-03-15', -1)).toBe('')
  })

  it('returns empty for invalid date', () => {
    expect(calculateDayDate('invalid', 1)).toBe('')
  })

  it('handles year boundary', () => {
    expect(calculateDayDate('2025-12-31', 2)).toBe('JAN 1')
  })

  it('handles day 10', () => {
    expect(calculateDayDate('2025-01-01', 10)).toBe('JAN 10')
  })
})

describe('getDayOfWeek', () => {
  it('returns correct day for known date', () => {
    // 2025-03-15 is Saturday
    expect(getDayOfWeek('2025-03-15')).toBe('Sat')
  })

  it('returns empty for undefined', () => {
    expect(getDayOfWeek(undefined)).toBe('')
  })

  it('returns empty for empty string', () => {
    expect(getDayOfWeek('')).toBe('')
  })

  it('returns Mon for a Monday', () => {
    expect(getDayOfWeek('2025-03-17')).toBe('Mon')
  })

  it('returns Sun for a Sunday', () => {
    expect(getDayOfWeek('2025-03-16')).toBe('Sun')
  })
})

describe('isLastMainDay', () => {
  it('returns true for last day in simple itinerary', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: false },
    ] as any
    expect(isLastMainDay(itinerary, 2)).toBe(true)
  })

  it('returns false for non-last day', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: false },
    ] as any
    expect(isLastMainDay(itinerary, 0)).toBe(false)
  })

  it('returns true for alternative of last main day', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: false },
      { isAlternative: true },
    ] as any
    expect(isLastMainDay(itinerary, 2)).toBe(true)
  })

  it('returns false for alternative of non-last main day', () => {
    const itinerary = [
      { isAlternative: false },
      { isAlternative: true },
      { isAlternative: false },
    ] as any
    expect(isLastMainDay(itinerary, 1)).toBe(false)
  })

  it('handles single day', () => {
    const itinerary = [{ isAlternative: false }] as any
    expect(isLastMainDay(itinerary, 0)).toBe(true)
  })
})
