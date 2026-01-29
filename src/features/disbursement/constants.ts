/**
 * Disbursement 模組常數定義
 * 注意：與 status-config.ts 保持同步
 * 出納單狀態流程：pending（待確認）→ confirmed（已確認）→ paid（已付款）
 */

// 出納單狀態標籤
export const DISBURSEMENT_STATUS_LABELS = {
  pending: '待確認',
  confirmed: '已確認',
  paid: '已付款',
} as const

// 出納單狀態顏色
export const DISBURSEMENT_STATUS_COLORS = {
  pending: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
} as const

// 出納單狀態設定（合併 label + color）
export const DISBURSEMENT_STATUS = {
  pending: { label: '待出帳', color: 'bg-morandi-gold' },
  confirmed: { label: '已確認', color: 'bg-status-info' },
  paid: { label: '已出帳', color: 'bg-morandi-green' },
} as const

// 請款單狀態標籤（Payment Request）
export const PAYMENT_REQUEST_STATUS_LABELS = {
  pending: '待處理',
  approved: '已核准',
  paid: '已付款',
} as const

// 請款單狀態顏色
export const PAYMENT_REQUEST_STATUS_COLORS = {
  pending: 'bg-morandi-gold',
  approved: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
} as const
