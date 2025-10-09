/**
 * 財務相關型別定義
 */

import { BaseEntity } from './base.types';

// ============================================
// 付款記錄介面
// ============================================

/**
 * Payment - 付款記錄
 */
export interface Payment extends BaseEntity {
  code: string;              // 付款編號
  order_id: string;          // 訂單 ID
  order_code?: string;       // 訂單編號（冗餘欄位）
  customer_id?: string;      // 客戶 ID
  customer_name?: string;    // 客戶姓名（冗餘欄位）
  amount: number;            // 金額
  payment_method: PaymentMethod; // 付款方式
  payment_date: string;      // 付款日期 (ISO 8601)
  status: PaymentStatus;     // 付款狀態
  transaction_id?: string;   // 交易編號
  receipt_number?: string;   // 收據編號
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
}

// ============================================
// 請款單介面
// ============================================

/**
 * PaymentRequest - 請款單
 */
export interface PaymentRequest extends BaseEntity {
  code: string;              // 請款單編號
  tour_id?: string;          // 旅遊團 ID
  tour_code?: string;        // 旅遊團編號（冗餘欄位）
  supplier_id?: string;      // 供應商 ID
  supplier_name?: string;    // 供應商名稱（冗餘欄位）
  requester_id: string;      // 請款人 ID
  requester_name?: string;   // 請款人姓名（冗餘欄位）
  request_date: string;      // 請款日期 (ISO 8601)
  total_amount: number;      // 總金額
  status: RequestStatus;     // 請款狀態
  approved_by?: string;      // 核准人 ID
  approved_at?: string;      // 核准時間 (ISO 8601)
  paid_by?: string;          // 付款人 ID
  paid_at?: string;          // 付款時間 (ISO 8601)
  payment_method?: PaymentMethod; // 付款方式
  description?: string;      // 說明
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
}

/**
 * PaymentRequestItem - 請款項目
 */
export interface PaymentRequestItem extends BaseEntity {
  request_id: string;        // 請款單 ID
  category: ExpenseCategory; // 費用類別
  description: string;       // 項目說明
  amount: number;            // 金額
  quantity: number;          // 數量
  unit_price: number;        // 單價
  notes?: string;            // 備註
}

// ============================================
// 出納單介面
// ============================================

/**
 * DisbursementOrder - 出納單
 */
export interface DisbursementOrder extends BaseEntity {
  code: string;              // 出納單編號
  tour_id?: string;          // 旅遊團 ID
  tour_code?: string;        // 旅遊團編號（冗餘欄位）
  payment_request_id?: string; // 請款單 ID
  recipient_type: RecipientType; // 收款人類型
  recipient_id?: string;     // 收款人 ID
  recipient_name: string;    // 收款人名稱
  amount: number;            // 金額
  payment_method: PaymentMethod; // 付款方式
  payment_date: string;      // 付款日期 (ISO 8601)
  status: DisbursementStatus; // 出納狀態
  description?: string;      // 說明
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
  created_by?: string;       // 建立人 ID
  approved_by?: string;      // 核准人 ID
  approved_at?: string;      // 核准時間 (ISO 8601)
}

// ============================================
// 收款單介面
// ============================================

/**
 * ReceiptOrder - 收款單
 */
export interface ReceiptOrder extends BaseEntity {
  code: string;              // 收款單編號
  order_id?: string;         // 訂單 ID
  order_code?: string;       // 訂單編號（冗餘欄位）
  customer_id: string;       // 客戶 ID
  customer_name?: string;    // 客戶姓名（冗餘欄位）
  total_amount: number;      // 總金額
  received_amount: number;   // 已收金額
  remaining_amount: number;  // 待收金額
  receipt_date: string;      // 收款日期 (ISO 8601)
  status: ReceiptStatus;     // 收款狀態
  description?: string;      // 說明
  notes?: string;            // 備註
  is_active: boolean;        // 是否啟用
}

/**
 * ReceiptPaymentItem - 收款項目
 */
export interface ReceiptPaymentItem extends BaseEntity {
  receipt_id: string;        // 收款單 ID
  amount: number;            // 金額
  payment_method: PaymentMethod; // 付款方式
  payment_date: string;      // 付款日期 (ISO 8601)
  transaction_id?: string;   // 交易編號
  notes?: string;            // 備註
}

// ============================================
// 財務狀態與類型
// ============================================

/**
 * PaymentMethod - 付款方式
 */
export type PaymentMethod =
  | 'cash'           // 現金
  | 'credit_card'    // 信用卡
  | 'debit_card'     // 金融卡
  | 'bank_transfer'  // 銀行轉帳
  | 'check'          // 支票
  | 'mobile_payment' // 行動支付
  | 'other';         // 其他

/**
 * PaymentStatus - 付款狀態
 */
export type PaymentStatus =
  | 'pending'    // 待處理
  | 'completed'  // 已完成
  | 'failed'     // 失敗
  | 'cancelled'  // 已取消
  | 'refunded';  // 已退款

/**
 * RequestStatus - 請款狀態
 */
export type RequestStatus =
  | 'draft'      // 草稿
  | 'submitted'  // 已提交
  | 'approved'   // 已核准
  | 'rejected'   // 已拒絕
  | 'paid'       // 已付款
  | 'cancelled'; // 已取消

/**
 * DisbursementStatus - 出納狀態
 */
export type DisbursementStatus =
  | 'pending'    // 待處理
  | 'approved'   // 已核准
  | 'paid'       // 已付款
  | 'rejected'   // 已拒絕
  | 'cancelled'; // 已取消

/**
 * ReceiptStatus - 收款狀態
 */
export type ReceiptStatus =
  | 'pending'    // 待收款
  | 'partial'    // 部分收款
  | 'completed'  // 已完成
  | 'cancelled'; // 已取消

/**
 * RecipientType - 收款人類型
 */
export type RecipientType =
  | 'supplier'   // 供應商
  | 'employee'   // 員工
  | 'guide'      // 導遊
  | 'other';     // 其他

/**
 * ExpenseCategory - 費用類別
 */
export type ExpenseCategory =
  | 'accommodation'  // 住宿
  | 'transportation' // 交通
  | 'meals'          // 餐飲
  | 'tickets'        // 門票
  | 'insurance'      // 保險
  | 'guide'          // 導遊
  | 'visa'           // 簽證
  | 'shopping'       // 購物
  | 'other';         // 其他

// ============================================
// 財務建立資料
// ============================================

/**
 * CreatePaymentData - 建立付款記錄
 */
export interface CreatePaymentData {
  code: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentStatus;
  transaction_id?: string;
  receipt_number?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * CreatePaymentRequestData - 建立請款單
 */
export interface CreatePaymentRequestData {
  code: string;
  tour_id?: string;
  supplier_id?: string;
  requester_id: string;
  request_date: string;
  total_amount: number;
  status: RequestStatus;
  description?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * CreateDisbursementOrderData - 建立出納單
 */
export interface CreateDisbursementOrderData {
  code: string;
  tour_id?: string;
  payment_request_id?: string;
  recipient_type: RecipientType;
  recipient_id?: string;
  recipient_name: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: DisbursementStatus;
  description?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * CreateReceiptOrderData - 建立收款單
 */
export interface CreateReceiptOrderData {
  code: string;
  order_id?: string;
  customer_id: string;
  total_amount: number;
  received_amount: number;
  receipt_date: string;
  status: ReceiptStatus;
  description?: string;
  notes?: string;
  is_active: boolean;
}

// ============================================
// 財務統計
// ============================================

/**
 * FinanceStats - 財務統計資料
 */
export interface FinanceStats {
  total_revenue: number;       // 總收入
  total_expense: number;       // 總支出
  net_profit: number;          // 淨利潤
  pending_payments: number;    // 待收款
  pending_disbursements: number; // 待付款
  monthly_revenue: number;     // 本月收入
  monthly_expense: number;     // 本月支出
  yearly_revenue: number;      // 年度收入
  yearly_expense: number;      // 年度支出
}
