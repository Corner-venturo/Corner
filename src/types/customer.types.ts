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
  english_name?: string // 英文姓名
  phone: string // 主要電話
  alternative_phone?: string // 備用電話
  email?: string // Email
  address?: string // 地址
  city?: string // 城市
  country?: string // 國家
  national_id?: string // 身分證字號
  passport_number?: string // 護照號碼
  passport_romanization?: string // 護照拼音（格式：姓氏/名字，例如：WANG/XIAOMING）
  passport_expiry_date?: string // 護照效期 (ISO 8601)
  date_of_birth?: string // 出生日期 (ISO 8601)
  gender?: string // 性別
  company?: string // 公司名稱
  tax_id?: string // 統編
  is_vip: boolean // 是否為 VIP
  vip_level?: VipLevel // VIP 等級
  source?: CustomerSource // 客戶來源
  referred_by?: string // 推薦人
  notes?: string // 備註
  is_active: boolean // 是否啟用
  total_orders?: number // 總訂單數（統計用）
  total_spent?: number // 總消費金額（統計用）
  last_order_date?: string // 最後訂單日期（統計用）
}

// ============================================
// 客戶分類
// ============================================

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
}

/**
 * UpdateCustomerData - 更新客戶資料
 */
export interface UpdateCustomerData {
  name?: string
  english_name?: string
  phone?: string
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
  is_vip?: boolean
  vip_level?: VipLevel
  source?: CustomerSource
  referred_by?: string
  notes?: string
  is_active?: boolean
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
