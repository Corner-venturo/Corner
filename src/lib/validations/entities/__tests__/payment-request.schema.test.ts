import { describe, it, expect } from 'vitest'
import { createPaymentRequestSchema, updatePaymentRequestSchema } from '../payment-request.schema'

describe('createPaymentRequestSchema', () => {
  const validRequest = {
    request_number: 'PR000001',
    request_date: '2026-03-01',
    request_type: '員工代墊',
    amount: 5000,
  }

  it('should accept valid payment request', () => {
    expect(createPaymentRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('should reject amount <= 0', () => {
    expect(createPaymentRequestSchema.safeParse({ ...validRequest, amount: 0 }).success).toBe(false)
    expect(createPaymentRequestSchema.safeParse({ ...validRequest, amount: -1 }).success).toBe(false)
  })

  it('should reject empty request_number', () => {
    expect(createPaymentRequestSchema.safeParse({ ...validRequest, request_number: '' }).success).toBe(false)
  })

  it('should reject empty request_type', () => {
    expect(createPaymentRequestSchema.safeParse({ ...validRequest, request_type: '' }).success).toBe(false)
  })

  it('should accept optional tour fields', () => {
    const result = createPaymentRequestSchema.safeParse({
      ...validRequest,
      tour_id: '550e8400-e29b-41d4-a716-446655440000',
      tour_code: 'T000001',
      tour_name: '東京五日遊',
      request_category: 'tour',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid request_category', () => {
    expect(createPaymentRequestSchema.safeParse({ ...validRequest, request_category: 'bad' }).success).toBe(false)
  })
})

describe('updatePaymentRequestSchema', () => {
  it('should accept partial update', () => {
    expect(updatePaymentRequestSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('should accept empty object', () => {
    expect(updatePaymentRequestSchema.safeParse({}).success).toBe(true)
  })

  it('should reject invalid status', () => {
    expect(updatePaymentRequestSchema.safeParse({ status: 'bad' }).success).toBe(false)
  })
})
