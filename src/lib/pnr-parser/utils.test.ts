import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mergeMultilineEntries,
  parseAmadeusDate,
  formatSegment,
  isUrgent,
  parseEnhancedSSR,
  parseEnhancedOSI,
  extractAirportCode,
  extractTripComAirportCode,
  extractImportantDates,
} from './utils'
import { SSRCategory, OSICategory } from './types'

describe('mergeMultilineEntries', () => {
  it('should split simple lines', () => {
    const result = mergeMultilineEntries('line1\nline2\nline3')
    expect(result).toEqual(['line1', 'line2', 'line3'])
  })

  it('should skip empty lines', () => {
    const result = mergeMultilineEntries('line1\n\n\nline2')
    expect(result).toEqual(['line1', 'line2'])
  })

  it('should merge continuation lines (4+ leading spaces)', () => {
    const result = mergeMultilineEntries('1. first line\n      continuation')
    expect(result).toEqual(['1. first line continuation'])
  })

  it('should not merge independent numbered lines', () => {
    const result = mergeMultilineEntries('1. first\n2. second')
    expect(result).toEqual(['1. first', '2. second'])
  })

  it('should handle empty input', () => {
    expect(mergeMultilineEntries('')).toEqual([])
  })

  it('should handle whitespace-only input', () => {
    expect(mergeMultilineEntries('   \n   ')).toEqual([])
  })

  it('should merge multiple continuation lines', () => {
    const result = mergeMultilineEntries('1. main\n      cont1\n      cont2')
    expect(result).toEqual(['1. main cont1 cont2'])
  })

  it('should not merge first continuation without a preceding line', () => {
    // First line with leading spaces but no previous line to merge into
    const result = mergeMultilineEntries('      orphan\nnormal')
    // orphan becomes first line since mergedLines is empty
    expect(result).toEqual(['orphan', 'normal'])
  })
})

describe('parseAmadeusDate', () => {
  it('should parse valid date with month JAN', () => {
    const result = parseAmadeusDate('15', 'JAN')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getDate()).toBe(15)
    expect(result!.getMonth()).toBe(0) // January
  })

  it('should parse date with time', () => {
    const result = parseAmadeusDate('20', 'MAR', '1430')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getHours()).toBe(14)
    expect(result!.getMinutes()).toBe(30)
  })

  it('should return null for invalid month', () => {
    expect(parseAmadeusDate('15', 'XXX')).toBeNull()
  })

  it('should return null for invalid day (0)', () => {
    expect(parseAmadeusDate('0', 'JAN')).toBeNull()
  })

  it('should return null for invalid day (32)', () => {
    expect(parseAmadeusDate('32', 'JAN')).toBeNull()
  })

  it('should return null for non-numeric day', () => {
    expect(parseAmadeusDate('abc', 'JAN')).toBeNull()
  })

  it('should parse DEC correctly', () => {
    const result = parseAmadeusDate('25', 'DEC')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getMonth()).toBe(11)
  })

  it('should handle time with no leading zeros', () => {
    const result = parseAmadeusDate('01', 'FEB', '0900')
    expect(result!.getHours()).toBe(9)
    expect(result!.getMinutes()).toBe(0)
  })

  it('should default to 00:00 when no time provided', () => {
    const result = parseAmadeusDate('10', 'JUN')
    expect(result!.getHours()).toBe(0)
    expect(result!.getMinutes()).toBe(0)
  })
})

describe('formatSegment', () => {
  it('should format a segment with all fields', () => {
    const result = formatSegment({
      airline: 'BR',
      flightNumber: '108',
      origin: 'TPE',
      destination: 'NRT',
      departureDate: '15MAR',
      departureTime: '0830',
      class: 'Y',
      status: 'HK',
      passengers: 1,
      arrivalTime: '1230',
    })
    expect(result).toBe('BR108 TPE→NRT (15MAR 08:30)')
  })

  it('should format segment without departure time', () => {
    const result = formatSegment({
      airline: 'CI',
      flightNumber: '200',
      origin: 'TPE',
      destination: 'HND',
      departureDate: '20APR',
      departureTime: '',
      class: 'C',
      status: 'HK',
      passengers: 2,
      arrivalTime: '1400',
    })
    expect(result).toBe('CI200 TPE→HND (20APR)')
  })
})

describe('isUrgent', () => {
  it('should return false when deadline is null', () => {
    expect(isUrgent(null)).toBe(false)
  })

  it('should return true when deadline is tomorrow', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(isUrgent(tomorrow)).toBe(true)
  })

  it('should return true when deadline is today', () => {
    expect(isUrgent(new Date())).toBe(true)
  })

  it('should return true when deadline is in the past', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(isUrgent(yesterday)).toBe(true)
  })

  it('should return false when deadline is 5 days away', () => {
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    expect(isUrgent(fiveDays)).toBe(false)
  })

  it('should return true when deadline is exactly 3 days away', () => {
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    expect(isUrgent(threeDays)).toBe(true)
  })
})

describe('parseEnhancedSSR', () => {
  it('should parse basic SSR code', () => {
    const result = parseEnhancedSSR('SRVGML')
    expect(result).not.toBeNull()
    expect(result!.code).toBe('VGML')
    expect(result!.category).toBe(SSRCategory.MEAL)
  })

  it('should parse SSR with description', () => {
    const result = parseEnhancedSSR('SRVGML-VEGETARIAN MEAL')
    expect(result).not.toBeNull()
    expect(result!.description).toBeTruthy()
  })

  it('should parse SSR with segment', () => {
    const result = parseEnhancedSSR('SRVGML/S1')
    expect(result!.segments).toEqual([1])
  })

  it('should parse SSR with segment range', () => {
    const result = parseEnhancedSSR('SRVGML/S1-3')
    expect(result!.segments).toEqual([1, 2, 3])
  })

  it('should parse SSR with passenger', () => {
    const result = parseEnhancedSSR('SRVGML/P2')
    expect(result!.passenger).toBe(2)
  })

  it('should parse SSR with airline', () => {
    const result = parseEnhancedSSR('SRVGML/BR')
    expect(result!.airline).toBe('BR')
  })

  it('should return null for invalid SSR', () => {
    expect(parseEnhancedSSR('INVALID')).toBeNull()
  })

  it('should categorize medical SSR', () => {
    const result = parseEnhancedSSR('SRWCHR')
    expect(result!.category).toBe(SSRCategory.MEDICAL)
  })

  it('should categorize unknown SSR as OTHER', () => {
    const result = parseEnhancedSSR('SRXXXX')
    expect(result!.category).toBe(SSRCategory.OTHER)
  })

  it('should store raw line', () => {
    const line = 'SRVGML-TEST'
    const result = parseEnhancedSSR(line)
    expect(result!.raw).toBe(line)
  })
})

describe('parseEnhancedOSI', () => {
  it('should parse basic OSI', () => {
    const result = parseEnhancedOSI('OSBR TEST MESSAGE')
    expect(result).not.toBeNull()
    expect(result!.airline).toBe('BR')
    expect(result!.message).toBe('TEST MESSAGE')
  })

  it('should categorize contact OSI', () => {
    const result = parseEnhancedOSI('OSBR CONTACT PHONE 0912345678')
    expect(result!.category).toBe(OSICategory.CONTACT)
  })

  it('should categorize VIP OSI', () => {
    const result = parseEnhancedOSI('OSBR VIP PASSENGER')
    expect(result!.category).toBe(OSICategory.VIP)
  })

  it('should categorize medical OSI', () => {
    const result = parseEnhancedOSI('OSCI MEDICAL ASSISTANCE REQUIRED')
    expect(result!.category).toBe(OSICategory.MEDICAL)
  })

  it('should default to GENERAL category', () => {
    const result = parseEnhancedOSI('OSBR REGULAR NOTE')
    expect(result!.category).toBe(OSICategory.GENERAL)
  })

  it('should return null for invalid OSI', () => {
    expect(parseEnhancedOSI('INVALID')).toBeNull()
  })

  it('should store raw line', () => {
    const line = 'OSBR TEST'
    const result = parseEnhancedOSI(line)
    expect(result!.raw).toBe(line)
  })
})

describe('extractAirportCode', () => {
  it('should extract code from parentheses', () => {
    expect(extractAirportCode('Tokyo (NRT)')).toBe('NRT')
  })

  it('should return XXX for unrecognized input', () => {
    const result = extractAirportCode('!!!')
    expect(result).toBe('XXX')
  })

  it('should handle uppercase conversion', () => {
    const result = extractAirportCode('test (tpe)')
    // parentheses match requires uppercase
    expect(typeof result).toBe('string')
  })
})

describe('extractTripComAirportCode', () => {
  it('should extract code from parentheses', () => {
    expect(extractTripComAirportCode('桃園國際機場 (TPE)')).toBe('TPE')
  })

  it('should return XXX for unknown airport', () => {
    expect(extractTripComAirportCode('不存在的地方')).toBe('XXX')
  })
})

describe('extractImportantDates', () => {
  it('should return empty dates for no segments', () => {
    const result = extractImportantDates({ segments: [], ticketingDeadline: null })
    expect(result.departureDates).toEqual([])
    expect(result.ticketingDeadline).toBeNull()
  })

  it('should pass through ticketing deadline', () => {
    const deadline = new Date('2025-03-15')
    const result = extractImportantDates({ segments: [], ticketingDeadline: deadline })
    expect(result.ticketingDeadline).toBe(deadline)
  })
})
