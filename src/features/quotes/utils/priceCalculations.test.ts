import { describe, it, expect } from 'vitest'
import {
  normalizeNumber,
  calculateProfit,
  calculateIdentityProfits,
  getRoomTypeCost,
  getRoomTypeProfit,
  calculateTierParticipantCounts,
  generateUniqueId,
} from './priceCalculations'
import type {
  SellingPrices,
  IdentityCosts,
  AccommodationSummaryItem,
} from '../types'

describe('normalizeNumber', () => {
  it('converts full-width digits to half-width', () => {
    expect(normalizeNumber('０１２３４５６７８９')).toBe('0123456789')
  })

  it('leaves half-width digits unchanged', () => {
    expect(normalizeNumber('12345')).toBe('12345')
  })

  it('handles mixed content', () => {
    expect(normalizeNumber('NT$１，０００')).toBe('NT$1，000')
  })

  it('handles empty string', () => {
    expect(normalizeNumber('')).toBe('')
  })
})

describe('calculateProfit', () => {
  it('returns positive profit', () => {
    expect(calculateProfit(1000, 600)).toBe(400)
  })

  it('returns negative profit (loss)', () => {
    expect(calculateProfit(500, 800)).toBe(-300)
  })

  it('returns zero when equal', () => {
    expect(calculateProfit(1000, 1000)).toBe(0)
  })
})

describe('calculateIdentityProfits', () => {
  it('calculates profits for all identities', () => {
    const selling: SellingPrices = { adult: 1000, child_with_bed: 800, child_no_bed: 600, single_room: 1200, infant: 100 }
    const costs: IdentityCosts = { adult: 700, child_with_bed: 500, child_no_bed: 400, single_room: 900, infant: 50 }
    const result = calculateIdentityProfits(selling, costs)
    expect(result).toEqual({ adult: 300, child_with_bed: 300, child_no_bed: 200, single_room: 300, infant: 50 })
  })

  it('handles zero costs', () => {
    const selling: SellingPrices = { adult: 1000, child_with_bed: 800, child_no_bed: 600, single_room: 1200, infant: 100 }
    const costs: IdentityCosts = { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 }
    const result = calculateIdentityProfits(selling, costs)
    expect(result).toEqual({ adult: 1000, child_with_bed: 800, child_no_bed: 600, single_room: 1200, infant: 100 })
  })
})

describe('getRoomTypeCost', () => {
  const accommodationSummary: AccommodationSummaryItem[] = [
    { name: '雙人房', total_cost: 5000, averageCost: 2500, days: 2, capacity: 2 },
    { name: '三人房', total_cost: 6000, averageCost: 2000, days: 2, capacity: 3 },
  ]
  const identityCosts: IdentityCosts = { adult: 10000, child_with_bed: 8000, child_no_bed: 6000, single_room: 12000, infant: 500 }

  it('returns base cost for first room type', () => {
    const cost = getRoomTypeCost('雙人房', 'adult', accommodationSummary, identityCosts)
    // baseCost=10000, firstRoomCost=ceil(5000)=5000, targetRoomCost=ceil(5000)=5000
    // 10000 - 5000 + 5000 = 10000
    expect(cost).toBe(10000)
  })

  it('adjusts cost for different room type', () => {
    const cost = getRoomTypeCost('三人房', 'adult', accommodationSummary, identityCosts)
    // baseCost=10000, firstRoomCost=5000, targetRoomCost=ceil(6000)=6000
    // 10000 - 5000 + 6000 = 11000
    expect(cost).toBe(11000)
  })

  it('uses child_with_bed for child type', () => {
    const cost = getRoomTypeCost('三人房', 'child', accommodationSummary, identityCosts)
    // baseCost=8000, firstRoomCost=5000, targetRoomCost=6000
    expect(cost).toBe(9000)
  })

  it('returns 0 for non-existent room', () => {
    expect(getRoomTypeCost('不存在', 'adult', accommodationSummary, identityCosts)).toBe(0)
  })
})

describe('getRoomTypeProfit', () => {
  const accommodationSummary: AccommodationSummaryItem[] = [
    { name: '雙人房', total_cost: 5000, averageCost: 2500, days: 2, capacity: 2 },
  ]
  const identityCosts: IdentityCosts = { adult: 10000, child_with_bed: 8000, child_no_bed: 6000, single_room: 12000, infant: 500 }
  const sellingPrices: SellingPrices = {
    adult: 15000, child_with_bed: 12000, child_no_bed: 9000, single_room: 18000, infant: 1000,
    room_types: { '雙人房': { adult: 15000, child: 12000 } },
  }

  it('calculates profit for room type', () => {
    const profit = getRoomTypeProfit('雙人房', 'adult', sellingPrices, accommodationSummary, identityCosts)
    // cost=10000, price=15000, profit=5000
    expect(profit).toBe(5000)
  })

  it('returns negative when no selling price set', () => {
    const profit = getRoomTypeProfit('不存在', 'adult', sellingPrices, accommodationSummary, identityCosts)
    // cost=0, price=0, profit=0
    expect(profit).toBe(0)
  })
})

describe('calculateTierParticipantCounts', () => {
  const original = { adult: 10, child_with_bed: 2, child_no_bed: 1, single_room: 2, infant: 1 }

  it('scales up proportionally', () => {
    const result = calculateTierParticipantCounts(30, original)
    // total=15, ratio=2
    expect(result.adult).toBe(20)
    expect(result.child_with_bed).toBe(4)
    expect(result.child_no_bed).toBe(2)
    expect(result.single_room).toBe(4)
  })

  it('scales down proportionally', () => {
    const result = calculateTierParticipantCounts(15, original)
    expect(result.adult).toBe(10)
  })

  it('handles zero original total', () => {
    const zeroCounts = { adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 }
    const result = calculateTierParticipantCounts(10, zeroCounts)
    expect(result.adult).toBe(0)
  })
})

describe('generateUniqueId', () => {
  it('returns a string', () => {
    expect(typeof generateUniqueId()).toBe('string')
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUniqueId()))
    expect(ids.size).toBe(100)
  })
})
