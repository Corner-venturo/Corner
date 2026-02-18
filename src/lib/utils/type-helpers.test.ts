import { describe, it, expect } from 'vitest'
import { castArray, castOne, castOneOrNull, castJson, castJsonOr } from './type-helpers'

describe('castArray', () => {
  it('casts array data', () => {
    const data = [{ id: 1 }, { id: 2 }]
    const result = castArray<{ id: number }>(data)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
  })
  it('returns empty array for null', () => {
    expect(castArray(null)).toEqual([])
  })
  it('returns empty array for undefined', () => {
    expect(castArray(undefined)).toEqual([])
  })
  it('returns empty array for falsy', () => {
    expect(castArray(0)).toEqual([])
    expect(castArray('')).toEqual([])
  })
})

describe('castOne', () => {
  it('casts single item', () => {
    const data = { name: 'test' }
    const result = castOne<{ name: string }>(data)
    expect(result.name).toBe('test')
  })
})

describe('castOneOrNull', () => {
  it('returns data when present', () => {
    const result = castOneOrNull<{ id: number }>({ id: 1 })
    expect(result?.id).toBe(1)
  })
  it('returns null for null', () => {
    expect(castOneOrNull(null)).toBeNull()
  })
  it('returns null for undefined', () => {
    expect(castOneOrNull(undefined)).toBeNull()
  })
})

describe('castJson', () => {
  it('casts JSON data', () => {
    const json = { items: [1, 2, 3] }
    const result = castJson<{ items: number[] }>(json)
    expect(result.items).toHaveLength(3)
  })
})

describe('castJsonOr', () => {
  it('returns data when present', () => {
    const result = castJsonOr<number[]>([1, 2], [])
    expect(result).toEqual([1, 2])
  })
  it('returns default for null', () => {
    const result = castJsonOr<number[]>(null, [0])
    expect(result).toEqual([0])
  })
  it('returns default for undefined', () => {
    const result = castJsonOr<string>('', 'default')
    expect(result).toBe('')
  })
  it('uses default for nullish only', () => {
    expect(castJsonOr(0, 5)).toBe(0)
    expect(castJsonOr(null, 5)).toBe(5)
  })
})
