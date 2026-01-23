/**
 * 出團確認表 類型定義
 *
 * 流程：行程表 → 出團確認表（最終紀錄）→ 產生需求單
 *
 * 功能：
 * - 記錄最終的餐廳/飯店/交通/活動
 * - 追蹤預計 vs 實際成本
 * - 作為歷史參考資料
 */

import { BaseEntity } from './base.types'

// ============================================
// 出團確認表（主表）
// ============================================

export interface TourConfirmationSheet extends BaseEntity {
  tour_id: string
  tour_code: string
  tour_name: string

  // 團基本資訊
  departure_date: string | null
  return_date: string | null
  tour_leader_name: string | null
  tour_leader_id: string | null
  sales_person: string | null
  assistant: string | null
  pax: number | null
  flight_info: string | null

  // 狀態
  status: ConfirmationSheetStatus

  // 費用統計
  total_expected_cost: number | null
  total_actual_cost: number | null

  // 關聯的行程表版本
  itinerary_id: string | null
  itinerary_version: number | null

  // 備註
  notes: string | null

  workspace_id: string
}

export type ConfirmationSheetStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed'

// ============================================
// 出團確認表明細（子表）
// ============================================

export interface TourConfirmationItem extends BaseEntity {
  sheet_id: string // FK to tour_confirmation_sheets

  // 關聯需求單
  request_id: string | null // FK to tour_requests

  // 分類
  category: ConfirmationItemCategory

  // 日期
  service_date: string
  service_date_end: string | null // 住宿用（退房日）
  day_label: string | null // Day 1, Day 2...

  // 供應商
  supplier_name: string
  supplier_id: string | null // FK to suppliers（可選）

  // 資源關聯（餐廳/飯店/景點等）
  resource_type: ResourceType | null
  resource_id: string | null

  // GPS 資訊（供領隊導航使用）
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null

  // 內容描述（依類型不同）
  title: string // 主要名稱
  description: string | null // 詳細描述

  // 金額
  unit_price: number | null
  currency: string // JPY, TWD, THB...
  quantity: number | null
  subtotal: number | null
  expected_cost: number | null
  actual_cost: number | null

  // 領隊記帳欄位
  leader_expense: number | null // 領隊實際支出
  leader_expense_note: string | null // 支出備註
  leader_expense_at: string | null // 記帳時間
  receipt_images: string[] // 收據照片

  // 聯絡資訊
  contact_info: ContactInfo | null

  // 預訂資訊
  booking_reference: string | null // 預約編號
  booking_status: BookingStatus

  // 類型特定資料（JSONB）
  type_data: TransportData | MealData | AccommodationData | ActivityData | OtherData | null

  // 排序
  sort_order: number

  // 備註
  notes: string | null

  workspace_id: string
}

export type ConfirmationItemCategory =
  | 'transport'     // 交通
  | 'meal'          // 餐食
  | 'accommodation' // 住宿
  | 'activity'      // 活動
  | 'other'         // 其他

// 資源類型
export type ResourceType =
  | 'restaurant'    // 餐廳
  | 'hotel'         // 飯店
  | 'attraction'    // 景點
  | 'supplier'      // 供應商

export type BookingStatus =
  | 'pending'       // 待處理
  | 'requested'     // 已發需求
  | 'confirmed'     // 已確認
  | 'cancelled'     // 已取消
  | 'pending_change' // 待變更（版本切換時）

// ============================================
// 聯絡資訊
// ============================================

export interface ContactInfo {
  phone?: string
  fax?: string
  email?: string
  address?: string
  contact_person?: string
}

// ============================================
// 類型特定資料
// ============================================

// 交通
export interface TransportData {
  type: 'transport'
  route: string // 接駁路線
  vehicle_type?: string // 車型
  pickup_time?: string
  pickup_location?: string
  dropoff_location?: string
}

// 餐食
export interface MealData {
  type: 'meal'
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'other'
  meal_time?: string // 用餐時間
  pax?: number // 用餐人數
  menu_type?: string // 套餐類型
  dietary_notes?: string // 飲食備註
}

// 住宿
export interface AccommodationData {
  type: 'accommodation'
  room_type: string // 房型
  bed_type?: string // 床型
  room_count: number
  nights: number
  check_in_time?: string
  check_out_time?: string
  guest_names?: string[] // 入住旅客
}

// 活動
export interface ActivityData {
  type: 'activity'
  activity_type?: string // 活動類型
  start_time?: string
  end_time?: string
  location?: string
  includes?: string[] // 包含項目
}

// 其他
export interface OtherData {
  type: 'other'
  item_type?: string // 項目類型（領隊費、零用金...）
  payment_method?: string // 付款方式
  payment_date?: string // 付款日期
}

// ============================================
// 建立/更新用
// ============================================

export type CreateConfirmationSheet = Omit<
  TourConfirmationSheet,
  'id' | 'created_at' | 'updated_at' | 'total_expected_cost' | 'total_actual_cost'
>

export type UpdateConfirmationSheet = Partial<CreateConfirmationSheet>

// 新欄位設為可選（向後相容）
export type CreateConfirmationItem = Omit<
  TourConfirmationItem,
  | 'id'
  | 'created_at'
  | 'updated_at'
  // 以下新欄位設為可選
  | 'request_id'
  | 'resource_type'
  | 'resource_id'
  | 'latitude'
  | 'longitude'
  | 'google_maps_url'
  | 'leader_expense'
  | 'leader_expense_note'
  | 'leader_expense_at'
  | 'receipt_images'
> & {
  // 這些新欄位設為可選，以便現有代碼可以正常運作
  request_id?: string | null
  resource_type?: ResourceType | null
  resource_id?: string | null
  latitude?: number | null
  longitude?: number | null
  google_maps_url?: string | null
  leader_expense?: number | null
  leader_expense_note?: string | null
  leader_expense_at?: string | null
  receipt_images?: string[]
}

export type UpdateConfirmationItem = Partial<CreateConfirmationItem>

// ============================================
// 按類別分組的明細（UI 用）
// ============================================

export interface GroupedConfirmationItems {
  transport: TourConfirmationItem[]
  meal: TourConfirmationItem[]
  accommodation: TourConfirmationItem[]
  activity: TourConfirmationItem[]
  other: TourConfirmationItem[]
}

// ============================================
// 費用統計
// ============================================

export interface CostSummary {
  transport: { expected: number; actual: number }
  meal: { expected: number; actual: number }
  accommodation: { expected: number; actual: number }
  activity: { expected: number; actual: number }
  other: { expected: number; actual: number }
  total: { expected: number; actual: number }
}
