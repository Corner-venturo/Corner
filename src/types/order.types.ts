/**
 * 訂單相關型別定義
 */

import { BaseEntity } from './base.types'

// ============================================
// 訂單介面
// ============================================

/**
 * Order - 訂單資料
 */
export interface Order extends BaseEntity {
  order_number: string // 訂單編號（相容舊欄位：code）
  code: string // 團號代碼
  tour_id: string // 旅遊團 ID
  tour_name: string // 旅遊團名稱
  customer_id?: string // 客戶 ID（可選）
  contact_person: string // 聯絡人
  contact_phone?: string // 聯絡電話（可選）
  sales_person: string // 業務人員
  assistant: string // 助理
  member_count: number // 團員人數
  payment_status: PaymentStatus // 付款狀態
  status?: OrderStatus // 訂單狀態
  total_amount: number // 總金額
  paid_amount: number // 已付金額
  remaining_amount: number // 待付金額
  notes?: string // 備註
}

// ============================================
// 團員介面
// ============================================

/**
 * Member - 團員資料
 */
export interface Member extends BaseEntity {
  order_id: string // 訂單 ID
  tour_id: string // 旅遊團 ID（重要！）
  name: string // 姓名
  name_en: string // 英文姓名/拼音
  birthday: string // 生日 YYYY-MM-DD
  passport_number: string // 護照號碼
  passport_expiry: string // 護照到期日 YYYY-MM-DD
  id_number: string // 身分證字號
  gender: 'M' | 'F' | '' // 性別
  age?: number // 年齡（可計算，前端使用）
  phone?: string // 電話
  email?: string // Email
  emergency_contact?: string // 緊急聯絡人
  emergency_phone?: string // 緊急聯絡電話
  dietary_restrictions?: string // 飲食限制
  medical_conditions?: string // 醫療狀況
  room_preference?: string // 房間偏好
  assigned_room?: string // 分配的房間
  is_child_no_bed?: boolean // 小孩不佔床
  reservation_code?: string // 訂位代號
  add_ons?: string[] // 加購項目IDs
  refunds?: string[] // 退費項目IDs
  notes?: string // 備註
}

// ============================================
// 訂單狀態
// ============================================

/**
 * OrderStatus - 訂單狀態
 */
export type OrderStatus =
  | 'pending' // 待確認
  | 'confirmed' // 已確認
  | 'completed' // 已完成
  | 'cancelled' // 已取消

/**
 * PaymentStatus - 付款狀態
 */
export type PaymentStatus =
  | 'unpaid' // 未付款
  | 'partial' // 部分付款
  | 'paid' // 已付清
  | 'refunded' // 已退款

/**
 * Gender - 性別
 */
export type Gender = 'male' | 'female' | 'other'

/**
 * AgeCategory - 年齡分類
 */
export type AgeCategory =
  | 'adult' // 成人
  | 'child' // 兒童
  | 'infant' // 嬰兒

/**
 * RoomType - 房型
 */
export type RoomType =
  | 'single' // 單人房
  | 'double' // 雙人房
  | 'twin' // 雙床房
  | 'triple' // 三人房
  | 'quad' // 四人房

// ============================================
// 訂單建立與更新
// ============================================

/**
 * CreateOrderData - 建立訂單所需資料
 */
export interface CreateOrderData {
  code: string
  tour_id: string
  customer_id: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: number
  paid_amount: number
  number_of_people: number
  adult_count: number
  child_count: number
  infant_count: number
  notes?: string
  special_requests?: string
  is_active: boolean
}

/**
 * UpdateOrderData - 更新訂單資料
 */
export interface UpdateOrderData {
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  status?: OrderStatus
  payment_status?: PaymentStatus
  total_amount?: number
  paid_amount?: number
  number_of_people?: number
  adult_count?: number
  child_count?: number
  infant_count?: number
  notes?: string
  special_requests?: string
  is_active?: boolean
}

/**
 * CreateMemberData - 建立團員所需資料
 */
export interface CreateMemberData {
  order_id: string
  tour_id: string
  name: string
  english_name?: string
  gender: Gender
  date_of_birth: string
  age_category: AgeCategory
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  phone?: string
  email?: string
  emergency_contact?: string
  emergency_phone?: string
  dietary_restrictions?: string
  medical_conditions?: string
  room_type?: RoomType
  room_mate_id?: string
  seat_preference?: string
  notes?: string
}

/**
 * UpdateMemberData - 更新團員資料
 */
export interface UpdateMemberData {
  name?: string
  english_name?: string
  gender?: Gender
  date_of_birth?: string
  age_category?: AgeCategory
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  phone?: string
  email?: string
  emergency_contact?: string
  emergency_phone?: string
  dietary_restrictions?: string
  medical_conditions?: string
  room_type?: RoomType
  room_mate_id?: string
  seat_preference?: string
  notes?: string
}

// ============================================
// 訂單查詢與篩選
// ============================================

/**
 * OrderFilter - 訂單篩選條件
 */
export interface OrderFilter {
  tour_id?: string
  customer_id?: string
  status?: OrderStatus | OrderStatus[]
  payment_status?: PaymentStatus | PaymentStatus[]
  date_from?: string
  date_to?: string
  search_term?: string // 搜尋訂單編號、聯絡人
}

/**
 * OrderListItem - 訂單列表項目（精簡版）
 */
export interface OrderListItem {
  id: string
  code: string
  tour_code?: string
  tour_name?: string
  customer_name?: string
  contact_person: string
  contact_phone: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: number
  paid_amount: number
  number_of_people: number
  created_at: string
}

// ============================================
// 訂單統計
// ============================================

/**
 * OrderStats - 訂單統計資料
 */
export interface OrderStats {
  total_orders: number
  confirmed_orders: number
  pending_orders: number
  cancelled_orders: number
  total_revenue: number
  total_paid: number
  total_remaining: number
  total_people: number
}
