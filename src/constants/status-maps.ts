/**
 * 狀態值對照表
 * 用於將英文狀態值轉換為中文顯示
 */

// ============================================
// 旅遊團狀態對照表
// ============================================

export const TOUR_STATUS_MAP = {
  draft: '提案',
  active: '進行中',
  pending_close: '待結案',
  closed: '結案',
  cancelled: '已取消',
  special: '特殊團',
} as const

export const TOUR_STATUS_REVERSE_MAP = {
  提案: 'draft',
  進行中: 'active',
  待結案: 'pending_close',
  結案: 'closed',
  已取消: 'cancelled',
  特殊團: 'special',
} as const

export type TourStatusKey = keyof typeof TOUR_STATUS_MAP
export type TourStatusValue = (typeof TOUR_STATUS_MAP)[TourStatusKey]

// ============================================
// 訂單狀態對照表
// ============================================

export const ORDER_STATUS_MAP = {
  pending: '待確認',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消',
} as const

export const ORDER_STATUS_REVERSE_MAP = {
  待確認: 'pending',
  已確認: 'confirmed',
  已完成: 'completed',
  已取消: 'cancelled',
} as const

export type OrderStatusKey = keyof typeof ORDER_STATUS_MAP
export type OrderStatusValue = (typeof ORDER_STATUS_MAP)[OrderStatusKey]

// ============================================
// 付款狀態對照表
// ============================================

export const PAYMENT_STATUS_MAP = {
  unpaid: '未收款',
  partial: '部分收款',
  paid: '已收款',
  refunded: '已退款',
} as const

export const PAYMENT_STATUS_REVERSE_MAP = {
  未收款: 'unpaid',
  部分收款: 'partial',
  已收款: 'paid',
  已退款: 'refunded',
} as const

export type PaymentStatusKey = keyof typeof PAYMENT_STATUS_MAP
export type PaymentStatusValue = (typeof PAYMENT_STATUS_MAP)[PaymentStatusKey]

// ============================================
// 報價單狀態對照表
// ============================================

export const QUOTE_STATUS_MAP = {
  draft: '草稿',
  proposed: '提案中',
  revised: '已修訂',
  approved: '已核准',
  converted: '已轉單',
  rejected: '已拒絕',
} as const

export const QUOTE_STATUS_REVERSE_MAP = {
  草稿: 'draft',
  提案中: 'proposed',
  已修訂: 'revised',
  已核准: 'approved',
  已轉單: 'converted',
  已拒絕: 'rejected',
} as const

export type QuoteStatusKey = keyof typeof QUOTE_STATUS_MAP
export type QuoteStatusValue = (typeof QUOTE_STATUS_MAP)[QuoteStatusKey]

// ============================================
// 財務類型對照表
// ============================================

export const FINANCE_TYPE_MAP = {
  receipt: '收款',
  request: '請款',
  disbursement: '出納',
} as const

export const FINANCE_TYPE_REVERSE_MAP = {
  收款: 'receipt',
  請款: 'request',
  出納: 'disbursement',
} as const

export type FinanceTypeKey = keyof typeof FINANCE_TYPE_MAP
export type FinanceTypeValue = (typeof FINANCE_TYPE_MAP)[FinanceTypeKey]

// ============================================
// 合約狀態對照表
// ============================================

export const CONTRACT_STATUS_MAP = {
  unsigned: '未簽署',
  signed: '已簽署',
} as const

export const CONTRACT_STATUS_REVERSE_MAP = {
  未簽署: 'unsigned',
  已簽署: 'signed',
} as const

export type ContractStatusKey = keyof typeof CONTRACT_STATUS_MAP
export type ContractStatusValue = (typeof CONTRACT_STATUS_MAP)[ContractStatusKey]

// ============================================
// 收款狀態對照表
// ============================================

export const RECEIPT_STATUS_MAP = {
  received: '已收款',
  confirmed: '已確認',
  rejected: '退回',
} as const

export const RECEIPT_STATUS_REVERSE_MAP = {
  已收款: 'received',
  已確認: 'confirmed',
  退回: 'rejected',
} as const

export type ReceiptStatusKey = keyof typeof RECEIPT_STATUS_MAP
export type ReceiptStatusValue = (typeof RECEIPT_STATUS_MAP)[ReceiptStatusKey]

// ============================================
// 付款方式對照表
// ============================================

export const PAYMENT_METHOD_MAP = {
  cash: '現金',
  transfer: '匯款',
  card: '刷卡',
  check: '支票',
} as const

export const PAYMENT_METHOD_REVERSE_MAP = {
  現金: 'cash',
  匯款: 'transfer',
  刷卡: 'card',
  支票: 'check',
} as const

export type PaymentMethodKey = keyof typeof PAYMENT_METHOD_MAP
export type PaymentMethodValue = (typeof PAYMENT_METHOD_MAP)[PaymentMethodKey]

// ============================================
// 簽證狀態對照表
// ============================================

export const VISA_STATUS_MAP = {
  pending: '待送件',
  submitted: '已送件',
  issued: '已下件',
  collected: '已取件',
  rejected: '退件',
} as const

export const VISA_STATUS_REVERSE_MAP = {
  待送件: 'pending',
  已送件: 'submitted',
  已下件: 'issued',
  已取件: 'collected',
  退件: 'rejected',
} as const

export type VisaStatusKey = keyof typeof VISA_STATUS_MAP
export type VisaStatusValue = (typeof VISA_STATUS_MAP)[VisaStatusKey]

// ============================================
// 輔助函數
// ============================================

/**
 * 取得旅遊團狀態的中文顯示
 */
export function getTourStatusLabel(status: TourStatusKey | string): string {
  return TOUR_STATUS_MAP[status as TourStatusKey] || status
}

/**
 * 取得訂單狀態的中文顯示
 */
export function getOrderStatusLabel(status: OrderStatusKey | string): string {
  return ORDER_STATUS_MAP[status as OrderStatusKey] || status
}

/**
 * 取得付款狀態的中文顯示
 */
export function getPaymentStatusLabel(status: PaymentStatusKey | string): string {
  return PAYMENT_STATUS_MAP[status as PaymentStatusKey] || status
}

/**
 * 取得報價單狀態的中文顯示
 */
export function getQuoteStatusLabel(status: QuoteStatusKey | string): string {
  return QUOTE_STATUS_MAP[status as QuoteStatusKey] || status
}

/**
 * 取得財務類型的中文顯示
 */
export function getFinanceTypeLabel(type: FinanceTypeKey | string): string {
  return FINANCE_TYPE_MAP[type as FinanceTypeKey] || type
}

/**
 * 取得合約狀態的中文顯示
 */
export function getContractStatusLabel(status: ContractStatusKey | string): string {
  return CONTRACT_STATUS_MAP[status as ContractStatusKey] || status
}

/**
 * 取得收款狀態的中文顯示
 */
export function getReceiptStatusLabel(status: ReceiptStatusKey | string): string {
  return RECEIPT_STATUS_MAP[status as ReceiptStatusKey] || status
}

/**
 * 取得付款方式的中文顯示
 */
export function getPaymentMethodLabel(method: PaymentMethodKey | string): string {
  return PAYMENT_METHOD_MAP[method as PaymentMethodKey] || method
}

/**
 * 取得簽證狀態的中文顯示
 */
export function getVisaStatusLabel(status: VisaStatusKey | string): string {
  return VISA_STATUS_MAP[status as VisaStatusKey] || status
}
