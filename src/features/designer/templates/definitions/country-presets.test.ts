import { describe, it, expect } from 'vitest'
import {
  getMemoSettingsByCountry,
  countryNames,
  getCountryCodeFromName,
  calculateMemoPageCount,
  getMemoItemsForPage,
} from './country-presets'

describe('getMemoSettingsByCountry', () => {
  it('returns Japan settings for JP', () => {
    const settings = getMemoSettingsByCountry('JP')
    expect(settings.title).toContain('日本')
    expect(settings.items.length).toBeGreaterThan(0)
  })

  it('returns Thailand settings for TH', () => {
    const settings = getMemoSettingsByCountry('TH')
    expect(settings.title).toContain('泰國')
  })

  it('returns Korea settings for KR', () => {
    const settings = getMemoSettingsByCountry('KR')
    expect(settings.title).toContain('韓國')
  })

  it('returns Vietnam settings for VN', () => {
    const settings = getMemoSettingsByCountry('VN')
    expect(settings.title).toContain('越南')
  })

  it('returns China settings for CN', () => {
    const settings = getMemoSettingsByCountry('CN')
    expect(settings.title).toContain('中國')
  })

  it('returns HK settings for HK', () => {
    const settings = getMemoSettingsByCountry('HK')
    expect(settings.title).toContain('香港')
  })

  it('returns default settings for OTHER', () => {
    const settings = getMemoSettingsByCountry('OTHER')
    expect(settings.title).toBe('旅遊小提醒')
  })

  it('returns deep clone (not same reference)', () => {
    const a = getMemoSettingsByCountry('JP')
    const b = getMemoSettingsByCountry('JP')
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('all settings have seasons', () => {
    const codes = ['JP', 'TH', 'KR', 'VN', 'CN', 'HK', 'OTHER'] as const
    for (const code of codes) {
      const s = getMemoSettingsByCountry(code)
      expect(s.seasons?.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('all settings have infoItems', () => {
    const codes = ['JP', 'TH', 'KR', 'VN', 'CN', 'HK', 'OTHER'] as const
    for (const code of codes) {
      const s = getMemoSettingsByCountry(code)
      expect(s.infoItems?.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('countryNames', () => {
  it('has JP as 日本', () => expect(countryNames.JP).toBe('日本'))
  it('has TH as 泰國', () => expect(countryNames.TH).toBe('泰國'))
  it('has KR as 韓國', () => expect(countryNames.KR).toBe('韓國'))
  it('has VN as 越南', () => expect(countryNames.VN).toBe('越南'))
  it('has CN as 中國', () => expect(countryNames.CN).toBe('中國'))
  it('has HK as 香港', () => expect(countryNames.HK).toBe('香港'))
})

describe('getCountryCodeFromName', () => {
  it('matches ISO code JP', () => expect(getCountryCodeFromName('JP')).toBe('JP'))
  it('matches ISO code lowercase', () => expect(getCountryCodeFromName('jp')).toBe('JP'))
  it('matches 日本', () => expect(getCountryCodeFromName('日本')).toBe('JP'))
  it('matches japan', () => expect(getCountryCodeFromName('japan')).toBe('JP'))
  it('matches 泰國', () => expect(getCountryCodeFromName('泰國')).toBe('TH'))
  it('matches thailand', () => expect(getCountryCodeFromName('thailand')).toBe('TH'))
  it('matches 韓國', () => expect(getCountryCodeFromName('韓國')).toBe('KR'))
  it('matches korea', () => expect(getCountryCodeFromName('korea')).toBe('KR'))
  it('matches 越南', () => expect(getCountryCodeFromName('越南')).toBe('VN'))
  it('matches 香港 before 中國', () => expect(getCountryCodeFromName('香港')).toBe('HK'))
  it('matches 中國', () => expect(getCountryCodeFromName('中國')).toBe('CN'))
  it('matches 大陸', () => expect(getCountryCodeFromName('大陸')).toBe('CN'))
  it('matches 台灣', () => expect(getCountryCodeFromName('台灣')).toBe('TW'))
  it('matches 關島', () => expect(getCountryCodeFromName('關島')).toBe('GU'))
  it('returns OTHER for unknown', () => expect(getCountryCodeFromName('火星')).toBe('OTHER'))
})

describe('calculateMemoPageCount', () => {
  it('returns 0 for no enabled items', () => {
    const settings = getMemoSettingsByCountry('JP')
    expect(calculateMemoPageCount(settings)).toBe(0)
  })

  it('returns 1 for 1-7 enabled items', () => {
    const settings = getMemoSettingsByCountry('JP')
    settings.items[0].enabled = true
    settings.items[1].enabled = true
    expect(calculateMemoPageCount(settings)).toBe(1)
  })

  it('returns 2 for 8 enabled items', () => {
    const settings = getMemoSettingsByCountry('JP')
    for (let i = 0; i < 8; i++) settings.items[i].enabled = true
    expect(calculateMemoPageCount(settings)).toBe(2)
  })

  it('adds weather page if seasons enabled', () => {
    const settings = getMemoSettingsByCountry('JP')
    settings.seasons![0].enabled = true
    expect(calculateMemoPageCount(settings)).toBe(1)
  })

  it('adds weather page for info items', () => {
    const settings = getMemoSettingsByCountry('JP')
    settings.infoItems![0].enabled = true
    expect(calculateMemoPageCount(settings)).toBe(1)
  })
})

describe('getMemoItemsForPage', () => {
  it('returns items for first page', () => {
    const settings = getMemoSettingsByCountry('JP')
    settings.items[0].enabled = true
    settings.items[1].enabled = true
    const result = getMemoItemsForPage(settings, 0)
    expect(result.items.length).toBe(2)
    expect(result.isWeatherPage).toBe(false)
  })

  it('returns weather page after item pages', () => {
    const settings = getMemoSettingsByCountry('JP')
    settings.items[0].enabled = true
    settings.seasons![0].enabled = true
    const result = getMemoItemsForPage(settings, 1)
    expect(result.isWeatherPage).toBe(true)
    expect(result.items.length).toBe(0)
  })

  it('returns empty for out of range page', () => {
    const settings = getMemoSettingsByCountry('JP')
    const result = getMemoItemsForPage(settings, 99)
    expect(result.items.length).toBe(0)
  })
})
