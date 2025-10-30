// src/constants/index.ts (匯出所有常數)
export * from './locations'
export * from './tour-status'
export * from './order-status'
export * from './quote-status'
export * from './payment-status'
export * from './status-maps'

// 組合所有狀態顏色映射
import { TOUR_STATUS_COLORS, CONTRACT_STATUS_COLORS } from './tour-status'
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from './order-status'
import { QUOTE_STATUS_COLORS } from './quote-status'
import {
  PAYMENT_REQUEST_STATUS_COLORS,
  DISBURSEMENT_ORDER_STATUS_COLORS,
  RECEIPT_ORDER_STATUS_COLORS,
} from './payment-status'

export const STATUS_COLORS = {
  ...TOUR_STATUS_COLORS,
  ...CONTRACT_STATUS_COLORS,
  ...ORDER_STATUS_COLORS,
  ...PAYMENT_STATUS_COLORS,
  ...QUOTE_STATUS_COLORS,
  ...PAYMENT_REQUEST_STATUS_COLORS,
  ...DISBURSEMENT_ORDER_STATUS_COLORS,
  ...RECEIPT_ORDER_STATUS_COLORS,
} as const
