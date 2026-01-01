/**
 * Payment Receipt Types
 * 收款單相關型別定義
 */

export const RECEIPT_TYPES = {
  BANK_TRANSFER: 0, // 匯款
  CASH: 1, // 現金
  CREDIT_CARD: 2, // 刷卡
  CHECK: 3, // 支票
  LINK_PAY: 4, // LinkPay
} as const

export type ReceiptType = (typeof RECEIPT_TYPES)[keyof typeof RECEIPT_TYPES]

export const RECEIPT_TYPE_OPTIONS = [
  { value: RECEIPT_TYPES.CASH, label: '現金' },
  { value: RECEIPT_TYPES.BANK_TRANSFER, label: '匯款' },
  { value: RECEIPT_TYPES.CREDIT_CARD, label: '刷卡' },
  { value: RECEIPT_TYPES.CHECK, label: '支票' },
  { value: RECEIPT_TYPES.LINK_PAY, label: 'LinkPay' },
] as const

export const BANK_ACCOUNTS = [
  { value: '國泰', label: '國泰銀行' },
  { value: '合庫', label: '合作金庫' },
] as const

/**
 * 收款項目
 */
export interface PaymentItem {
  id: string
  receipt_type: ReceiptType
  amount: number
  transaction_date: string

  // 通用欄位
  receipt_account?: string // 付款人姓名
  note?: string // 備註

  // LinkPay 專屬
  email?: string
  pay_dateline?: string
  payment_name?: string

  // 現金專屬
  handler_name?: string // 經手人

  // 匯款專屬
  account_info?: string // 匯入帳戶
  fees?: number // 手續費

  // 刷卡專屬
  card_last_four?: string // 卡號後四碼
  auth_code?: string // 授權碼

  // 支票專屬
  check_number?: string // 支票號碼
  check_bank?: string // 開票銀行
  check_date?: string // 兌現日期
}

/**
 * 收款表單資料
 */
export interface PaymentFormData {
  tour_id: string
  order_id: string
  receipt_date: string
  note?: string
}
