import { describe, it, expect } from 'vitest'
import { normalizeName, splitPassportName, calculateSimilarity, findBestMatch } from './pnr-name-matcher'

describe('normalizeName', () => {
  it('converts to uppercase', () => {
    expect(normalizeName('wang/daming')).toBe('WANG/DAMING')
  })
  it('removes MR suffix', () => {
    expect(normalizeName('WANG/DAMING MR')).toBe('WANG/DAMING')
  })
  it('removes MRS suffix', () => {
    expect(normalizeName('LIN/MEILI MRS')).toBe('LIN/MEILI')
  })
  it('removes MS suffix', () => {
    expect(normalizeName('CHEN/YI MS')).toBe('CHEN/YI')
  })
  it('removes MISS suffix', () => {
    expect(normalizeName('LEE/XIAO MISS')).toBe('LEE/XIAO')
  })
  it('removes CHD suffix', () => {
    expect(normalizeName('WANG/XIAO CHD')).toBe('WANG/XIAO')
  })
  it('removes spaces', () => {
    expect(normalizeName('WANG / DA MING')).toBe('WANG/DAMING')
  })
  it('trims whitespace', () => {
    expect(normalizeName('  WANG/DAMING  ')).toBe('WANG/DAMING')
  })
})

describe('splitPassportName', () => {
  it('splits surname/givenname', () => {
    expect(splitPassportName('WANG/DAMING')).toEqual({ surname: 'WANG', givenName: 'DAMING' })
  })
  it('handles title suffix', () => {
    expect(splitPassportName('WANG/DAMING MR')).toEqual({ surname: 'WANG', givenName: 'DAMING' })
  })
  it('handles no slash', () => {
    expect(splitPassportName('WANGDAMING')).toEqual({ surname: 'WANGDAMING', givenName: '' })
  })
  it('handles lowercase', () => {
    expect(splitPassportName('wang/daming')).toEqual({ surname: 'WANG', givenName: 'DAMING' })
  })
  it('handles multiple slashes', () => {
    const result = splitPassportName('WANG/DA/MING')
    expect(result.surname).toBe('WANG')
    expect(result.givenName).toBe('DA/MING')
  })
})

describe('calculateSimilarity', () => {
  it('returns 100 for identical strings', () => {
    expect(calculateSimilarity('DAMING', 'DAMING')).toBe(100)
  })
  it('returns 100 for both empty', () => {
    expect(calculateSimilarity('', '')).toBe(100)
  })
  it('returns 0 when one is empty', () => {
    expect(calculateSimilarity('ABC', '')).toBe(0)
    expect(calculateSimilarity('', 'ABC')).toBe(0)
  })
  it('returns 0 for completely different strings', () => {
    expect(calculateSimilarity('AAAA', 'ZZZZ')).toBe(0)
  })
  it('returns high score for similar strings', () => {
    expect(calculateSimilarity('DAMING', 'DAMIN')).toBeGreaterThan(80)
  })
  it('returns moderate score for somewhat similar', () => {
    expect(calculateSimilarity('DAMING', 'DAMIG')).toBeGreaterThan(70)
  })
  it('handles single character strings', () => {
    // matchWindow = floor(max(1,1)/2) - 1 = -1, so no matches possible for len=1
    expect(calculateSimilarity('A', 'A')).toBe(0)
    expect(calculateSimilarity('A', 'B')).toBe(0)
  })
})

describe('findBestMatch', () => {
  const members = [
    { id: '1', chinese_name: '王大明', passport_name: 'WANG/DAMING MR' },
    { id: '2', chinese_name: '林美麗', passport_name: 'LIN/MEILI MRS' },
    { id: '3', chinese_name: '陳志遠', passport_name: 'CHEN/ZHIYUAN MR' },
  ]

  it('finds exact match', () => {
    const result = findBestMatch('WANG/DAMING MR', members)
    expect(result.confidence).toBe('exact')
    expect(result.member?.id).toBe('1')
    expect(result.score).toBe(100)
  })

  it('finds exact match case insensitive', () => {
    const result = findBestMatch('wang/daming mr', members)
    expect(result.confidence).toBe('exact')
    expect(result.member?.id).toBe('1')
  })

  it('finds partial match with similar given name', () => {
    const result = findBestMatch('WANG/DAMNG MR', members)
    expect(result.confidence).toBe('partial')
    expect(result.member?.id).toBe('1')
  })

  it('returns none for different surname', () => {
    const result = findBestMatch('ZHAO/DAMING MR', members)
    expect(result.confidence).toBe('none')
    expect(result.member).toBeNull()
  })

  it('returns none for no passport_name in members', () => {
    const noPassport = [{ id: '1', chinese_name: '王大明', passport_name: null }]
    const result = findBestMatch('WANG/DAMING', noPassport)
    expect(result.confidence).toBe('none')
  })

  it('returns none for empty members', () => {
    const result = findBestMatch('WANG/DAMING', [])
    expect(result.confidence).toBe('none')
    expect(result.member).toBeNull()
  })

  it('picks best match among multiple same surname', () => {
    const sameFamily = [
      { id: '1', chinese_name: '王大明', passport_name: 'WANG/DAMING MR' },
      { id: '2', chinese_name: '王大強', passport_name: 'WANG/DAQIANG MR' },
    ]
    const result = findBestMatch('WANG/DAMING', sameFamily)
    expect(result.member?.id).toBe('1')
  })
})
