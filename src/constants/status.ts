// src/constants/status.ts
export const TOUR_STATUS = {
  PROPOSAL: '提案',
  IN_PROGRESS: '進行中',
  PENDING_CLOSE: '待結案',
  CLOSED: '結案',
  SPECIAL: '特殊團'
} as const;

export const ORDER_STATUS = {
  UNPAID: '未收款',
  PARTIAL: '部分收款',
  PAID: '已收款'
} as const;

export const TODO_STATUS = {
  PENDING: '待辦',
  IN_PROGRESS: '進行中',
  COMPLETED: '完成'
} as const;