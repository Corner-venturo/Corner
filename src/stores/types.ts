// ============================
// 核心型別定義
// ============================

// 正確的 User 型別（與 Employee 一致）
export interface User {
  id: string;
  employee_number: string;
  english_name: string;
  chinese_name: string;
  personal_info: {
    national_id: string;
    birthday: string;
    gender: 'male' | 'female';
    phone: string;
    email: string;
    address: string;
    emergency_contact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  job_info: {
    department: string;
    position: string;
    supervisor?: string;
    hireDate: string;
    probationEndDate?: string;
    employmentType: 'fulltime' | 'parttime' | 'contract';
  };
  salary_info: {
    baseSalary: number;
    allowances: {
      type: string;
      amount: number;
    }[];
    salaryHistory: {
      effectiveDate: string;
      baseSalary: number;
      reason: string;
    }[];
  };
  permissions: string[];
  attendance: {
    leaveRecords: {
      id: string;
      type: 'annual' | 'sick' | 'personal' | 'maternity' | 'other';
      start_date: string;
      end_date: string;
      days: number;
      reason?: string;
      status: 'pending' | 'approved' | 'rejected';
      approvedBy?: string;
    }[];
    overtimeRecords: {
      id: string;
      date: string;
      hours: number;
      reason: string;
      approvedBy?: string;
    }[];
  };
  contracts: {
    id: string;
    type: 'employment' | 'probation' | 'renewal';
    start_date: string;
    end_date?: string;
    filePath?: string;
    notes?: string;
  }[];
  status: 'active' | 'probation' | 'leave' | 'terminated';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
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
  relatedItems: {
    type: 'group' | 'quote' | 'order' | 'invoice' | 'receipt';
    id: string;
    title: string;
  }[];

  // 子任務
  subTasks: {
    id: string;
    title: string;
    done: boolean;
    completedAt?: string;
  }[];

  // 簡單備註（非留言板）
  notes: {
    timestamp: string;
    content: string;
  }[];

  // 快速功能設定
  enabledQuickActions: ('receipt' | 'invoice' | 'group' | 'quote' | 'assign')[];

  // 通知標記
  needsCreatorNotification?: boolean; // 被指派人有更新，需要通知建立者

  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  code: string;
  name: string;
  departure_date: string;
  return_date: string;
  status: '提案' | '進行中' | '待結案' | '結案' | '特殊團';
  location: string;
  price: number;
  max_participants: number; // 最大參與人數
  contract_status: '未簽署' | '已簽署';
  total_revenue: number;
  total_cost: number;
  profit: number;
  quote_id?: string; // 關聯的報價單ID
  quote_cost_structure?: QuoteCategory[]; // 報價成本結構快照
  created_at: string;
  updated_at: string;
}

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
  custom_fields?: Record<string, any>; // 自定義欄位數據 {fieldId: value}
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
  status: '申請中' | '已核准' | '已退款' | '已拒絕';
  applied_date: string;
  processed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  tour_id: string;
  code: string;
  tour_name: string;
  contact_person: string;
  sales_person: string;
  assistant: string;
  member_count: number; // 訂單人數
  payment_status: '未收款' | '部分收款' | '已收款';
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  orders: string[]; // order IDs
  tours: string[]; // tour IDs
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  type: '收款' | '請款' | '出納';
  order_id?: string;
  tour_id?: string;
  amount: number;
  description: string;
  status: '待確認' | '已確認' | '已完成';
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number?: string; // 報價單號碼 (QUOTE-2025-0001)
  name: string; // 團體名稱
  status: '提案' | '最終版本';
  tour_id?: string; // 關聯的旅遊團ID

  // 客戶資訊
  customer_name?: string; // 客戶名稱
  contact_person?: string; // 聯絡人
  contact_phone?: string; // 聯絡電話
  contact_email?: string; // Email

  // 需求資訊
  group_size: number; // 團體人數
  accommodation_days: number; // 住宿天數
  requirements?: string; // 需求說明
  budget_range?: string; // 預算範圍
  valid_until?: string; // 報價有效期
  payment_terms?: string; // 付款條件

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
}

// === 供應商管理系統 ===
export interface Supplier {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'transport' | 'ticket' | 'guide' | 'other';
  contact: SupplierContact;
  bankInfo?: SupplierBankInfo;
  price_list: PriceListItem[];
  status: 'active' | 'inactive';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierContact {
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
}

export interface SupplierBankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  branch?: string;
}

export interface PriceListItem {
  id: string;
  supplier_id: string; // 對齊資料庫：加入供應商ID
  item_name: string;
  category: string;
  unit_price: number;
  unit: string; // 單位：晚、台、人、次等
  seasonality?: 'peak' | 'regular' | 'off';
  validFrom?: string;
  validTo?: string;
  note?: string;
  created_at: string;
}


// === 請款單管理系統 ===
export interface PaymentRequest {
  id: string;
  request_number: string; // REQ-2024001
  tour_id: string; // 團號
  code: string; // CNX241225
  tour_name: string; // 團體名稱快照
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

// === 出納單管理系統 ===
export interface DisbursementOrder {
  id: string;
  order_number: string; // CD-2024001
  disbursement_date: string; // 出帳日期 (預設本週四)
  payment_request_ids: string[]; // 關聯的請款單ID陣列
  total_amount: number; // 總金額 (自動加總)
  status: 'pending' | 'confirmed' | 'paid'; // 待確認、已確認、已付款
  note?: string; // 出納備註
  created_by: string; // 建立者ID
  confirmedBy?: string; // 確認者ID
  confirmedAt?: string; // 確認時間
  paidAt?: string; // 付款時間
  created_at: string;
  updated_at: string;
}

// === 收款單管理系統 ===
export interface ReceiptOrder {
  id: string;
  receipt_number: string; // REC-2024001
  order_id: string; // 關聯的訂單ID
  order_number: string; // 訂單號碼快照
  tour_id: string; // 團號
  code: string; // 團體代碼
  tour_name: string; // 團體名稱快照
  contact_person: string; // 聯絡人快照
  receipt_date: string; // 收款日期
  payment_items: ReceiptPaymentItem[]; // 收款項目
  total_amount: number; // 總收款金額
  status: '已收款' | '已確認' | '退回'; // 收款狀態
  note?: string; // 收款備註
  created_by: string; // 建立者ID
  confirmedBy?: string; // 確認者ID
  confirmedAt?: string; // 確認時間
  created_at: string;
  updated_at: string;
}

export interface ReceiptPaymentItem {
  id: string;
  receipt_id: string; // 所屬收款單ID
  payment_method: '現金' | '匯款' | '刷卡' | '支票'; // 收款方式
  amount: number; // 金額
  accountInfo?: string; // 帳戶資訊 (匯款用)
  cardLastFour?: string; // 卡號後四碼 (刷卡用)
  authCode?: string; // 授權碼 (刷卡用)
  checkNumber?: string; // 支票號碼
  checkBank?: string; // 支票銀行
  checkDueDate?: string; // 支票到期日
  transaction_date: string; // 交易日期
  handlerName?: string; // 經手人 (現金用)
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
  status: '待送件' | '已送件' | '已下件' | '已取件' | '退件';

  // 日期
  submissionDate?: string; // 送件時間
  receivedDate?: string; // 下件時間
  pickupDate?: string; // 取件時間

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
  createdBy?: string; // 建立者ID
  created_at: string;
  updated_at: string;
}

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions';
