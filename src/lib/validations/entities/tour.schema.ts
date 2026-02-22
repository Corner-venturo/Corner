/**
 * Tour Entity Zod Schemas
 * Defense-in-depth validation for store-level data
 */

import { z } from 'zod'

// Tour statuses
const tourStatusSchema = z.enum(['開團', '待出發', '已結團', '取消'])
const contractStatusSchema = z.enum(['pending', 'partial', 'signed'])

/**
 * Schema for creating a tour
 */
export const createTourSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, '團名為必填').max(200, '團名不得超過 200 字'),
  location: z.string().min(1, '地點為必填'),
  departure_date: z.string().min(1, '出發日期為必填'),
  return_date: z.string().min(1, '回程日期為必填'),
  status: tourStatusSchema,
  price: z.number().min(0, '價格不得為負數'),
  max_participants: z.number().int().min(1, '人數上限至少為 1'),
  contract_status: contractStatusSchema,
  total_revenue: z.number().min(0),
  total_cost: z.number().min(0),
  profit: z.number(),
  quote_id: z.string().uuid().optional(),
  quote_cost_structure: z.unknown().optional(),
}).refine(
  (data) => new Date(data.departure_date) <= new Date(data.return_date),
  { message: '回程日期不可早於出發日期', path: ['return_date'] }
)

/**
 * Schema for updating a tour (all fields optional)
 */
export const updateTourSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).optional(),
  departure_date: z.string().min(1).optional(),
  return_date: z.string().min(1).optional(),
  status: tourStatusSchema.optional(),
  price: z.number().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  contract_status: contractStatusSchema.optional(),
  total_revenue: z.number().min(0).optional(),
  total_cost: z.number().min(0).optional(),
  profit: z.number().optional(),
  quote_id: z.string().uuid().optional(),
  quote_cost_structure: z.unknown().optional(),
}).passthrough()

export type CreateTourInput = z.infer<typeof createTourSchema>
export type UpdateTourInput = z.infer<typeof updateTourSchema>
