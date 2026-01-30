// ============================
// 行程相關型別定義
// ============================

// 單一航班段資訊（用於轉機或多段航班）
export interface FlightSegment {
  airline: string // 航空公司
  flightNumber: string // 班次
  departureAirport: string // 出發機場代碼
  arrivalAirport: string // 抵達機場代碼
  departureDate?: string | null // 出發日期
  departureTime?: string | null // 出發時間
  arrivalTime?: string | null // 抵達時間
  status?: string // 訂位狀態（如：HK）
  class?: string // 艙等
}

// 航班資訊（含多段航班支援）
export interface FlightInfo {
  airline: string // 航空公司（主要航班）
  flightNumber: string // 班次（主要航班）
  departureAirport: string // 出發機場代碼（如：TPE）
  departureTime: string // 出發時間（如：06:50）
  departureDate?: string // 出發日期（如：10/21）
  arrivalAirport: string // 抵達機場代碼（如：FUK）
  arrivalTime: string // 抵達時間（如：09:55）
  duration?: string // 飛行時間（如：2小時5分）
  // 多段航班支援（轉機或分批出發）
  pnr?: string // PNR 訂位代號
  segments?: FlightSegment[] // 所有航班段（含轉機）
}

// Tour 類型已移至 @/types/tour.types.ts
// 使用完整的 Tour 定義
export type { Tour } from '@/types/tour.types'

export interface Member {
  id: string
  order_id: string
  // 基本資料
  chinese_name: string | null // 中文姓名
  passport_name: string | null // 護照拼音
  name?: string // 向下相容
  name_en?: string // 向下相容（拼音）
  birthday: string | null // YYYY-MM-DD（DB 欄位名）
  birth_date?: string // 向下相容（order_members 表使用此欄位）
  passport_number: string | null
  passport_expiry: string | null // YYYY-MM-DD
  id_number: string | null // 身分證字號
  gender: 'M' | 'F' | '' | null // 性別
  age: number | null // 年齡
  member_type: string // 成員類型
  identity: string | null // 身份（主要聯絡人等）

  // 餐食與健康
  special_meal: string | null // 特殊餐食需求

  // 訂位與航班
  pnr: string | null // 訂位代號
  reservation_code?: string // 向下相容

  // 住宿資訊
  hotel_1_name: string | null
  hotel_1_checkin: string | null
  hotel_1_checkout: string | null
  hotel_2_name: string | null
  hotel_2_checkin: string | null
  hotel_2_checkout: string | null
  hotel_confirmation: string | null // 訂房確認代號
  assigned_room?: string // 向下相容

  // 報到資訊
  checked_in: boolean | null // 是否已報到
  checked_in_at: string | null // 報到時間

  // 財務資訊
  cost_price: number | null // 成本價
  flight_cost: number | null // 機票成本
  misc_cost: number | null // 雜費
  profit: number | null // 利潤
  deposit_amount: number | null // 訂金
  deposit_receipt_no: string | null // 訂金收據號
  balance_amount: number | null // 尾款
  balance_receipt_no: string | null // 尾款收據號

  // 關聯
  customer_id: string | null

  // 其他
  is_child_no_bed?: boolean // 小孩不佔床
  add_ons?: string[] // 加購項目IDs
  refunds?: string[] // 退費項目IDs
  custom_fields?: Record<string, unknown> // 自定義欄位數據 {fieldId: value}
  passport_image_url?: string | null // 護照照片 URL
  created_at: string | null
  updated_at: string | null
}

export interface TourAddOn {
  id: string
  tour_id: string
  name: string
  price: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TourRefund {
  id: string
  tour_id: string
  order_id: string
  order_number: string
  member_name: string
  reason: string
  amount: number
  status: 'pending' | 'approved' | 'refunded' | 'rejected'
  applied_date: string
  processed_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// 行程表相關型別
export interface ItineraryFeature {
  icon: string // icon 名稱 (如: "IconBuilding")
  title: string
  description: string
}

export interface FocusCard {
  title: string
  src: string // 圖片 URL
}

export interface LeaderInfo {
  name: string
  domesticPhone: string
  overseasPhone: string
  // 進階欄位（Art/Collage 風格使用）
  lineId?: string | null
  photo?: string | null
  title?: string | null
  description?: string | null
}

export interface MeetingInfo {
  time: string // ISO 8601 格式
  location: string
  // 進階欄位（Art/Collage 風格使用）
  date?: string | null
  flightNo?: string | null
  airline?: string | null
}

export interface HotelInfo {
  name: string
  description: string
  image?: string // 舊版單張圖片（向後相容）
  images?: string[] // 新版多張圖片（最多4張）
  location?: string // 飯店位置（Art/Collage 風格用）
}

export interface DailyActivity {
  icon: string // emoji 或 icon
  title: string
  description: string
  image?: string
}

export interface DailyMeals {
  breakfast: string
  lunch: string
  dinner: string
}

// 每日圖片（支援位置調整）
export interface DailyImage {
  url: string
  position?: string // object-position 值，如 "center", "center top", "center 30%"
}

export interface DailyItineraryDay {
  dayLabel: string // 如: "Day 1"
  date: string // 如: "10/21 (二)"
  title: string
  highlight?: string
  description?: string
  activities: DailyActivity[]
  recommendations: string[]
  meals: DailyMeals
  accommodation: string
  accommodationUrl?: string // 飯店官網或訂房連結
  accommodationRating?: number // 飯店星級（1-5）
  images?: (string | DailyImage)[] // 支援舊格式 string 和新格式 DailyImage
}

// 費用包含/不含項目
export interface PricingItem {
  text: string // 項目文字
  included: boolean // 是否包含
}

// 詳細團費資訊
export interface PricingDetails {
  show_pricing_details?: boolean // 是否顯示詳細團費
  insurance_amount?: '250' | '300' | '500' | string // 旅遊責任險金額（萬元），可選擇或自訂
  included_items: PricingItem[] // 費用包含項目
  excluded_items: PricingItem[] // 費用不含項目
  notes: string[] // 注意事項
}

// 行程表版本記錄（存在同一筆資料的 JSON 陣列裡）
export interface ItineraryVersionRecord {
  id: string // UUID
  version: number // 版本號
  note: string // 版本備註（如：原始版、客戶修改版）
  // 可變動的內容
  daily_itinerary: DailyItineraryDay[]
  features?: ItineraryFeature[]
  focus_cards?: FocusCard[]
  leader?: LeaderInfo
  meeting_info?: MeetingInfo
  hotels?: HotelInfo[]
  // 時間戳記
  created_at: string
}

/**
 * 🎯 軍事級別 Itinerary 類型定義
 *
 * 修復項目：
 * ✅ 添加 workspace_id 支援多租戶隔離
 * ✅ 添加 updated_by 審計追蹤
 * ✅ 完整的 TSDoc 註解
 */
export interface Itinerary {
  // 基礎欄位
  id: string
  code?: string // 行程編號（如：I20240001）
  tour_id?: string // 關聯的團 ID（選填，因為可能只是草稿）
  quote_id?: string // 關聯的報價單 ID（選填）
  proposal_package_id?: string // 關聯的提案套件 ID（選填）

  // 🔒 多租戶支援
  workspace_id?: string // Workspace ID（多租戶隔離）

  // 封面資訊
  name?: string // 行程名稱（向後相容別名，等同 title）
  destination?: string // 目的地（向後相容）
  tagline: string
  title: string
  subtitle: string
  description: string
  departure_date: string
  tour_code: string
  cover_image: string
  country: string
  city: string
  status: '提案' | '進行中' | '結案' | '取消'
  cover_style?: 'original' | 'gemini' | 'nature' | 'luxury' | 'art' | 'dreamscape' | 'collage' // 封面風格
  flight_style?: 'original' | 'chinese' | 'japanese' | 'luxury' | 'art' | 'none' | 'dreamscape' | 'collage' // 航班卡片風格
  itinerary_style?: 'original' | 'luxury' | 'art' | 'dreamscape' // 每日行程風格
  price?: string | null // 價格（如：39,800）
  price_note?: string | null // 價格備註（如：起、/人）

  // 航班資訊
  outbound_flight?: FlightInfo
  return_flight?: FlightInfo
  flight_info?: {
    outbound?: {
      flightNumber: string
      airline: string
      departureAirport: string
      arrivalAirport: string
      departureTime: string
      arrivalTime: string
    } | null
    return?: {
      flightNumber: string
      airline: string
      departureAirport: string
      arrivalAirport: string
      departureTime: string
      arrivalTime: string
    } | null
  } | null

  // 行程特色
  features: ItineraryFeature[]
  show_features?: boolean

  // 精選景點
  focus_cards: FocusCard[]

  // 領隊資訊
  leader?: LeaderInfo
  show_leader_meeting?: boolean

  // 集合資訊
  meeting_info?: MeetingInfo

  // 飯店資訊
  hotels?: HotelInfo[]
  show_hotels?: boolean

  // 行程副標題
  itinerary_subtitle?: string

  // 逐日行程
  daily_itinerary: DailyItineraryDay[]

  // 版本記錄（像 Excel 分頁）
  version_records?: ItineraryVersionRecord[]

  // 狀態相關欄位
  is_template?: boolean // 是否為公司範例行程
  closed_at?: string | null // 結案時間

  // 詳細團費
  pricing_details?: PricingDetails
  show_pricing_details?: boolean

  // 價格方案（多種人數價格）
  price_tiers?: PriceTier[] | null
  show_price_tiers?: boolean

  // 常見問題
  faqs?: FAQ[] | null
  show_faqs?: boolean

  // 提醒事項
  notices?: string[] | null
  show_notices?: boolean

  // 取消政策
  cancellation_policy?: string[] | null
  show_cancellation_policy?: boolean

  // 🔍 審計追蹤欄位
  created_at: string
  updated_at: string
  created_by?: string // 建立者的 employee ID
  updated_by?: string // 最後修改者的 employee ID
  archived_at?: string | null
  archived?: boolean // 是否已封存
  archive_reason?: string | null // 封存原因：no_deal、cancelled、test_error

  // 離線同步支援
  _deleted?: boolean
  _needs_sync?: boolean
  _synced_at?: string
}

// 價格方案（如 4人包團、6人包團、8人包團）
export interface PriceTier {
  label: string // 如「4人包團」、「6人包團」
  sublabel?: string // 如「每人」
  price: string // 如「34,500」
  priceNote?: string // 如「起」
  addon?: string // 如「加購1日包車 / 每人+NT$900」
}

// 常見問題
export interface FAQ {
  question: string // 問題
  answer: string // 答案
}
