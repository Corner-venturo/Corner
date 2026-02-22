import { describe, it, expect } from 'vitest'
import { createTourSchema, updateTourSchema } from '../tour.schema'

describe('createTourSchema', () => {
  const validTour = {
    name: '東京五日遊',
    location: '日本東京',
    departure_date: '2026-03-01',
    return_date: '2026-03-05',
    status: '開團' as const,
    price: 35000,
    max_participants: 30,
    contract_status: 'pending' as const,
    total_revenue: 0,
    total_cost: 0,
    profit: 0,
  }

  it('should accept valid tour data', () => {
    const result = createTourSchema.safeParse(validTour)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createTourSchema.safeParse({ ...validTour, name: '' })
    expect(result.success).toBe(false)
  })

  it('should reject name over 200 chars', () => {
    const result = createTourSchema.safeParse({ ...validTour, name: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('should reject negative price', () => {
    const result = createTourSchema.safeParse({ ...validTour, price: -100 })
    expect(result.success).toBe(false)
  })

  it('should reject max_participants less than 1', () => {
    const result = createTourSchema.safeParse({ ...validTour, max_participants: 0 })
    expect(result.success).toBe(false)
  })

  it('should reject invalid status', () => {
    const result = createTourSchema.safeParse({ ...validTour, status: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should reject return_date before departure_date', () => {
    const result = createTourSchema.safeParse({
      ...validTour,
      departure_date: '2026-03-05',
      return_date: '2026-03-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('return_date')
    }
  })

  it('should accept optional quote_id as valid UUID', () => {
    const result = createTourSchema.safeParse({
      ...validTour,
      quote_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid quote_id', () => {
    const result = createTourSchema.safeParse({
      ...validTour,
      quote_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateTourSchema', () => {
  it('should accept partial data', () => {
    const result = updateTourSchema.safeParse({ name: '更新團名' })
    expect(result.success).toBe(true)
  })

  it('should accept empty object', () => {
    const result = updateTourSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const result = updateTourSchema.safeParse({ status: 'bad' })
    expect(result.success).toBe(false)
  })

  it('should pass through extra fields', () => {
    const result = updateTourSchema.safeParse({ closing_status: 'closed' })
    expect(result.success).toBe(true)
  })
})
