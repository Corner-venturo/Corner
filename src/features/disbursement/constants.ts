/**
 * Disbursement 模組常數定義
 */

export const STATUS_LABELS = {
  pending: '已提交',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款',
} as const

export const STATUS_COLORS = {
  pending: 'bg-morandi-gold',
  processing: 'bg-status-info',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
} as const

export const DISBURSEMENT_STATUS_LABELS = {
  pending: '待確認',
  confirmed: '已確認',
  paid: '已付款',
} as const

export const DISBURSEMENT_STATUS_COLORS = {
  pending: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
} as const
