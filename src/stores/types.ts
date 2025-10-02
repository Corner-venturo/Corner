// ============================
// 核心型別定義
// ============================

// 正確的 User 型別（與 Employee 一致）
export interface User {
  id: string;
  employeeNumber: string;
  englishName: string;
  chineseName: string;
  personalInfo: {
    nationalId: string;
    birthday: string;
    gender: 'male' | 'female';
    phone: string;
    email: string;
    address: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  jobInfo: {
    department: string;
    position: string;
    supervisor?: string;
    hireDate: string;
    probationEndDate?: string;
    employmentType: 'fulltime' | 'parttime' | 'contract';
  };
  salaryInfo: {
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
      startDate: string;
      endDate: string;
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
    startDate: string;
    endDate?: string;
    filePath?: string;
    notes?: string;
  }[];
  status: 'active' | 'probation' | 'leave' | 'terminated';
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
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

  createdAt: string;
  updatedAt: string;
}

export interface Tour {
  id: string;
  code: string;
  name: string;
  departureDate: string;
  returnDate: string;
  status: '提案' | '進行中' | '待結案' | '結案' | '特殊團';
  location: string;
  price: number;
  maxParticipants: number; // 最大參與人數
  contractStatus: '未簽署' | '已簽署';
  totalRevenue: number;
  totalCost: number;
  profit: number;
  quoteId?: string; // 關聯的報價單ID
  quoteCostStructure?: QuoteCategory[]; // 報價成本結構快照
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  orderId: string;
  name: string;
  nameEn: string; // 拼音
  birthday: string; // YYYY-MM-DD
  passportNumber: string;
  passportExpiry: string; // YYYY-MM-DD
  idNumber: string; // 身分證字號
  gender: 'M' | 'F' | ''; // 根據身分證自動判斷
  age: number; // 根據生日和出發日自動計算
  assignedRoom?: string; // 分配的房間
  isChildNoBed?: boolean; // 小孩不佔床
  reservationCode?: string; // 訂位代號
  addOns?: string[]; // 加購項目IDs
  refunds?: string[]; // 退費項目IDs
  customFields?: Record<string, any>; // 自定義欄位數據 {fieldId: value}
  createdAt: string;
  updatedAt: string;
}

export interface TourAddOn {
  id: string;
  tourId: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TourRefund {
  id: string;
  tourId: string;
  orderId: string;
  orderNumber: string;
  memberName: string;
  reason: string;
  amount: number;
  status: '申請中' | '已核准' | '已退款' | '已拒絕';
  appliedDate: string;
  processedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tourId: string;
  code: string;
  tourName: string;
  contactPerson: string;
  salesPerson: string;
  assistant: string;
  memberCount: number; // 訂單人數
  paymentStatus: '未收款' | '部分收款' | '已收款';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  orders: string[]; // order IDs
  tours: string[]; // tour IDs
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  type: '收款' | '請款' | '出納';
  orderId?: string;
  tourId?: string;
  amount: number;
  description: string;
  status: '待確認' | '已確認' | '已完成';
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber?: string; // 報價單號碼 (QUOTE-2025-0001)
  name: string; // 團體名稱
  status: '提案' | '最終版本';
  tourId?: string; // 關聯的旅遊團ID

  // 客戶資訊
  customerName?: string; // 客戶名稱
  contactPerson?: string; // 聯絡人
  contactPhone?: string; // 聯絡電話
  contactEmail?: string; // Email

  // 需求資訊
  groupSize: number; // 團體人數
  accommodationDays: number; // 住宿天數
  requirements?: string; // 需求說明
  budgetRange?: string; // 預算範圍
  validUntil?: string; // 報價有效期
  paymentTerms?: string; // 付款條件

  categories: QuoteCategory[]; // 費用分類
  totalCost: number; // 總成本
  version?: number; // 版本號
  versions?: QuoteVersion[]; // 版本歷史
  createdAt: string;
  updatedAt: string;
}

export interface QuoteVersion {
  id: string;
  version: number;
  categories: QuoteCategory[];
  totalCost: number;
  note?: string; // 修改說明
  createdAt: string;
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
  unitPrice: number;
  total: number;
  note?: string;
  day?: number; // 住宿專用：第幾天
  roomType?: string; // 住宿專用：房型名稱
  isGroupCost?: boolean; // 交通和領隊導遊專用：團體分攤
}

// === 供應商管理系統 ===
export interface Supplier {
  id: string;
  name: string;
  type: 'hotel' | 'restaurant' | 'transport' | 'ticket' | 'guide' | 'other';
  contact: SupplierContact;
  bankInfo?: SupplierBankInfo;
  priceList: PriceListItem[];
  status: 'active' | 'inactive';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierContact {
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
}

export interface SupplierBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}

export interface PriceListItem {
  id: string;
  supplierId: string; // 對齊資料庫：加入供應商ID
  itemName: string;
  category: string;
  unitPrice: number;
  unit: string; // 單位：晚、台、人、次等
  seasonality?: 'peak' | 'regular' | 'off';
  validFrom?: string;
  validTo?: string;
  note?: string;
  createdAt: string;
}


// === 請款單管理系統 ===
export interface PaymentRequest {
  id: string;
  requestNumber: string; // REQ-2024001
  tourId: string; // 團號
  code: string; // CNX241225
  tourName: string; // 團體名稱快照
  quoteId?: string; // 關聯的報價單ID
  orderId?: string; // 訂單ID（選填）
  orderNumber?: string; // 訂單號碼
  requestDate: string; // 請款日期 (固定只能選每週四)
  items: PaymentRequestItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'paid';
  note?: string; // 請款備註
  budgetWarning?: boolean; // 超預算警告
  createdBy: string; // 建立者ID
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestItem {
  id: string;
  requestId: string; // 所屬請款單ID
  itemNumber: string; // REQ-2024001-001
  category: '住宿' | '交通' | '餐食' | '門票' | '導遊' | '其他';
  supplierId: string;
  supplierName: string; // 供應商名稱快照
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  note?: string; // 項目備註
  sortOrder: number; // 排序
  createdAt: string;
  updatedAt: string;
}

// === 出納單管理系統 ===
export interface DisbursementOrder {
  id: string;
  orderNumber: string; // CD-2024001
  disbursementDate: string; // 出帳日期 (預設本週四)
  paymentRequestIds: string[]; // 關聯的請款單ID陣列
  totalAmount: number; // 總金額 (自動加總)
  status: 'pending' | 'confirmed' | 'paid'; // 待確認、已確認、已付款
  note?: string; // 出納備註
  createdBy: string; // 建立者ID
  confirmedBy?: string; // 確認者ID
  confirmedAt?: string; // 確認時間
  paidAt?: string; // 付款時間
  createdAt: string;
  updatedAt: string;
}

// === 收款單管理系統 ===
export interface ReceiptOrder {
  id: string;
  receiptNumber: string; // REC-2024001
  orderId: string; // 關聯的訂單ID
  orderNumber: string; // 訂單號碼快照
  tourId: string; // 團號
  code: string; // 團體代碼
  tourName: string; // 團體名稱快照
  contactPerson: string; // 聯絡人快照
  receiptDate: string; // 收款日期
  paymentItems: ReceiptPaymentItem[]; // 收款項目
  totalAmount: number; // 總收款金額
  status: '已收款' | '已確認' | '退回'; // 收款狀態
  note?: string; // 收款備註
  createdBy: string; // 建立者ID
  confirmedBy?: string; // 確認者ID
  confirmedAt?: string; // 確認時間
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptPaymentItem {
  id: string;
  receiptId: string; // 所屬收款單ID
  paymentMethod: '現金' | '匯款' | '刷卡' | '支票'; // 收款方式
  amount: number; // 金額
  accountInfo?: string; // 帳戶資訊 (匯款用)
  cardLastFour?: string; // 卡號後四碼 (刷卡用)
  authCode?: string; // 授權碼 (刷卡用)
  checkNumber?: string; // 支票號碼
  checkBank?: string; // 支票銀行
  checkDueDate?: string; // 支票到期日
  transactionDate: string; // 交易日期
  handlerName?: string; // 經手人 (現金用)
  fees?: number; // 手續費
  note?: string; // 備註
  createdAt: string;
  updatedAt: string;
}

// === 簽證管理系統 ===
export interface Visa {
  id: string;

  // 申請人資訊
  applicantName: string; // 申請人姓名
  contactPerson: string; // 聯絡人
  contactPhone: string; // 聯絡電話

  // 簽證資訊
  visaType: string; // 簽證類型（護照 成人、台胞證等）
  country: string; // 國家

  // 狀態
  status: '待送件' | '已送件' | '已下件' | '已取件' | '退件';

  // 日期
  submissionDate?: string; // 送件時間
  receivedDate?: string; // 下件時間
  pickupDate?: string; // 取件時間

  // 關聯資訊
  orderId: string; // 關聯的訂單ID
  orderNumber: string; // 訂單號碼快照
  tourId: string; // 團號ID
  code: string; // 團體代碼 (tourCode)

  // 費用
  fee: number; // 代辦費
  cost: number; // 成本

  // 其他
  note?: string; // 備註
  createdBy?: string; // 建立者ID
  createdAt: string;
  updatedAt: string;
}

// 系統功能權限清單 - 從統一配置自動生成
export { SYSTEM_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/permissions';
