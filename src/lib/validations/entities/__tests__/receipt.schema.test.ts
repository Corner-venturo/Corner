import { describe, it, expect } from 'vitest'
import { createReceiptSchema, updateReceiptSchema } from '../receipt.schema'

describe('createReceiptSchema', () => {
  const validReceipt = {
    workspace_id: '550e8400-e29b-41d4-a716-446655440000',
    order_id: '550e8400-e29b-41d4-a716-446655440001',
    order_number: 'O000001',
    receipt_date: '2026-03-01',
    receipt_type: 0, // BANK_TRANSFER
    receipt_amount: 35000,
  }

  it('should accept valid receipt data', () => {
    expect(createReceiptSchema.safeParse(validReceipt).success).toBe(true)
  })

  it('should reject receipt_amount <= 0', () => {
    expect(createReceiptSchema.safeParse({ ...validReceipt, receipt_amount: 0 }).success).toBe(false)
    expect(createReceiptSchema.safeParse({ ...validReceipt, receipt_amount: -1 }).success).toBe(false)
  })

  it('should reject invalid receipt_type', () => {
    expect(createReceiptSchema.safeParse({ ...validReceipt, receipt_type: 5 }).success).toBe(false)
    expect(createReceiptSchema.safeParse({ ...validReceipt, receipt_type: -1 }).success).toBe(false)
  })

  it('should reject invalid workspace_id', () => {
    expect(createReceiptSchema.safeParse({ ...validReceipt, workspace_id: 'bad' }).success).toBe(false)
  })

  it('should accept optional fields', () => {
    const result = createReceiptSchema.safeParse({
      ...validReceipt,
      tour_id: '550e8400-e29b-41d4-a716-446655440002',
      card_last_four: '1234',
      notes: 'test',
    })
    expect(result.success).toBe(true)
  })

  it('should reject card_last_four over 4 chars', () => {
    expect(createReceiptSchema.safeParse({ ...validReceipt, card_last_four: '12345' }).success).toBe(false)
  })
})

describe('updateReceiptSchema', () => {
  it('should accept partial update', () => {
    expect(updateReceiptSchema.safeParse({ status: 1, actual_amount: 34500 }).success).toBe(true)
  })

  it('should accept empty object', () => {
    expect(updateReceiptSchema.safeParse({}).success).toBe(true)
  })
})
