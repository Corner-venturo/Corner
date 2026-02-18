import { describe, it, expect } from 'vitest'
import { calculateTierPricingCosts } from './calculateTierPricing'
import type { CostCategory, ParticipantCounts } from '../types'

const makeCounts = (adult: number, cwb = 0, cnb = 0, sr = 0, infant = 0): ParticipantCounts => ({
  adult, child_with_bed: cwb, child_no_bed: cnb, single_room: sr, infant,
})

describe('calculateTierPricingCosts', () => {
  it('returns zero costs with empty categories', () => {
    const result = calculateTierPricingCosts([], makeCounts(10), makeCounts(10))
    expect(result).toEqual({ adult: 0, child_with_bed: 0, child_no_bed: 0, single_room: 0, infant: 0 })
  })

  it('calculates accommodation costs from first room type per day', () => {
    const categories: CostCategory[] = [{
      id: 'accommodation', name: '住宿', total: 10000,
      items: [
        { id: '1', name: '雙人房', quantity: 2, unit_price: 3000, total: 1500, day: 1 },
        { id: '2', name: '三人房', quantity: 3, unit_price: 2000, total: 1000, day: 1 },
        { id: '3', name: '雙人房', quantity: 2, unit_price: 4000, total: 2000, day: 2 },
      ],
    }]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    // Day1 first room: total=1500, unit_price=3000; Day2 first room: total=2000, unit_price=4000
    expect(result.adult).toBe(3500) // 1500+2000
    expect(result.child_with_bed).toBe(3500)
    expect(result.single_room).toBe(7000) // 3000+4000
  })

  it('calculates transport costs by identity', () => {
    const categories: CostCategory[] = [{
      id: 'transport', name: '交通', total: 5000,
      items: [
        { id: '1', name: '成人', quantity: 1, unit_price: null, total: 0, adult_price: 2000 },
        { id: '2', name: '兒童', quantity: 1, unit_price: null, total: 0, child_price: 1000 },
        { id: '3', name: '嬰兒', quantity: 1, unit_price: null, total: 0, infant_price: 500 },
      ],
    }]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    expect(result.adult).toBe(2000)
    expect(result.single_room).toBe(2000)
    expect(result.child_with_bed).toBe(1000)
    expect(result.child_no_bed).toBe(1000)
    expect(result.infant).toBe(500)
  })

  it('calculates transport with uniform pricing', () => {
    const categories: CostCategory[] = [{
      id: 'transport', name: '交通', total: 1000,
      items: [{ id: '1', name: '接送', quantity: 1, unit_price: 500, total: 500 }],
    }]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    expect(result.adult).toBe(500)
    expect(result.child_with_bed).toBe(500)
    expect(result.single_room).toBe(500)
  })

  it('calculates meals/activities/others for all non-infant identities', () => {
    const categories: CostCategory[] = [{
      id: 'meals', name: '餐飲', total: 3000,
      items: [{ id: '1', name: '午餐', quantity: 1, unit_price: 300, total: 300 }],
    }]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    expect(result.adult).toBe(300)
    expect(result.child_with_bed).toBe(300)
    expect(result.child_no_bed).toBe(300)
    expect(result.single_room).toBe(300)
    expect(result.infant).toBe(0)
  })

  it('recalculates group-transport costs with new participant count', () => {
    const categories: CostCategory[] = [{
      id: 'group-transport', name: '團體交通', total: 1000,
      items: [{ id: '1', name: '遊覽車', quantity: 1, unit_price: null, total: 1000 }],
    }]
    // original: 10 people, each pays 1000 → total cost = 10000
    // new: 20 people → each pays 500
    const result = calculateTierPricingCosts(categories, makeCounts(20), makeCounts(10))
    expect(result.adult).toBe(500)
    expect(result.child_no_bed).toBe(500)
  })

  it('recalculates guide costs with new participant count', () => {
    const categories: CostCategory[] = [{
      id: 'guide', name: '導遊', total: 500,
      items: [{ id: '1', name: '導遊費', quantity: 1, unit_price: null, total: 500 }],
    }]
    // original: 10, total=5000; new: 5, per person=1000
    const result = calculateTierPricingCosts(categories, makeCounts(5), makeCounts(10))
    expect(result.adult).toBe(1000)
  })

  it('handles zero new participants for group costs', () => {
    const categories: CostCategory[] = [{
      id: 'group-transport', name: '團體交通', total: 1000,
      items: [{ id: '1', name: '遊覽車', quantity: 1, unit_price: null, total: 1000 }],
    }]
    const result = calculateTierPricingCosts(categories, makeCounts(0), makeCounts(10))
    expect(result.adult).toBe(0)
  })

  it('combines multiple categories correctly', () => {
    const categories: CostCategory[] = [
      { id: 'meals', name: '餐飲', total: 200, items: [{ id: '1', name: '午餐', quantity: 1, unit_price: 200, total: 200 }] },
      { id: 'activities', name: '活動', total: 300, items: [{ id: '2', name: '潛水', quantity: 1, unit_price: 300, total: 300 }] },
    ]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    expect(result.adult).toBe(500)
    expect(result.child_no_bed).toBe(500)
  })

  it('handles accommodation with no items', () => {
    const categories: CostCategory[] = [{ id: 'accommodation', name: '住宿', total: 0, items: [] }]
    const result = calculateTierPricingCosts(categories, makeCounts(10), makeCounts(10))
    expect(result.adult).toBe(0)
  })
})
