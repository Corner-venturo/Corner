import { describe, it, expect } from 'vitest'
import {
  DESTINATION_CURRENCY_MAP,
  CURRENCY_NAME_MAP,
  CURRENCY_SYMBOL_MAP,
  getDestinationCurrency,
  getCurrencyName,
  getCurrencySymbol,
  formatCurrency,
  formatDate,
  formatFlightDate,
} from './currency'

describe('DESTINATION_CURRENCY_MAP', () => {
  it('maps Japan airports to JPY', () => {
    expect(DESTINATION_CURRENCY_MAP['NRT']).toBe('JPY')
    expect(DESTINATION_CURRENCY_MAP['KIX']).toBe('JPY')
    expect(DESTINATION_CURRENCY_MAP['HND']).toBe('JPY')
  })
  it('maps Thailand to THB', () => {
    expect(DESTINATION_CURRENCY_MAP['BKK']).toBe('THB')
    expect(DESTINATION_CURRENCY_MAP['泰國']).toBe('THB')
  })
  it('maps Korea to KRW', () => {
    expect(DESTINATION_CURRENCY_MAP['ICN']).toBe('KRW')
  })
})

describe('getDestinationCurrency', () => {
  it('finds by location name', () => {
    expect(getDestinationCurrency('日本', null)).toBe('JPY')
  })
  it('finds by tour code prefix', () => {
    expect(getDestinationCurrency(null, 'NRT20240101')).toBe('JPY')
  })
  it('returns null for unknown', () => {
    expect(getDestinationCurrency(null, null)).toBeNull()
  })
  it('returns null for unknown location', () => {
    expect(getDestinationCurrency('火星', 'XXX123')).toBeNull()
  })
  it('location takes priority over tour code', () => {
    expect(getDestinationCurrency('韓國', 'NRT123')).toBe('KRW')
  })
})

describe('getCurrencyName', () => {
  it('returns 日幣 for JPY', () => {
    expect(getCurrencyName('JPY')).toBe('日幣')
  })
  it('returns 美金 for USD', () => {
    expect(getCurrencyName('USD')).toBe('美金')
  })
  it('returns 外幣 for null', () => {
    expect(getCurrencyName(null)).toBe('外幣')
  })
  it('returns code for unknown', () => {
    expect(getCurrencyName('XYZ')).toBe('XYZ')
  })
})

describe('getCurrencySymbol', () => {
  it('returns ¥ for JPY', () => {
    expect(getCurrencySymbol('JPY')).toBe('¥')
  })
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$')
  })
  it('returns NT$ for TWD', () => {
    expect(getCurrencySymbol('TWD')).toBe('NT$')
  })
  it('returns empty for null', () => {
    expect(getCurrencySymbol(null)).toBe('')
  })
  it('returns empty for undefined', () => {
    expect(getCurrencySymbol(undefined)).toBe('')
  })
  it('returns code for unknown', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ')
  })
})

describe('formatCurrency', () => {
  it('formats number', () => {
    expect(formatCurrency(1000)).toMatch(/1,000|1000/)
  })
  it('returns - for null', () => {
    expect(formatCurrency(null)).toBe('-')
  })
  it('returns - for undefined', () => {
    expect(formatCurrency(undefined)).toBe('-')
  })
  it('formats 0', () => {
    expect(formatCurrency(0)).toMatch(/0/)
  })
})

describe('formatDate', () => {
  it('formats date string', () => {
    expect(formatDate('2024-01-15')).toBe('01/15')
  })
  it('returns - for null', () => {
    expect(formatDate(null)).toBe('-')
  })
  it('returns - for undefined', () => {
    expect(formatDate(undefined)).toBe('-')
  })
})

describe('formatFlightDate', () => {
  it('formats to M/DD', () => {
    const result = formatFlightDate('2024-01-15')
    expect(result).toMatch(/\/15/)
  })
  it('returns empty for null', () => {
    expect(formatFlightDate(null)).toBe('')
  })
  it('returns empty for undefined', () => {
    expect(formatFlightDate(undefined)).toBe('')
  })
})

describe('CURRENCY_NAME_MAP completeness', () => {
  it('has common currencies', () => {
    const expected = ['JPY', 'THB', 'KRW', 'VND', 'USD', 'EUR', 'GBP', 'CNY', 'HKD']
    for (const code of expected) {
      expect(CURRENCY_NAME_MAP[code]).toBeDefined()
    }
  })
})

describe('CURRENCY_SYMBOL_MAP completeness', () => {
  it('has TWD', () => {
    expect(CURRENCY_SYMBOL_MAP['TWD']).toBe('NT$')
  })
  it('has EUR', () => {
    expect(CURRENCY_SYMBOL_MAP['EUR']).toBe('€')
  })
})
