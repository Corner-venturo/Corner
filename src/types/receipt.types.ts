/**
 * 收款系統型別定義
 */

// ============================================
// 收款單（Receipt）
// ============================================

export interface Receipt {
  id: string
  receipt_number: string // R2501280001
  workspace_id: string
  order_id: string | null
  order_number: string | null
  tour_name: string | null

  // 收款資訊
  receipt_date: string // ISO date
  receipt_type: ReceiptType // 0:匯款 1:現金 2:刷卡 3:支票 4:LinkPay
  receipt_amount: number // 應收金額
  actual_amount: number // 實收金額
  status: ReceiptStatus // 0:待確認 1:已確認 2:異常

  // 收款方式相關欄位
  receipt_account: string | null // 付款人姓名/收款帳號
  email: string | null // Email（LinkPay 用）
  payment_name: string | null // 付款名稱（LinkPay 客戶看到的標題）
  pay_dateline: string | null // 付款截止日（LinkPay 用）

  // 各收款方式詳細欄位
  handler_name: string | null // 經手人（現金用）
  account_info: string | null // 匯入帳戶（匯款用）
  fees: number | null // 手續費（匯款用）
  card_last_four: string | null // 卡號後四碼（刷卡用）
  auth_code: string | null // 授權碼（刷卡用）
  check_number: string | null // 支票號碼
  check_bank: string | null // 開票銀行

  note: string | null

  // 系統欄位
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
}

// ============================================
// LinkPay 記錄
// ============================================

export interface LinkPayLog {
  id: string
  receipt_number: string
  workspace_id: string

  // LinkPay 資訊
  linkpay_order_number: string | null // LinkPay 訂單號（API 返回）
  price: number
  end_date: string | null // ISO date
  link: string | null // 付款連結
  status: LinkPayStatus // 0:待付款 1:已付款 2:失敗 3:過期
  payment_name: string | null

  // 系統欄位
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// ============================================
// 列舉與常數
// ============================================

/**
 * 收款方式
 */
export enum ReceiptType {
  BANK_TRANSFER = 0, // 匯款
  CASH = 1, // 現金
  CREDIT_CARD = 2, // 刷卡
  CHECK = 3, // 支票
  LINK_PAY = 4, // LinkPay
}

export const RECEIPT_TYPE_LABELS: Record<ReceiptType, string> = {
  [ReceiptType.BANK_TRANSFER]: '匯款',
  [ReceiptType.CASH]: '現金',
  [ReceiptType.CREDIT_CARD]: '刷卡',
  [ReceiptType.CHECK]: '支票',
  [ReceiptType.LINK_PAY]: 'LinkPay',
}

/**
 * 收款狀態
 */
export enum ReceiptStatus {
  PENDING = 0, // 待確認（業務建立，會計待填實收金額）
  CONFIRMED = 1, // 已確認（會計已確認實收金額）
}

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PENDING]: '待確認',
  [ReceiptStatus.CONFIRMED]: '已確認',
}

export const RECEIPT_STATUS_COLORS: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PENDING]: 'text-morandi-gold',
  [ReceiptStatus.CONFIRMED]: 'text-morandi-green',
}

export const RECEIPT_STATUS_ICONS: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PENDING]: '🟡',
  [ReceiptStatus.CONFIRMED]: '✅',
}

/**
 * LinkPay 狀態
 */
export enum LinkPayStatus {
  PENDING = 0, // 待付款
  PAID = 1, // 已付款
  ERROR = 2, // 失敗
  EXPIRED = 3, // 過期
}

export const LINKPAY_STATUS_LABELS: Record<LinkPayStatus, string> = {
  [LinkPayStatus.PENDING]: '待付款',
  [LinkPayStatus.PAID]: '已付款',
  [LinkPayStatus.ERROR]: '失敗',
  [LinkPayStatus.EXPIRED]: '過期',
}

export const LINKPAY_STATUS_COLORS: Record<LinkPayStatus, string> = {
  [LinkPayStatus.PENDING]: 'text-morandi-gold',
  [LinkPayStatus.PAID]: 'text-morandi-green',
  [LinkPayStatus.ERROR]: 'text-morandi-red',
  [LinkPayStatus.EXPIRED]: 'text-morandi-secondary',
}

// ============================================
// 輔助函數
// ============================================

/**
 * 取得收款方式名稱
 */
export function getReceiptTypeName(type: ReceiptType): string {
  return RECEIPT_TYPE_LABELS[type] || '未知'
}

/**
 * 取得收款狀態名稱
 */
export function getReceiptStatusName(status: ReceiptStatus): string {
  return RECEIPT_STATUS_LABELS[status] || '未知'
}

/**
 * 取得收款狀態顏色
 */
export function getReceiptStatusColor(status: ReceiptStatus): string {
  return RECEIPT_STATUS_COLORS[status] || 'text-gray-600'
}

// ============================================
// 表單資料型別
// ============================================

/**
 * 建立收款單的表單資料
 */
export interface CreateReceiptData {
  workspace_id: string
  order_id: string
  order_number: string
  tour_name?: string
  receipt_date: string
  receipt_type: ReceiptType
  receipt_amount: number
  actual_amount?: number
  status?: ReceiptStatus

  // 收款方式相關欄位（根據 receipt_type 決定）
  receipt_account?: string
  email?: string
  payment_name?: string
  pay_dateline?: string
  handler_name?: string
  account_info?: string
  fees?: number
  card_last_four?: string
  auth_code?: string
  check_number?: string
  check_bank?: string
  note?: string
}

/**
 * 更新收款單的表單資料
 */
export interface UpdateReceiptData {
  actual_amount?: number
  status?: ReceiptStatus
  note?: string
}

/**
 * 收款項目（UI 表單用）
 */
export interface ReceiptItem {
  id: string // 臨時 ID（前端用）
  receipt_type: ReceiptType
  amount: number
  transaction_date: string

  // 各收款方式的欄位
  receipt_account?: string
  email?: string
  payment_name?: string
  pay_dateline?: string
  handler_name?: string
  account_info?: string
  fees?: number
  card_last_four?: string
  auth_code?: string
  check_number?: string
  check_bank?: string
  note?: string

  // LinkPay 相關（儲存後才有）
  linkpay_order_number?: string
  link?: string
  linkpay_status?: LinkPayStatus
}
