import { describe, it, expect } from 'vitest'
import { createOrderSchema, updateOrderSchema } from '../order.schema'

describe('createOrderSchema', () => {
  const validOrder = {
    code: 'O000001',
    tour_id: '550e8400-e29b-41d4-a716-446655440000',
    customer_id: '550e8400-e29b-41d4-a716-446655440001',
    contact_person: '王小明',
    contact_phone: '0912345678',
    status: 'pending' as const,
    payment_status: 'unpaid' as const,
    total_amount: 70000,
    paid_amount: 0,
    number_of_people: 2,
    adult_count: 2,
    child_count: 0,
    infant_count: 0,
    is_active: true,
  }

  it('should accept valid order data', () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true)
  })

  it('should reject missing contact_person', () => {
    const { contact_person, ...rest } = validOrder
    expect(createOrderSchema.safeParse(rest).success).toBe(false)
  })

  it('should reject negative total_amount', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, total_amount: -1 }).success).toBe(false)
  })

  it('should reject invalid tour_id', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, tour_id: 'bad' }).success).toBe(false)
  })

  it('should reject number_of_people less than 1', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, number_of_people: 0 }).success).toBe(false)
  })

  it('should reject invalid status', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, status: 'unknown' }).success).toBe(false)
  })

  it('should reject invalid payment_status', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, payment_status: 'half' }).success).toBe(false)
  })
})

describe('updateOrderSchema', () => {
  it('should accept partial update', () => {
    expect(updateOrderSchema.safeParse({ status: 'confirmed' }).success).toBe(true)
  })

  it('should accept empty object', () => {
    expect(updateOrderSchema.safeParse({}).success).toBe(true)
  })

  it('should reject invalid status in update', () => {
    expect(updateOrderSchema.safeParse({ status: 'bad' }).success).toBe(false)
  })
})
