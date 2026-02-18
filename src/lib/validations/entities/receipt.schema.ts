/**
 * Receipt Entity Zod Schemas
 */

import { z } from 'zod'

// ReceiptType is enum 0-4, ReceiptStatus is enum 0-1
const receiptTypeSchema = z.number().int().min(0).max(4)
const receiptStatusSchema = z.number().int().min(0).max(1)

export const createReceiptSchema = z.object({
  workspace_id: z.string().uuid('無效的 workspace ID'),
  order_id: z.string().uuid('無效的訂單 ID'),
  tour_id: z.string().uuid().optional(),
  order_number: z.string().min(1, '訂單編號為必填'),
  tour_name: z.string().optional(),
  receipt_date: z.string().min(1, '收款日期為必填'),
  receipt_type: receiptTypeSchema,
  receipt_amount: z.number().positive('收款金額必須大於 0'),
  actual_amount: z.number().min(0).optional(),
  status: receiptStatusSchema.optional(),

  // Payment method fields
  receipt_account: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  payment_name: z.string().optional(),
  pay_dateline: z.string().optional(),
  handler_name: z.string().optional(),
  account_info: z.string().optional(),
  fees: z.number().min(0).optional(),
  card_last_four: z.string().max(4).optional(),
  auth_code: z.string().optional(),
  check_number: z.string().optional(),
  check_bank: z.string().optional(),
  notes: z.string().optional(),
})

export const updateReceiptSchema = z.object({
  actual_amount: z.number().min(0).optional(),
  status: receiptStatusSchema.optional(),
  notes: z.string().optional(),
}).passthrough()

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>
