/**
 * PaymentRequest Entity Zod Schemas
 */

import { z } from 'zod'

const paymentRequestCategorySchema = z.enum(['tour', 'company'])
const paymentRequestStatusSchema = z.enum(['pending', 'approved', 'paid'])

export const createPaymentRequestSchema = z.object({
  code: z.string().optional(),
  request_number: z.string().min(1, '請款單號為必填'),
  order_id: z.string().uuid().nullish(),
  order_number: z.string().nullish(),
  tour_id: z.string().uuid().nullish(),
  tour_code: z.string().nullish(),
  tour_name: z.string().nullish(),
  request_date: z.string().min(1, '請款日期為必填'),
  request_type: z.string().min(1, '請款類型為必填'),
  request_category: paymentRequestCategorySchema.optional(),
  expense_type: z.string().nullish(),
  amount: z.number().positive('金額必須大於 0'),
  supplier_id: z.string().uuid().nullish(),
  supplier_name: z.string().nullish(),
  status: paymentRequestStatusSchema.nullish(),
  is_special_billing: z.boolean().nullish(),
  batch_id: z.string().nullish(),
  notes: z.string().nullish(),
  created_by: z.string().uuid().nullish(),
  created_by_name: z.string().nullish(),
  workspace_id: z.string().uuid().optional(),
})

export const updatePaymentRequestSchema = z.object({
  request_date: z.string().min(1).optional(),
  request_type: z.string().min(1).optional(),
  request_category: paymentRequestCategorySchema.optional(),
  amount: z.number().positive().optional(),
  supplier_id: z.string().uuid().nullish(),
  supplier_name: z.string().nullish(),
  status: paymentRequestStatusSchema.nullish(),
  is_special_billing: z.boolean().nullish(),
  notes: z.string().nullish(),
  approved_at: z.string().nullish(),
  approved_by: z.string().nullish(),
  paid_at: z.string().nullish(),
  paid_by: z.string().nullish(),
}).passthrough()

export type CreatePaymentRequestInput = z.infer<typeof createPaymentRequestSchema>
export type UpdatePaymentRequestInput = z.infer<typeof updatePaymentRequestSchema>
