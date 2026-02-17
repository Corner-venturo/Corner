/**
 * API Route Zod Schemas
 * 
 * 集中管理 API 輸入驗證 schema，確保前後端一致
 */

import { z } from 'zod'

// ==========================================
// 會計模組
// ==========================================

export const reverseVoucherSchema = z.object({
  voucher_id: z.string().min(1, '缺少傳票 ID'),
  reason: z.string().min(1, '請填寫反沖原因'),
})

// ==========================================
// 認證模組
// ==========================================

export const changePasswordSchema = z.object({
  employee_number: z.string().min(1, '缺少員工編號'),
  workspace_code: z.string().optional(),
  current_password: z.string().min(1, '請輸入目前密碼'),
  new_password: z.string().min(8, '密碼至少需要 8 個字元'),
})

// ==========================================
// 發票模組
// ==========================================

const buyerInfoSchema = z.object({
  buyerName: z.string().min(1, '買受人名稱為必填'),
  buyerUBN: z.string().optional(),
  buyerEmail: z.string().email('Email 格式錯誤').optional().or(z.literal('')),
  buyerMobile: z.string().optional(),
  buyerAddress: z.string().optional(),
  carrierType: z.string().optional(),
  carrierNum: z.string().optional(),
  loveCode: z.string().optional(),
})

const invoiceItemSchema = z.object({
  item_name: z.string().min(1, '品項名稱為必填'),
  item_count: z.number().positive('數量必須大於 0'),
  item_unit: z.string(),
  item_price: z.number().min(0, '單價不可為負數'),
  itemAmt: z.number().min(0, '金額不可為負數'),
  itemTaxType: z.string().optional(),
  itemWord: z.string().optional(),
})

export const issueInvoiceSchema = z.object({
  invoice_date: z.string().min(1, '缺少發票日期'),
  total_amount: z.number().positive('金額必須大於 0'),
  tax_type: z.string().optional(),
  buyerInfo: buyerInfoSchema,
  items: z.array(invoiceItemSchema).min(1, '至少需要一個品項'),
  order_id: z.string().optional(),
  orders: z.array(z.object({
    order_id: z.string(),
    amount: z.number(),
  })).optional(),
  tour_id: z.string().min(1, '缺少團別 ID'),
  created_by: z.string().nullish(),
  workspace_id: z.string().nullish(),
})

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().min(1, '缺少發票 ID'),
  voidReason: z.string().min(1, '請填寫作廢原因'),
  operatedBy: z.string().optional(),
})

export const batchIssueInvoiceSchema = z.object({
  tour_id: z.string().min(1, '缺少團別 ID'),
  order_ids: z.array(z.string()).min(1, '至少選擇一筆訂單'),
  invoice_date: z.string().min(1, '缺少發票日期'),
  buyerInfo: buyerInfoSchema,
  created_by: z.string().nullish(),
  workspace_id: z.string().nullish(),
})

// ==========================================
// LinkPay
// ==========================================

export const createLinkPaySchema = z.object({
  receipt_number: z.string().min(1, '缺少收款單號'),
  user_name: z.string().min(1, '缺少付款人姓名'),
  email: z.string().email('Email 格式錯誤'),
  payment_name: z.string().min(1, '缺少付款名稱'),
  create_user: z.string().optional(),
  amount: z.number().positive('金額必須大於 0'),
  end_date: z.string().min(1, '缺少付款期限'),
  gender: z.string().optional(),
})

// ==========================================
// 提案轉團
// ==========================================

export const convertToTourSchema = z.object({
  proposal_id: z.string().min(1, '缺少提案 ID'),
  version_id: z.string().min(1, '缺少版本 ID'),
  workspace_id: z.string().min(1, '缺少工作區 ID'),
})

// ==========================================
// Bot 通知
// ==========================================

export const botNotificationSchema = z.object({
  recipient_id: z.string().min(1, '缺少收件人 ID'),
  message: z.string().min(1, '訊息不能為空'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ==========================================
// 行程生成
// ==========================================

export const generateItinerarySchema = z.object({
  tourId: z.string().optional(),
  cityId: z.string().optional(),
  countryId: z.string().optional(),
  destination: z.string().optional(),
  days: z.number().int().positive().optional(),
  outboundFlight: z.object({
    arrivalTime: z.string().optional(),
  }).optional(),
  arrivalTime: z.string().optional(),
  returnFlight: z.object({
    departureTime: z.string().optional(),
  }).optional(),
  departureTime: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
})

// Type exports
export type ReverseVoucherInput = z.infer<typeof reverseVoucherSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>
export type CreateLinkPayInput = z.infer<typeof createLinkPaySchema>
