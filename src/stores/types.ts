// ============================
// 核心型別定義
// ============================

// 收款狀態
export type ReceiptStatus = 'received' | 'confirmed' | 'rejected'

// 付款方式
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check'

// 簽證狀態
export type VisaStatus = 'pending' | 'submitted' | 'issued' | 'collected' | 'rejected'

// 正確的 User 型別（與 Employee 一致）
export interface User {
  id: string
  employee_number: string
  english_name: string
  display_name: string
  chinese_name: string // 中文姓名（本名）
  // 便捷屬性（向下相容）
  name?: string // display_name 的別名
  email?: string // personal_info.email 的便捷存取
  personal_info: {
    national_id: string
    birthday: string
    phone: string | string[] // 支援單一電話或多個電話
    email: string
    address: string
    emergency_contact: {
      name: string
      relationship: string
      phone: string
    }
  }
  job_info: {
    position?: string
    supervisor?: string
    hire_date: string
    probation_end_date?: string
  }
  salary_info: {
    base_salary: number
    allowances: {
      type: string
      amount: number
    }[]
    salary_history: {
      effective_date: string
      base_salary: number
      reason: string
    }[]
  }
  permissions: string[]
  roles?: ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant' | 'super_admin')[] // 附加身份標籤（不影響權限），支援多重身份
  attendance: {
    leave_records: {
      id: string
      type: 'annual' | 'sick' | 'personal' | 'maternity' | 'other'
      start_date: string
      end_date: string
      days: number
      reason?: string
      status: 'pending' | 'approved' | 'rejected'
      approved_by?: string
    }[]
    overtime_records: {
      id: string
      date: string
      hours: number
      reason: string
      approved_by?: string
    }[]
  }
  contracts: {
    id: string
    type: 'employment' | 'probation' | 'renewal'
    start_date: string
    end_date?: string
    file_path?: string
    notes?: string
  }[]
  status: 'active' | 'probation' | 'leave' | 'terminated'
  avatar?: string
  workspace_id?: string // 所屬工作空間 ID
  workspace_code?: string // 所屬工作空間代碼（TP, TC 等）- 登入時一併取得
  selected_workspace_id?: string // Super Admin 選擇的工作空間 ID
  hidden_menu_items?: string[] // 隱藏的選單項目 ID
  preferred_features?: string[] // 個人常用功能列表（用於個人化 Sidebar），例如: ["tours", "orders", "calendar"]

  // 認證相關
  password_hash?: string // 加密後的密碼
  last_password_change?: string // 最後修改密碼時間
  must_change_password?: boolean // 是否需要修改密碼（首次登入）
  failed_login_attempts?: number // 登入失敗次數
  last_failed_login?: string // 最後失敗登入時間

  created_at: string
  updated_at: string
}

// Employee 型別現在是 User 的別名
export type Employee = User

export interface Todo {
  id: string
  title: string
  priority: 1 | 2 | 3 | 4 | 5 // 星級緊急度
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed?: boolean // 對齊資料庫欄位

  // 人員關係（共享機制）
  creator: string // 建立者
  assignee?: string // 被指派者（可選）
  visibility: string[] // 可見人員ID列表 = [creator, assignee]
  is_public?: boolean // 是否公開給全公司（只有建立者+共享者可編輯，其他人只能查看）

  // 行事曆關聯
  calendar_event_id?: string // 主待辦事項關聯的行事曆事件 ID

  // 關聯資料
  related_items: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt'
    id: string
    title: string
  }[]

  // 子任務
  sub_tasks: {
    id: string
    title: string
    done: boolean
    completed_at?: string
    calendar_event_id?: string // 關聯的行事曆事件 ID
  }[]

  // 簡單備註（非留言板）
  notes: {
    id?: string // 留言 ID
    timestamp: string
    content: string
    author_id: string // 留言者 ID
    author_name: string // 留言者名稱
    read_by?: string[] // 已讀的使用者 ID 列表
  }[]

  // 快速功能設定
  enabled_quick_actions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[]

  // 通知標記
  needs_creator_notification?: boolean // 被指派人有更新，需要通知建立者

  created_at: string
  updated_at: string
}

// 航班資訊
export interface FlightInfo {
  airline: string // 航空公司
  flightNumber: string // 班次
  departureAirport: string // 出發機場代碼（如：TPE）
  departureTime: string // 出發時間（如：06:50）
  departureDate?: string // 出發日期（如：10/21）
  arrivalAirport: string // 抵達機場代碼（如：FUK）
  arrivalTime: string // 抵達時間（如：09:55）
  duration?: string // 飛行時間（如：2小時5分）
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
  birth_date: string | null // YYYY-MM-DD
  birthday?: string // 向下相容
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
}

export interface MeetingInfo {
  time: string // ISO 8601 格式
  location: string
}

export interface HotelInfo {
  name: string
  description: string
  image?: string
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
  status: 'draft' | 'published'
  cover_style?: 'original' | 'gemini' | 'nature' | 'serene' | 'luxury' | 'art' // 封面風格
  flight_style?: 'original' | 'chinese' | 'japanese' | 'luxury' | 'art' | 'none' // 航班卡片風格
  itinerary_style?: 'original' | 'luxury' | 'art' // 每日行程風格
  price?: string | null // 價格（如：39,800）
  price_note?: string | null // 價格備註（如：起、/人）

  // 航班資訊
  outbound_flight?: FlightInfo
  return_flight?: FlightInfo

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

// 砍次表價格（用於比較不同人數的報價）
export interface TierPricing {
  id: string // 唯一識別
  participant_count: number // 總人數（用於重新計算成本）
  participant_counts: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 各身份人數分布
  identity_costs: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 重新計算的各身份成本
  selling_prices: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 各身份售價
  identity_profits: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 各身份利潤
}

// Order 類型已移至 @/types/order.types.ts
// 使用完整的 Order 定義
export type { Order } from '@/types/order.types'

// Customer 類型已移至 @/types/customer.types.ts
// 使用完整的 Customer 定義，不再使用簡化版
export type { Customer } from '@/types/customer.types'

export interface Payment {
  id: string
  type: 'receipt' | 'request' | 'disbursement'
  // receipt: 收款
  // request: 請款
  // disbursement: 出納
  order_id?: string
  tour_id?: string
  amount: number
  description: string
  status: 'pending' | 'confirmed' | 'completed'
  // pending: 待確認
  // confirmed: 已確認
  // completed: 已完成
  created_at: string
  updated_at: string
}

export interface QuoteRegion {
  id: string
  quote_id: string
  country: string // 國家 ID
  country_name: string // 國家名稱
  region?: string // 地區 ID（可選）
  region_name?: string // 地區名稱（可選）
  city: string // 城市 ID
  city_name: string // 城市名稱
  order: number // 順序
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  code?: string // 報價單編號 (Q20250001 或自訂編號如 JP-BASIC)
  quote_number?: string // 報價單號碼 (QUOTE-2025-0001) - 向下相容
  quote_type: 'standard' | 'quick' // ✅ 報價單類型（標準報價單 / 快速報價單）
  name?: string // 團體名稱（標準報價單必填，快速報價單選填）
  destination?: string // 目的地（向後相容）
  days?: number // 天數（向後相容）
  status: 'draft' | 'proposed' | 'revised' | 'approved' | 'converted' | 'rejected'
  // draft: 草稿
  // proposed: 提案
  // revised: 修改中
  // approved: 已核准
  // converted: 已轉單
  // rejected: 已拒絕
  tour_id?: string // 關聯的旅遊團ID
  itinerary_id?: string // 關聯的行程表ID
  converted_to_tour?: boolean // 是否已轉成旅遊團
  is_pinned?: boolean // 是否置頂（範本報價單）
  regions?: QuoteRegion[] // 多地區支援（新）

  // 客戶資訊
  customer_name?: string // 客戶名稱
  contact_person?: string // 聯絡人
  contact_phone?: string // 聯絡電話（標準報價單）
  contact_email?: string // Email

  // 快速報價單專用欄位
  contact_address?: string // 通訊地址（快速報價單用）
  tour_code?: string // 團體編號（快速報價單用）
  handler_name?: string // 承辦業務（快速報價單用）
  created_by_name?: string // 建立人姓名（冗餘欄位，便於顯示）
  issue_date?: string // 開單日期（快速報價單用）
  received_amount?: number // 已收金額（快速報價單用）
  balance_amount?: number // 應收餘額（快速報價單用，自動計算）
  quick_quote_items?: QuickQuoteItem[] // ✅ 快速報價單的收費明細項目（JSONB 欄位）

  // 需求資訊
  group_size?: number // 團體人數（向下相容：總人數）
  accommodation_days?: number // 住宿天數
  requirements?: string // 需求說明
  budget_range?: string // 預算範圍
  valid_until?: string // 報價有效期
  payment_terms?: string // 付款條件

  // 多身份人數統計
  participant_counts?: {
    adult: number // 成人（雙人房）
    child_with_bed: number // 小朋友（佔床）
    child_no_bed: number // 不佔床
    single_room: number // 單人房
    infant: number // 嬰兒
  }

  // 多身份售價
  selling_prices?: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  }

  categories?: QuoteCategory[] // 費用分類（標準報價單用）- 臨時編輯狀態
  total_cost?: number // 總成本
  total_amount?: number // 總金額
  version?: number // 版本號（向下相容）
  versions?: QuoteVersion[] // 版本歷史（所有版本都存在這裡）
  current_version_index?: number // 當前編輯的版本索引（對應 versions 陣列）
  tier_pricings?: TierPricing[] // 砍次表（不同人數對應不同價格）
  expense_description?: string // 費用說明（快速報價單用）
  created_at: string
  updated_at: string
}

/**
 * QuickQuoteItem - 快速報價單項目
 */
export interface QuickQuoteItem {
  id: string
  description: string // 摘要
  quantity: number // 數量
  cost?: number // 成本（編輯時可選填，列印時隱藏）
  unit_price: number // 單價
  amount: number // 金額（quantity * unit_price）
  notes: string // 備註
}

export interface QuoteVersion {
  id: string
  version: number
  name?: string // 版本名稱（如：客戶名稱、報價單名稱）- 可選以向下兼容
  categories: QuoteCategory[]
  total_cost: number
  group_size?: number // 團體人數
  accommodation_days: number // 住宿天數
  participant_counts: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 多身份人數統計
  selling_prices: {
    adult: number
    child_with_bed: number
    child_no_bed: number
    single_room: number
    infant: number
  } // 多身份售價
  note?: string // 修改說明
  created_at: string
  updated_at?: string // 版本更新時間（選填）
}

export interface QuoteCategory {
  id: string
  name: string
  items: QuoteItem[]
  total: number
}

export interface QuoteItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  total: number
  note?: string
  day?: number // 住宿專用：第幾天
  room_type?: string // 住宿專用：房型名稱
  is_group_cost?: boolean // 交通和領隊導遊專用：團體分攤
  // 多身份計價：機票專用
  pricing_type?: 'uniform' | 'by_identity' // uniform: 統一價格, by_identity: 依身份計價
  adult_price?: number // 成人價
  child_price?: number // 小朋友價
  infant_price?: number // 嬰兒價
  created_at?: string // 可選，向後相容
  updated_at?: string // 可選，向後相容
}

// === 供應商管理系統 ===
// Supplier 類型已移至 @/types/supplier.types.ts
// 使用完整的 Supplier 定義
export type {
  Supplier,
  SupplierContact,
  SupplierBankInfo,
  PriceListItem,
} from '@/types/supplier.types'

// === 請款單管理系統 ===
// === 請款單（當前簡化版 - 符合資料庫實際結構）===
export interface PaymentRequest {
  id: string
  code: string // 請款單編號（由 store 自動生成）
  request_number: string // 請款單號（與 code 同義，向下相容）
  order_id?: string | null // 關聯的訂單ID
  order_number?: string | null // 訂單編號（快照）
  tour_id?: string | null
  tour_code?: string | null // 團號（快照）
  tour_name?: string | null // 團名（快照）
  request_type: string // 請款類型（例：員工代墊、供應商支出）
  amount: number // 總金額
  supplier_id?: string | null
  supplier_name?: string | null
  status?: string | null // pending, approved, paid
  is_special_billing?: boolean | null // 是否為特殊出帳
  note?: string | null // 備註（使用 note 單數形式，與資料庫一致）
  approved_at?: string | null
  approved_by?: string | null
  paid_at?: string | null
  paid_by?: string | null
  created_by?: string | null // 請款人 ID
  created_by_name?: string | null // 請款人姓名（快照）
  workspace_id?: string
  created_at: string
  updated_at: string
}

// 注意：PaymentRequestItem 使用獨立的關聯表 payment_request_items
// 透過 request_id 關聯到 PaymentRequest
// 使用 paymentRequestService.getItemsByRequestId() 取得項目

// 請款項目類型（參考 cornerERP 的 INVOICE_ITEM_TYPES）
export type PaymentItemCategory =
  | '住宿'      // 飯店住宿
  | '交通'      // 機票、巴士、高鐵等
  | '餐食'      // 餐廳、用餐
  | '門票'      // 景點門票、活動
  | '導遊'      // 導遊小費、領隊費用
  | '保險'      // 旅遊平安險
  | '出團款'    // 出團預支款項
  | '回團款'    // 回團結算款項
  | '員工代墊'  // 員工墊付費用
  | 'ESIM'      // eSIM 網卡
  | '同業'      // 同業分潤
  | '其他'      // 其他雜支

export interface PaymentRequestItem {
  id: string
  request_id: string // 所屬請款單ID
  item_number: string // REQ-2024001-001
  category: PaymentItemCategory
  supplier_id: string
  supplier_name: string // 供應商名稱快照
  description: string
  unit_price: number
  quantity: number
  subtotal: number
  note?: string // 項目備註
  sort_order: number // 排序
  created_at: string
  updated_at: string
}

// 團體分配項目（用於批量分配）
export interface TourAllocation {
  tour_id: string // 團號ID
  code: string // 團體代碼
  tour_name: string // 團體名稱
  allocated_amount: number // 分配金額
}

// === 出納單管理系統 ===
export interface DisbursementOrder {
  id: string
  order_number: string // CD-2024001
  disbursement_date: string // 出帳日期 (預設本週四)
  payment_request_ids: string[] // 關聯的請款單ID陣列
  amount: number // 總金額 (自動加總)
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' // 待確認、已確認、已付款、已取消
  note?: string // 出納備註
  created_by: string // 建立者ID
  confirmed_by?: string // 確認者ID
  confirmed_at?: string // 確認時間
  paid_at?: string // 付款時間
  created_at: string
  updated_at: string
}

// === 收款單管理系統 ===
export interface ReceiptOrder {
  id: string
  receipt_number: string // REC-2024001

  // 分配模式
  allocation_mode: 'single' | 'multiple' // 單一訂單 or 批量分配

  // 單一訂單模式（向下相容）
  order_id?: string // 關聯的訂單ID（allocation_mode = 'single' 時使用）
  order_number?: string // 訂單號碼快照
  tour_id?: string // 團號
  code?: string // 團體代碼
  tour_name?: string // 團體名稱快照
  contact_person?: string // 聯絡人快照

  // 批量分配模式（一筆款分多訂單）
  order_allocations?: OrderAllocation[] // 訂單分配列表（allocation_mode = 'multiple' 時使用）

  // 共用欄位
  receipt_date: string // 收款日期
  payment_items: ReceiptPaymentItem[] // 收款項目
  total_amount: number // 總收款金額
  status: ReceiptStatus // 收款狀態
  note?: string // 收款備註
  created_by: string // 建立者ID
  confirmed_by?: string // 確認者ID
  confirmed_at?: string // 確認時間
  created_at: string
  updated_at: string
}

// 訂單分配項目（用於批量分配）
export interface OrderAllocation {
  order_id: string // 訂單ID
  order_number: string // 訂單號碼
  tour_id: string // 團號
  code: string // 團體代碼
  tour_name: string // 團體名稱
  contact_person: string // 聯絡人
  allocated_amount: number // 分配金額
}

export interface ReceiptPaymentItem {
  id: string
  receipt_id: string // 所屬收款單ID
  payment_method: PaymentMethod // 收款方式
  amount: number // 金額
  account_info?: string // 帳戶資訊 (匯款用)
  card_last_four?: string // 卡號後四碼 (刷卡用)
  auth_code?: string // 授權碼 (刷卡用)
  check_number?: string // 支票號碼
  check_bank?: string // 支票銀行
  check_due_date?: string // 支票到期日
  transaction_date: string // 交易日期
  handler_name?: string // 經手人 (現金用)
  fees?: number // 手續費
  note?: string // 備註
  created_at: string
  updated_at: string
}

// === 簽證管理系統 ===
export interface Visa {
  id: string

  // 申請人資訊
  applicant_name: string // 申請人姓名
  contact_person: string // 聯絡人
  contact_phone: string // 聯絡電話

  // 簽證資訊
  visa_type: string // 簽證類型（護照 成人、台胞證等）
  country: string // 國家

  // 狀態
  status: VisaStatus

  // 日期
  received_date?: string // 收件時間（收到客戶資料的日期）
  expected_issue_date?: string // 預計下件時間
  actual_submission_date?: string // 實際送件時間（勾選送件後記錄）
  documents_returned_date?: string // 證件歸還時間（代辦商先還證件）
  pickup_date?: string // 取件時間

  // 舊欄位保留向後相容
  submission_date?: string // @deprecated 改用 received_date

  // 關聯資訊
  order_id: string // 關聯的訂單ID
  order_number: string // 訂單號碼快照
  tour_id: string // 團號ID
  code: string // 團體代碼 (tourCode)

  // 費用
  fee: number // 代辦費
  cost: number // 成本
  vendor?: string // 代辦商名稱（送件時填寫）

  // 其他
  note?: string // 備註
  created_by?: string // 建立者ID
  created_at: string
  updated_at: string
}

// 代辦商成本記錄（記住每個代辦商的各類型簽證成本）
export interface VendorCost {
  id: string
  vendor_name: string // 代辦商名稱
  visa_type: string // 簽證類型（護照 成人、台胞證等）
  cost: number // 成本價格
  created_at: string
  updated_at: string
}

// 企業客戶
export interface Company {
  id: string
  workspace_id: string

  // 基本資訊
  company_name: string
  tax_id: string | null // 統一編號
  phone: string | null
  email: string | null
  website: string | null

  // 發票資訊
  invoice_title: string | null // 發票抬頭
  invoice_address: string | null
  invoice_email: string | null

  // 付款資訊
  payment_terms: number // 付款期限（天）
  payment_method: 'transfer' | 'cash' | 'check' | 'credit_card'
  credit_limit: number // 信用額度

  // 銀行資訊
  bank_name: string | null
  bank_account: string | null
  bank_branch: string | null

  // 地址資訊
  registered_address: string | null // 登記地址
  mailing_address: string | null // 通訊地址

  // VIP 等級
  vip_level: number // 0: 普通, 1-5: VIP等級

  // 備註
  note: string | null

  // 系統欄位
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CompanyContact {
  id: string
  company_id: string

  // 聯絡人資訊
  name: string
  title: string | null // 職稱
  department: string | null // 部門
  phone: string | null
  mobile: string | null
  email: string | null

  // 主要聯絡人標記
  is_primary: boolean

  // 備註
  note: string | null

  // 系統欄位
  created_at: string
  updated_at: string
}

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions'

// Store 工具型別（重新導出）
export type { CreateInput, UpdateInput } from './core/types'
