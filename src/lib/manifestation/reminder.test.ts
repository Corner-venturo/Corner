import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      upsert: vi.fn(() => ({ error: null })),
    })),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import {
  MANIFESTATION_LAST_DATE_KEY,
  MANIFESTATION_STREAK_KEY,
  MANIFESTATION_HISTORY_KEY,
  MANIFESTATION_EVENT,
  getTodayKey,
  getDayDifferenceFromToday,
  getWeekRange,
  getManifestationReminderSnapshot,
  recordManifestationCompletion,
} from './reminder'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent: vi.fn(),
  },
  writable: true,
})

beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

describe('constants', () => {
  it('has correct localStorage keys', () => {
    expect(MANIFESTATION_LAST_DATE_KEY).toBe('manifestation_last_date')
    expect(MANIFESTATION_STREAK_KEY).toBe('manifestation_streak')
    expect(MANIFESTATION_HISTORY_KEY).toBe('manifestation_history')
  })

  it('has correct event name', () => {
    expect(MANIFESTATION_EVENT).toBe('manifestation-progress-updated')
  })
})

describe('getTodayKey', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayKey()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns current date', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(getTodayKey()).toBe(expected)
  })
})

describe('getDayDifferenceFromToday', () => {
  it('returns null for null input', () => {
    expect(getDayDifferenceFromToday(null)).toBeNull()
  })

  it('returns 0 for today', () => {
    const today = getTodayKey()
    expect(getDayDifferenceFromToday(today)).toBe(0)
  })

  it('returns positive for past date', () => {
    const past = '2020-01-01'
    const diff = getDayDifferenceFromToday(past)
    expect(diff).not.toBeNull()
    expect(diff!).toBeGreaterThan(0)
  })
})

describe('getWeekRange', () => {
  it('returns 7 dates', () => {
    expect(getWeekRange()).toHaveLength(7)
  })

  it('all dates are YYYY-MM-DD format', () => {
    for (const date of getWeekRange()) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('last date is today', () => {
    const range = getWeekRange()
    expect(range[6]).toBe(getTodayKey())
  })

  it('dates are sorted ascending', () => {
    const range = getWeekRange()
    for (let i = 1; i < range.length; i++) {
      expect(range[i] > range[i - 1]).toBe(true)
    }
  })
})

describe('getManifestationReminderSnapshot', () => {
  it('returns defaults when localStorage is empty', () => {
    const snapshot = getManifestationReminderSnapshot()
    expect(snapshot.lastDate).toBeNull()
    expect(snapshot.streak).toBe(0)
    expect(snapshot.history).toEqual([])
  })

  it('reads from localStorage', () => {
    localStorageMock.setItem(MANIFESTATION_LAST_DATE_KEY, '2024-01-15')
    localStorageMock.setItem(MANIFESTATION_STREAK_KEY, '5')
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, '["2024-01-14","2024-01-15"]')

    const snapshot = getManifestationReminderSnapshot()
    expect(snapshot.lastDate).toBe('2024-01-15')
    expect(snapshot.streak).toBe(5)
    expect(snapshot.history).toEqual(['2024-01-14', '2024-01-15'])
  })

  it('handles invalid streak value', () => {
    localStorageMock.setItem(MANIFESTATION_STREAK_KEY, 'abc')
    const snapshot = getManifestationReminderSnapshot()
    expect(snapshot.streak).toBe(0)
  })

  it('handles invalid history JSON', () => {
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, 'not json')
    const snapshot = getManifestationReminderSnapshot()
    expect(snapshot.history).toEqual([])
  })

  it('filters non-string history items', () => {
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, '["2024-01-15", 123, null]')
    const snapshot = getManifestationReminderSnapshot()
    expect(snapshot.history).toEqual(['2024-01-15'])
  })
})

describe('recordManifestationCompletion', () => {
  it('records first completion with streak 1', async () => {
    const result = await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(result).toBeDefined()
    expect(result!.streak).toBe(1)
    expect(result!.lastDate).toBe('2024-06-15')
  })

  it('increments streak for consecutive day', async () => {
    localStorageMock.setItem(MANIFESTATION_LAST_DATE_KEY, '2024-06-14')
    localStorageMock.setItem(MANIFESTATION_STREAK_KEY, '3')
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, '["2024-06-12","2024-06-13","2024-06-14"]')

    const result = await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(result!.streak).toBe(4)
  })

  it('resets streak after gap', async () => {
    localStorageMock.setItem(MANIFESTATION_LAST_DATE_KEY, '2024-06-10')
    localStorageMock.setItem(MANIFESTATION_STREAK_KEY, '5')
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, '[]')

    const result = await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(result!.streak).toBe(1)
  })

  it('keeps streak on same day', async () => {
    localStorageMock.setItem(MANIFESTATION_LAST_DATE_KEY, '2024-06-15')
    localStorageMock.setItem(MANIFESTATION_STREAK_KEY, '3')
    localStorageMock.setItem(MANIFESTATION_HISTORY_KEY, '[]')

    const result = await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(result!.streak).toBe(3)
  })

  it('dispatches custom event', async () => {
    await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(globalThis.window.dispatchEvent).toHaveBeenCalled()
  })

  it('saves to localStorage', async () => {
    await recordManifestationCompletion(undefined, new Date('2024-06-15'))
    expect(localStorageMock.setItem).toHaveBeenCalledWith(MANIFESTATION_LAST_DATE_KEY, '2024-06-15')
  })
})
