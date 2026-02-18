/**
 * Customer Entity Zod Schemas
 */

import { z } from 'zod'

const memberTypeSchema = z.enum(['potential', 'member', 'vip'])
const vipLevelSchema = z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond'])
const customerSourceSchema = z.enum(['website', 'facebook', 'instagram', 'line', 'referral', 'phone', 'walk_in', 'other'])
const verificationStatusSchema = z.enum(['verified', 'unverified', 'rejected'])

export const createCustomerSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, '姓名為必填').max(100, '姓名不得超過 100 字'),
  english_name: z.string().max(200).optional(),
  nickname: z.string().max(50).optional(),
  phone: z.string().min(1, '電話為必填'),
  alternative_phone: z.string().optional(),
  email: z.string().email('Email 格式錯誤').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  national_id: z.string().optional(),
  passport_number: z.string().optional(),
  passport_name: z.string().optional(),
  passport_name_print: z.string().nullish(),
  passport_expiry: z.string().optional(),
  passport_image_url: z.string().url().nullish(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  company: z.string().optional(),
  tax_id: z.string().optional(),
  member_type: memberTypeSchema.optional(),
  is_vip: z.boolean(),
  vip_level: vipLevelSchema.optional(),
  source: customerSourceSchema.optional(),
  referred_by: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
  total_spent: z.number().min(0).optional(),
  total_orders: z.number().int().min(0).optional(),
  verification_status: verificationStatusSchema.optional(),
  dietary_restrictions: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  english_name: z.string().max(200).nullish(),
  nickname: z.string().max(50).nullish(),
  phone: z.string().nullish(),
  alternative_phone: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  address: z.string().nullish(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  national_id: z.string().nullish(),
  passport_number: z.string().nullish(),
  passport_name: z.string().nullish(),
  passport_name_print: z.string().nullish(),
  passport_expiry: z.string().nullish(),
  passport_image_url: z.string().url().nullish(),
  birth_date: z.string().nullish(),
  gender: z.string().nullish(),
  company: z.string().nullish(),
  tax_id: z.string().nullish(),
  member_type: memberTypeSchema.optional(),
  is_vip: z.boolean().nullish(),
  vip_level: vipLevelSchema.or(z.string()).nullish(),
  source: customerSourceSchema.or(z.string()).nullish(),
  referred_by: z.string().nullish(),
  notes: z.string().nullish(),
  is_active: z.boolean().nullish(),
  total_spent: z.number().min(0).optional(),
  total_orders: z.number().int().min(0).optional(),
  verification_status: verificationStatusSchema.optional(),
  dietary_restrictions: z.string().nullish(),
}).passthrough()

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
