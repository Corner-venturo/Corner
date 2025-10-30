// ============================
// 核心型別定義
// ============================

// 收款狀態
export type ReceiptStatus = 'received' | 'confirmed' | 'rejected';

// 付款方式
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check';

// 簽證狀態
export type VisaStatus = 'pending' | 'submitted' | 'issued' | 'collected' | 'rejected';

// 正確的 User 型別（與 Employee 一致）
export interface User {
  id: string;
  employee_number: string;
  english_name: string;
  display_name: string;
  chinese_name: string; // 中文姓名（本名）
  personal_info: {
    national_id: string;
    birthday: string;
    phone: string | string[]; // 支援單一電話或多個電話
    email: string;
    address: string;
    emergency_contact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  job_info: {
    supervisor?: string;
    hire_date: string;
    probation_end_date?: string;
  };
  salary_info: {
    base_salary: number;
    allowances: {
      type: string;
      amount: number;
    }[];
    salary_history: {
      effective_date: string;
      base_salary: number;
      reason: string;
    }[];
  };
  permissions: string[];
  roles?: ('admin' | 'employee' | 'user' | 'tour_leader' | 'sales' | 'accountant' | 'assistant')[]; // 附加身份標籤（不影響權限），支援多重身份
  attendance: {
    leave_records: {
      id: string;
      type: 'annual' | 'sick' | 'personal' | 'maternity' | 'other';
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
      status: 'pending' | 'approved' | 'rejected';
      approved_by?: string;
    }[];
    overtime_records: {
      id: string;
      date: string;
      hours: number;
      reason: string;
      approved_by?: string;
    }[];
  };
  contracts: {
    id: string;
    type: 'employment' | 'probation' | 'renewal';
    start_date: string;
    end_date?: string;
    file_path?: string;
    notes?: string;
  }[];
  status: 'active' | 'probation' | 'leave' | 'terminated';
  avatar?: string;

  // 認證相關
  password_hash?: string; // 加密後的密碼
  last_password_change?: string; // 最後修改密碼時間
  must_change_password?: boolean; // 是否需要修改密碼（首次登入）
  failed_login_attempts?: number; // 登入失敗次數
  last_failed_login?: string; // 最後失敗登入時間

  created_at: string;
  updated_at: string;
}

// Employee 型別現在是 User 的別名
export type Employee = User;

export interface Todo {
  id: string;
  title: string;
  priority: 1 | 2 | 3 | 4 | 5; // 星級緊急度
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed?: boolean; // 對齊資料庫欄位

  // 人員關係（共享機制）
  creator: string; // 建立者
  assignee?: string; // 被指派者（可選）
  visibility: string[]; // 可見人員ID列表 = [creator, assignee]

  // 關聯資料
  related_items: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt';
    id: string;
    title: string;
  }[];

  // 子任務
  sub_tasks: {
    id: string;
    title: string;
    done: boolean;
    completed_at?: string;
  }[];

  // 簡單備註（非留言板）
  notes: {
    timestamp: string;
    content: string;
    author_id: string;        // 留言者 ID
    author_name: string;      // 留言者名稱
  }[];

  // 快速功能設定
  enabled_quick_actions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[];

  // 通知標記
  needs_creator_notification?: boolean; // 被指派人有更新，需要通知建立者

  created_at: string;
  updated_at: string;
}

// 航班資訊
export interface FlightInfo {
  airline: string;  // 航空公司
  flightNumber: string;  // 班次
  departureAirport: string;  // 出發機場代碼（如：TPE）
  departureTime: string;  // 出發時間（如：06:50）
  departureDate?: string;  // 出發日期（如：10/21）
  arrivalAirport: string;  // 抵達機場代碼（如：FUK）
  arrivalTime: string;  // 抵達時間（如：09:55）
  duration?: string;  // 飛行時間（如：2小時5分）
}

// Tour 類型已移至 @/types/tour.types.ts
// 使用完整的 Tour 定義
export type { Tour } from '@/types/tour.types';

export interface Member {
  id: string;
  order_id: string;
  name: string;
  name_en: string; // 拼音
  birthday: string; // YYYY-MM-DD
  passport_number: string;
  passport_expiry: string; // YYYY-MM-DD
  id_number: string; // 身分證字號
  gender: 'M' | 'F' | ''; // 根據身分證自動判斷
  age: number; // 根據生日和出發日自動計算
  assigned_room?: string; // 分配的房間
  is_child_no_bed?: boolean; // 小孩不佔床
  reservation_code?: string; // 訂位代號
  add_ons?: string[]; // 加購項目IDs
  refunds?: string[]; // 退費項目IDs
  custom_fields?: Record<string, unknown>; // 自定義欄位數據 {fieldId: value}
  created_at: string;
  updated_at: string;
}

export interface TourAddOn {
  id: string;
  tour_id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TourRefund {
  id: string;
  tour_id: string;
  order_id: string;
  order_number: string;
  member_name: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'refunded' | 'rejected';
  applied_date: string;
  processed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 行程表相關型別
export interface ItineraryFeature {
  icon: string; // icon 名稱 (如: "IconBuilding")
  title: string;
  description: string;
}

export interface FocusCard {
  title: string;
  src: string; // 圖片 URL
}

export interface LeaderInfo {
  name: string;
  domesticPhone: string;
  overseasPhone: string;
}

export interface MeetingInfo {
  time: string; // ISO 8601 格式
  location: string;
}

export interface DailyActivity {
  icon: string; // emoji 或 icon
  title: string;
  description: string;
  image?: string;
}

export interface DailyMeals {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface DailyItineraryDay {
  dayLabel: string; // 如: "Day 1"
  date: string; // 如: "10/21 (二)"
  title: string;
  highlight?: string;
  description?: string;
  activities: DailyActivity[];
  recommendations: string[];
  meals: DailyMeals;
  accommodation: string;
  images?: string[];
}

export interface Itinerary {
  id: string;
  tour_id?: string; // 關聯的團 ID（選填，因為可能只是草稿）

  // 封面資訊
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  departureDate: string;
  tourCode: string;
  coverImage: string;
  country: string;
  city: string;
  status: 'draft' | 'published';

  // 航班資訊
  outboundFlight?: FlightInfo;
  returnFlight?: FlightInfo;

  // 行程特色
  features: ItineraryFeature[];

  // 精選景點
  focusCards: FocusCard[];

  // 領隊資訊
  leader?: LeaderInfo;

  // 集合資訊
  meetingInfo?: MeetingInfo;

  // 行程副標題
  itinerarySubtitle?: string;

  // 逐日行程
  dailyItinerary: DailyItineraryDay[];

  created_at: string;
  updated_at: string;
}

// Order 類型已移至 @/types/order.types.ts
// 使用完整的 Order 定義
export type { Order } from '@/types/order.types';

// Customer 類型已移至 @/types/customer.types.ts
// 使用完整的 Customer 定義，不再使用簡化版
export type { Customer } from '@/types/customer.types';

export interface Payment {
  id: string;
  type: 'receipt' | 'request' | 'disbursement';
  // receipt: 收款
  // request: 請款
  // disbursement: 出納
  order_id?: string;
  tour_id?: string;
  amount: number;
  description: string;
  status: 'pending' | 'confirmed' | 'completed';
  // pending: 待確認
  // confirmed: 已確認
  // completed: 已完成
  created_at: string;
  updated_at: string;
}

export interface QuoteRegion {
  id: string;
  quote_id: string;
  country: string;      // 國家 ID
  country_name: string; // 國家名稱
  region?: string;      // 地區 ID（可選）
  region_name?: string; // 地區名稱（可選）
  city: string;         // 城市 ID
  city_name: string;    // 城市名稱
  order: number;        // 順序
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  code?: string; // 報價單編號 (Q20250001 或自訂編號如 JP-BASIC)
  quote_number?: string; // 報價單號碼 (QUOTE-2025-0001) - 向下相容
  name: string; // 團體名稱
  status: 'draft' | 'proposed' | 'revised' | 'approved' | 'converted' | 'rejected';
  // draft: 草稿
  // proposed: 提案
  // revised: 修改中
  // approved: 已核准
  // converted: 已轉單
  // rejected: 已拒絕
  tour_id?: string; // 關聯的旅遊團ID
  converted_to_tour?: boolean; // 是否已轉成旅遊團
  is_pinned?: boolean; // 是否置頂（範本報價單）
  regions?: QuoteRegion[]; // 多地區支援（新）

  // 客戶資訊
  customer_name?: string; // 客戶名稱
  contact_person?: string; // 聯絡人
  contact_phone?: string; // 聯絡電話
  contact_email?: string; // Email

  // 需求資訊
  group_size: number; // 團體人數（向下相容：總人數）
  accommodation_days: number; // 住宿天數
  requirements?: string; // 需求說明
  budget_range?: string; // 預算範圍
  valid_until?: string; // 報價有效期
  payment_terms?: string; // 付款條件

  // 多身份人數統計
  participant_counts?: {
    adult: number; // 成人（雙人房）
    child_with_bed: number; // 小朋友（佔床）
    child_no_bed: number; // 不佔床
    single_room: number; // 單人房
    infant: number; // 嬰兒
  };

  // 多身份售價
  selling_prices?: {
    adult: number;
    child_with_bed: number;
    child_no_bed: number;
    single_room: number;
    infant: number;
  };

  categories: QuoteCategory[]; // 費用分類
  total_cost: number; // 總成本
  version?: number; // 版本號
  versions?: QuoteVersion[]; // 版本歷史
  created_at: string;
  updated_at: string;
}

export interface QuoteVersion {
  id: string;
  version: number;
  categories: QuoteCategory[];
  total_cost: number;
  group_size: number; // 團體人數
  accommodation_days: number; // 住宿天數
  participant_counts: {
    adult: number;
    child_with_bed: number;
    child_no_bed: number;
    single_room: number;
    infant: number;
  }; // 多身份人數統計
  selling_prices: {
    adult: number;
    child_with_bed: number;
    child_no_bed: number;
    single_room: number;
    infant: number;
  }; // 多身份售價
  note?: string; // 修改說明
  created_at: string;
}

export interface QuoteCategory {
  id: string;
  name: string;
  items: QuoteItem[];
  total: number;
}

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  note?: string;
  day?: number; // 住宿專用：第幾天
  room_type?: string; // 住宿專用：房型名稱
  is_group_cost?: boolean; // 交通和領隊導遊專用：團體分攤
  // 多身份計價：機票專用
  pricing_type?: 'uniform' | 'by_identity'; // uniform: 統一價格, by_identity: 依身份計價
  adult_price?: number; // 成人價
  child_price?: number; // 小朋友價
  infant_price?: number; // 嬰兒價
  created_at: string;
  updated_at: string;
}

// === 供應商管理系統 ===
// Supplier 類型已移至 @/types/supplier.types.ts
// 使用完整的 Supplier 定義
export type { Supplier, SupplierContact, SupplierBankInfo, PriceListItem } from '@/types/supplier.types';


// === 請款單管理系統 ===
export interface PaymentRequest {
  id: string;
  request_number: string; // REQ-2024001

  // 分配模式
  allocation_mode: 'single' | 'multiple'; // 單一團體 or 批量分配

  // 單一團體模式（向下相容）
  tour_id?: string; // 團號（allocation_mode = 'single' 時使用）
  code?: string; // CNX241225
  tour_name?: string; // 團體名稱快照

  // 批量分配模式（一筆帳分多團）
  tour_allocations?: TourAllocation[]; // 團體分配列表（allocation_mode = 'multiple' 時使用）

  // 共用欄位
  quote_id?: string; // 關聯的報價單ID
  order_id?: string; // 訂單ID（選填）
  order_number?: string; // 訂單號碼
  request_date: string; // 請款日期 (固定只能選每週四)
  items: PaymentRequestItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'paid';
  note?: string; // 請款備註
  budget_warning?: boolean; // 超預算警告
  created_by: string; // 建立者ID
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestItem {
  id: string;
  request_id: string; // 所屬請款單ID
  item_number: string; // REQ-2024001-001
  category: '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他';
  supplier_id: string;
  supplier_name: string; // 供應商名稱快照
  description: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  note?: string; // 項目備註
  sort_order: number; // 排序
  created_at: string;
  updated_at: string;
}

// 團體分配項目（用於批量分配）
export interface TourAllocation {
  tour_id: string; // 團號ID
  code: string; // 團體代碼
  tour_name: string; // 團體名稱
  allocated_amount: number; // 分配金額
}

// === 出納單管理系統 ===
export interface DisbursementOrder {
  id: string;
  order_number: string; // CD-2024001
  disbursement_date: string; // 出帳日期 (預設本週四)
  payment_request_ids: string[]; // 關聯的請款單ID陣列
  total_amount: number; // 總金額 (自動加總)
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled'; // 待確認、已確認、已付款、已取消
  note?: string; // 出納備註
  created_by: string; // 建立者ID
  confirmed_by?: string; // 確認者ID
  confirmed_at?: string; // 確認時間
  paid_at?: string; // 付款時間
  created_at: string;
  updated_at: string;
}

// === 收款單管理系統 ===
export interface ReceiptOrder {
  id: string;
  receipt_number: string; // REC-2024001

  // 分配模式
  allocation_mode: 'single' | 'multiple'; // 單一訂單 or 批量分配

  // 單一訂單模式（向下相容）
  order_id?: string; // 關聯的訂單ID（allocation_mode = 'single' 時使用）
  order_number?: string; // 訂單號碼快照
  tour_id?: string; // 團號
  code?: string; // 團體代碼
  tour_name?: string; // 團體名稱快照
  contact_person?: string; // 聯絡人快照

  // 批量分配模式（一筆款分多訂單）
  order_allocations?: OrderAllocation[]; // 訂單分配列表（allocation_mode = 'multiple' 時使用）

  // 共用欄位
  receipt_date: string; // 收款日期
  payment_items: ReceiptPaymentItem[]; // 收款項目
  total_amount: number; // 總收款金額
  status: ReceiptStatus; // 收款狀態
  note?: string; // 收款備註
  created_by: string; // 建立者ID
  confirmed_by?: string; // 確認者ID
  confirmed_at?: string; // 確認時間
  created_at: string;
  updated_at: string;
}

// 訂單分配項目（用於批量分配）
export interface OrderAllocation {
  order_id: string; // 訂單ID
  order_number: string; // 訂單號碼
  tour_id: string; // 團號
  code: string; // 團體代碼
  tour_name: string; // 團體名稱
  contact_person: string; // 聯絡人
  allocated_amount: number; // 分配金額
}

export interface ReceiptPaymentItem {
  id: string;
  receipt_id: string; // 所屬收款單ID
  payment_method: PaymentMethod; // 收款方式
  amount: number; // 金額
  account_info?: string; // 帳戶資訊 (匯款用)
  card_last_four?: string; // 卡號後四碼 (刷卡用)
  auth_code?: string; // 授權碼 (刷卡用)
  check_number?: string; // 支票號碼
  check_bank?: string; // 支票銀行
  check_due_date?: string; // 支票到期日
  transaction_date: string; // 交易日期
  handler_name?: string; // 經手人 (現金用)
  fees?: number; // 手續費
  note?: string; // 備註
  created_at: string;
  updated_at: string;
}

// === 簽證管理系統 ===
export interface Visa {
  id: string;

  // 申請人資訊
  applicant_name: string; // 申請人姓名
  contact_person: string; // 聯絡人
  contact_phone: string; // 聯絡電話

  // 簽證資訊
  visa_type: string; // 簽證類型（護照 成人、台胞證等）
  country: string; // 國家

  // 狀態
  status: VisaStatus;

  // 日期
  submission_date?: string; // 送件時間
  received_date?: string; // 下件時間
  pickup_date?: string; // 取件時間

  // 關聯資訊
  order_id: string; // 關聯的訂單ID
  order_number: string; // 訂單號碼快照
  tour_id: string; // 團號ID
  code: string; // 團體代碼 (tourCode)

  // 費用
  fee: number; // 代辦費
  cost: number; // 成本

  // 其他
  note?: string; // 備註
  created_by?: string; // 建立者ID
  created_at: string;
  updated_at: string;
}

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions';
