/**
 * 客戶相關型別定義
 */

import { BaseEntity } from './base.types'

// ============================================
// 客戶介面
// ============================================

/**
 * Customer - 客戶資料
 */
export interface Customer extends BaseEntity {
  code: string // 客戶編號
  name: string // 客戶姓名
  english_name?: string | null // 英文姓名
  phone: string | null // 主要電話
  alternative_phone?: string | null // 備用電話
  email?: string | null // Email
  address?: string | null // 地址
  city?: string | null // 城市
  country?: string | null // 國家
  national_id?: string | null // 身分證字號
  passport_number?: string | null // 護照號碼
  passport_romanization?: string | null // 護照拼音（格式：姓氏/名字，例如：WANG/XIAOMING）
  passport_expiry_date?: string | null // 護照效期 (ISO 8601)
  passport_image_url?: string | null // 護照圖片（base64 或 URL）
  date_of_birth?: string | null // 出生日期 (ISO 8601)
  gender?: string | null // 性別
  company?: string | null // 公司名稱
  tax_id?: string | null // 統編
  is_vip: boolean | null // 是否為 VIP
  vip_level?: VipLevel | string | null // VIP 等級
  source?: CustomerSource | string | null // 客戶來源
  referred_by?: string | null // 推薦人
  notes?: string | null // 備註
  is_active: boolean | null // 是否啟用
  total_orders?: number | null // 總訂單數（統計用）
  total_spent?: number | null // 總消費金額（統計用）
  last_order_date?: string | null // 最後訂單日期（統計用）
  verification_status: VerificationStatus // 人工驗證狀態
}

// ============================================
// 客戶分類
// ============================================

/**
 * VerificationStatus - 人工驗證狀態
 */
export type VerificationStatus =
  | 'verified' // 已驗證
  | 'unverified' // 待驗證
  | 'rejected' // 已拒絕

/**
 * VipLevel - VIP 等級
 */
export type VipLevel =
  | 'bronze' // 銅卡
  | 'silver' // 銀卡
  | 'gold' // 金卡
  | 'platinum' // 白金卡
  | 'diamond' // 鑽石卡

/**
 * CustomerSource - 客戶來源
 */
export type CustomerSource =
  | 'website' // 官網
  | 'facebook' // Facebook
  | 'instagram' // Instagram
  | 'line' // LINE
  | 'referral' // 推薦
  | 'phone' // 電話
  | 'walk_in' // 現場
  | 'other' // 其他

// ============================================
// 客戶建立與更新
// ============================================

/**
 * CreateCustomerData - 建立客戶所需資料
 */
export interface CreateCustomerData {
  code: string
  name: string
  english_name?: string
  phone: string
  alternative_phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  national_id?: string
  passport_number?: string
  passport_romanization?: string
  passport_expiry_date?: string
  date_of_birth?: string
  gender?: string
  company?: string
  tax_id?: string
  is_vip: boolean
  vip_level?: VipLevel
  source?: CustomerSource
  referred_by?: string
  notes?: string
  is_active: boolean
  verification_status?: VerificationStatus
}

/**
 * UpdateCustomerData - 更新客戶資料
 */
export interface UpdateCustomerData {
  name?: string
  english_name?: string | null
  phone?: string | null
  alternative_phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  national_id?: string | null
  passport_number?: string | null
  passport_romanization?: string | null
  passport_expiry_date?: string | null
  date_of_birth?: string | null
  gender?: string | null
  company?: string | null
  tax_id?: string | null
  is_vip?: boolean | null
  vip_level?: VipLevel | string | null
  source?: CustomerSource | string | null
  referred_by?: string | null
  notes?: string | null
  is_active?: boolean | null
  verification_status?: VerificationStatus
}

// ============================================
// 客戶查詢與篩選
// ============================================

/**
 * CustomerFilter - 客戶篩選條件
 */
export interface CustomerFilter {
  is_vip?: boolean
  vip_level?: VipLevel | VipLevel[]
  source?: CustomerSource | CustomerSource[]
  city?: string
  country?: string
  is_active?: boolean
  search_term?: string // 搜尋客戶編號、姓名、電話、Email
  verification_status?: VerificationStatus | VerificationStatus[]
}

/**
 * CustomerListItem - 客戶列表項目（精簡版）
 */
export interface CustomerListItem {
  id: string
  code: string
  name: string
  phone: string
  email?: string
  is_vip: boolean
  vip_level?: VipLevel
  total_orders?: number
  total_spent?: number
  last_order_date?: string
}

// ============================================
// 客戶統計
// ============================================

/**
 * CustomerStats - 客戶統計資料
 */
export interface CustomerStats {
  total_customers: number
  vip_customers: number
  active_customers: number
  new_customers_this_month: number
  total_revenue: number
  average_order_value: number
  customers_by_source: Record<CustomerSource, number>
  customers_by_vip_level: Record<VipLevel, number>
}
