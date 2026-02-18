import { describe, it, expect } from 'vitest'
import { createCustomerSchema, updateCustomerSchema } from '../customer.schema'

describe('createCustomerSchema', () => {
  const validCustomer = {
    name: '王小明',
    phone: '0912345678',
    is_vip: false,
    is_active: true,
  }

  it('should accept valid customer data', () => {
    expect(createCustomerSchema.safeParse(validCustomer).success).toBe(true)
  })

  it('should reject empty name', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, name: '' }).success).toBe(false)
  })

  it('should reject name over 100 chars', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('should reject empty phone', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, phone: '' }).success).toBe(false)
  })

  it('should reject invalid email', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, email: 'not-email' }).success).toBe(false)
  })

  it('should accept valid email', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, email: 'test@example.com' }).success).toBe(true)
  })

  it('should accept empty string email', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, email: '' }).success).toBe(true)
  })

  it('should accept valid member_type', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, member_type: 'vip' }).success).toBe(true)
  })

  it('should reject invalid member_type', () => {
    expect(createCustomerSchema.safeParse({ ...validCustomer, member_type: 'premium' }).success).toBe(false)
  })

  it('should accept all vip levels', () => {
    for (const level of ['bronze', 'silver', 'gold', 'platinum', 'diamond']) {
      expect(createCustomerSchema.safeParse({ ...validCustomer, is_vip: true, vip_level: level }).success).toBe(true)
    }
  })

  it('should accept all customer sources', () => {
    for (const source of ['website', 'facebook', 'instagram', 'line', 'referral', 'phone', 'walk_in', 'other']) {
      expect(createCustomerSchema.safeParse({ ...validCustomer, source }).success).toBe(true)
    }
  })
})

describe('updateCustomerSchema', () => {
  it('should accept partial update', () => {
    expect(updateCustomerSchema.safeParse({ name: '新名字' }).success).toBe(true)
  })

  it('should accept empty object', () => {
    expect(updateCustomerSchema.safeParse({}).success).toBe(true)
  })

  it('should pass through extra fields', () => {
    expect(updateCustomerSchema.safeParse({ last_order_date: '2026-01-01' }).success).toBe(true)
  })

  it('should reject invalid name if provided', () => {
    expect(updateCustomerSchema.safeParse({ name: '' }).success).toBe(false)
  })
})
