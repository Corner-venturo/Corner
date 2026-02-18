import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { getFontName, isFontLoaded, getSupportedFonts, clearFontCache } from './font-loader'

describe('getFontName', () => {
  it('returns correct name for Noto Sans TC', () => {
    expect(getFontName('Noto Sans TC')).toBe('NotoSansTC')
  })

  it('returns correct name for Inter', () => {
    expect(getFontName('Inter')).toBe('Inter')
  })

  it('returns correct name for Playfair Display', () => {
    expect(getFontName('Playfair Display')).toBe('PlayfairDisplay')
  })

  it('returns correct name for ChironHeiHK', () => {
    expect(getFontName('ChironHeiHK')).toBe('ChironHeiHK')
  })

  it('returns default font for unknown font', () => {
    expect(getFontName('UnknownFont')).toBe('ChironHeiHK')
  })

  it('returns correct name for Noto Serif TC', () => {
    expect(getFontName('Noto Serif TC')).toBe('NotoSerifTC')
  })

  it('returns correct name for LXGW WenKai TC', () => {
    expect(getFontName('LXGW WenKai TC')).toBe('LXGWWenKaiTC')
  })

  it('returns correct name for Roboto', () => {
    expect(getFontName('Roboto')).toBe('Roboto')
  })

  it('returns correct name for Montserrat', () => {
    expect(getFontName('Montserrat')).toBe('Montserrat')
  })

  it('returns correct name for Noto Sans JP', () => {
    expect(getFontName('Noto Sans JP')).toBe('NotoSansJP')
  })

  it('returns correct name for Zen Maru Gothic', () => {
    expect(getFontName('Zen Maru Gothic')).toBe('ZenMaruGothic')
  })

  it('returns correct name for Taipei Sans TC', () => {
    expect(getFontName('Taipei Sans TC')).toBe('TaipeiSansTC')
  })
})

describe('getSupportedFonts', () => {
  it('returns an array', () => {
    expect(Array.isArray(getSupportedFonts())).toBe(true)
  })

  it('includes Noto Sans TC', () => {
    expect(getSupportedFonts()).toContain('Noto Sans TC')
  })

  it('includes Inter', () => {
    expect(getSupportedFonts()).toContain('Inter')
  })

  it('includes ChironHeiHK', () => {
    expect(getSupportedFonts()).toContain('ChironHeiHK')
  })

  it('has more than 10 fonts', () => {
    expect(getSupportedFonts().length).toBeGreaterThan(10)
  })
})

describe('isFontLoaded', () => {
  it('returns false for unloaded font', () => {
    clearFontCache()
    expect(isFontLoaded('SomeFont')).toBe(false)
  })
})

describe('clearFontCache', () => {
  it('runs without error', () => {
    expect(() => clearFontCache()).not.toThrow()
  })
})
