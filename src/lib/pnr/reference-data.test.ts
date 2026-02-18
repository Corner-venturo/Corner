import { describe, it, expect, beforeEach } from 'vitest'

// We need to mock supabase before importing the module
import { vi } from 'vitest'
vi.mock('@/lib/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }), order: () => ({ data: [], error: null }), data: [], error: null }) }) },
}))
vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import {
  getAirline,
  getAirlineName,
  getAirport,
  getAirportName,
  getCityName,
  getBookingClass,
  getBookingClassDescription,
  getSSRCode,
  getSSRDescription,
  getSSRCategory,
  getStatusCode,
  getStatusDescription,
  getStatusCategory,
  isConfirmedStatus,
  isWaitlistStatus,
  isCancelledStatus,
  getCacheStatus,
} from './reference-data'

// Note: These test the synchronous lookup functions against the internal cache
// which starts empty. The functions gracefully handle missing data.

describe('getAirline', () => {
  it('returns undefined for unknown code', () => {
    expect(getAirline('XX')).toBeUndefined()
  })
  it('is case insensitive (uppercases)', () => {
    expect(getAirline('xx')).toBeUndefined()
  })
})

describe('getAirlineName', () => {
  it('returns code when airline not found', () => {
    expect(getAirlineName('XX')).toBe('XX')
  })
  it('returns code for empty string', () => {
    expect(getAirlineName('')).toBe('')
  })
})

describe('getAirport', () => {
  it('returns undefined for unknown code', () => {
    expect(getAirport('XXX')).toBeUndefined()
  })
})

describe('getAirportName', () => {
  it('returns code when airport not found', () => {
    expect(getAirportName('XXX')).toBe('XXX')
  })
  it('handles preferChinese false', () => {
    expect(getAirportName('XXX', false)).toBe('XXX')
  })
})

describe('getCityName', () => {
  it('returns code when airport not found', () => {
    expect(getCityName('XXX')).toBe('XXX')
  })
})

describe('getBookingClass', () => {
  it('returns undefined for unknown code', () => {
    expect(getBookingClass('Z')).toBeUndefined()
  })
})

describe('getBookingClassDescription', () => {
  it('returns code when not found', () => {
    expect(getBookingClassDescription('Z')).toBe('Z')
  })
})

describe('getSSRCode', () => {
  it('returns undefined for unknown code', () => {
    expect(getSSRCode('XXXX')).toBeUndefined()
  })
})

describe('getSSRDescription', () => {
  it('returns code when not found', () => {
    expect(getSSRDescription('XXXX')).toBe('XXXX')
  })
  it('returns code with preferChinese false', () => {
    expect(getSSRDescription('XXXX', false)).toBe('XXXX')
  })
})

describe('getSSRCategory', () => {
  it('returns null when not found', () => {
    expect(getSSRCategory('XXXX')).toBeNull()
  })
})

describe('getStatusCode', () => {
  it('returns undefined for unknown code', () => {
    expect(getStatusCode('XX')).toBeUndefined()
  })
})

describe('getStatusDescription', () => {
  it('returns code when not found', () => {
    expect(getStatusDescription('XX')).toBe('XX')
  })
})

describe('getStatusCategory', () => {
  it('returns null when not found', () => {
    expect(getStatusCategory('XX')).toBeNull()
  })
})

describe('isConfirmedStatus', () => {
  it('returns false for unknown code', () => {
    expect(isConfirmedStatus('XX')).toBe(false)
  })
})

describe('isWaitlistStatus', () => {
  it('returns false for unknown code', () => {
    expect(isWaitlistStatus('XX')).toBe(false)
  })
})

describe('isCancelledStatus', () => {
  it('returns false for unknown code', () => {
    expect(isCancelledStatus('XX')).toBe(false)
  })
})

describe('getCacheStatus', () => {
  it('returns cache status object', () => {
    const status = getCacheStatus()
    expect(status).toHaveProperty('isValid')
    expect(status).toHaveProperty('lastFetched')
    expect(status).toHaveProperty('counts')
    expect(status.counts).toHaveProperty('airlines')
    expect(status.counts).toHaveProperty('airports')
  })

  it('reports invalid cache initially', () => {
    const status = getCacheStatus()
    expect(status.isValid).toBe(false)
  })

  it('has zero counts initially', () => {
    const status = getCacheStatus()
    expect(status.counts.airlines).toBe(0)
    expect(status.counts.airports).toBe(0)
  })
})
