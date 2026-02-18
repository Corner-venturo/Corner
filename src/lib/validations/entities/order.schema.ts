/**
 * Order Entity Zod Schemas
 */

import { z } from 'zod'

const orderStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled'])
const paymentStatusSchema = z.enum(['unpaid', 'partial', 'paid', 'refunded'])

export const createOrderSchema = z.object({
  code: z.string().min(1, '訂單編號為必填'),
  tour_id: z.string().uuid('無效的旅遊團 ID'),
  customer_id: z.string().uuid('無效的客戶 ID'),
  contact_person: z.string().min(1, '聯絡人為必填'),
  contact_phone: z.string().min(1, '聯絡電話為必填'),
  contact_email: z.string().email('Email 格式錯誤').optional().or(z.literal('')),
  status: orderStatusSchema,
  payment_status: paymentStatusSchema,
  total_amount: z.number().min(0, '總金額不得為負數'),
  paid_amount: z.number().min(0, '已付金額不得為負數'),
  number_of_people: z.number().int().min(1, '人數至少為 1'),
  adult_count: z.number().int().min(0),
  child_count: z.number().int().min(0),
  infant_count: z.number().int().min(0),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
  is_active: z.boolean(),
})

export const updateOrderSchema = z.object({
  contact_person: z.string().min(1).optional(),
  contact_phone: z.string().min(1).optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  status: orderStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  total_amount: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
  number_of_people: z.number().int().min(1).optional(),
  adult_count: z.number().int().min(0).optional(),
  child_count: z.number().int().min(0).optional(),
  infant_count: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
  is_active: z.boolean().optional(),
}).passthrough()

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
