import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  estimateTravelTime,
  calculateTotalDistance,
  optimizeAttractionOrder,
  filterNearbyAttractions,
} from './geo-utils'
import type { Attraction } from '@/features/attractions/types'

const makeAttraction = (id: string, lat: number, lon: number): Attraction => ({
  id,
  name: id,
  latitude: lat,
  longitude: lon,
} as Attraction)

describe('calculateDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateDistance(25, 121, 25, 121)).toBe(0)
  })
  it('calculates Taipei to Kaohsiung ~300km', () => {
    const d = calculateDistance(25.033, 121.565, 22.627, 120.301)
    expect(d).toBeGreaterThan(280)
    expect(d).toBeLessThan(350)
  })
  it('calculates short distance', () => {
    // ~1km apart
    const d = calculateDistance(25.033, 121.565, 25.042, 121.565)
    expect(d).toBeGreaterThan(0.5)
    expect(d).toBeLessThan(2)
  })
  it('is symmetric', () => {
    const d1 = calculateDistance(25, 121, 22, 120)
    const d2 = calculateDistance(22, 120, 25, 121)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })
})

describe('estimateTravelTime', () => {
  it('returns min travel time for short distance', () => {
    const t = estimateTravelTime(0.1)
    expect(t).toBeGreaterThan(0)
  })
  it('returns reasonable time for 60km', () => {
    const t = estimateTravelTime(60)
    expect(t).toBeGreaterThan(30)
    expect(t).toBeLessThanOrEqual(180)
  })
  it('returns 0+ for zero distance', () => {
    const t = estimateTravelTime(0)
    expect(t).toBeGreaterThanOrEqual(0)
  })
})

describe('calculateTotalDistance', () => {
  it('returns 0 for empty list', () => {
    expect(calculateTotalDistance([])).toBe(0)
  })
  it('returns 0 for single attraction', () => {
    expect(calculateTotalDistance([makeAttraction('a', 25, 121)])).toBe(0)
  })
  it('calculates total for multiple attractions', () => {
    const attractions = [
      makeAttraction('a', 25.0, 121.0),
      makeAttraction('b', 25.1, 121.1),
      makeAttraction('c', 25.2, 121.2),
    ]
    const total = calculateTotalDistance(attractions)
    expect(total).toBeGreaterThan(0)
  })
  it('skips attractions without coordinates', () => {
    const attractions = [
      makeAttraction('a', 25.0, 121.0),
      { id: 'b', name: 'b' } as Attraction,
      makeAttraction('c', 25.1, 121.1),
    ]
    const total = calculateTotalDistance(attractions)
    expect(total).toBe(0) // can't calculate b→c since b has no coords
  })
})

describe('optimizeAttractionOrder', () => {
  it('returns empty for empty input', () => {
    expect(optimizeAttractionOrder([])).toEqual([])
  })
  it('returns single item unchanged', () => {
    const a = [makeAttraction('a', 25, 121)]
    expect(optimizeAttractionOrder(a)).toHaveLength(1)
  })
  it('reorders to minimize distance', () => {
    const attractions = [
      makeAttraction('far', 26.0, 122.0),
      makeAttraction('near', 25.01, 121.01),
      makeAttraction('mid', 25.5, 121.5),
    ]
    const result = optimizeAttractionOrder(attractions, 25.0, 121.0)
    expect(result[0].id).toBe('near')
  })
  it('handles attractions without coords', () => {
    const attractions = [
      { id: 'nocoord', name: 'no' } as Attraction,
      makeAttraction('a', 25, 121),
    ]
    const result = optimizeAttractionOrder(attractions)
    expect(result).toHaveLength(1) // only valid ones
  })
})

describe('filterNearbyAttractions', () => {
  it('filters by radius', () => {
    const attractions = [
      makeAttraction('near', 25.01, 121.01),
      makeAttraction('far', 30.0, 130.0),
    ]
    const result = filterNearbyAttractions(25.0, 121.0, attractions, 10)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('near')
  })
  it('returns empty for no matches', () => {
    const attractions = [makeAttraction('far', 30, 130)]
    expect(filterNearbyAttractions(25, 121, attractions, 1)).toHaveLength(0)
  })
  it('sorts by distance', () => {
    const attractions = [
      makeAttraction('b', 25.05, 121.05),
      makeAttraction('a', 25.01, 121.01),
    ]
    const result = filterNearbyAttractions(25.0, 121.0, attractions, 50)
    expect(result[0].id).toBe('a')
  })
  it('skips attractions without coords', () => {
    const attractions = [{ id: 'x', name: 'x' } as Attraction]
    expect(filterNearbyAttractions(25, 121, attractions, 100)).toHaveLength(0)
  })
})
