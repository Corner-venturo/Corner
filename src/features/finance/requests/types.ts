import { PaymentRequest, PaymentRequestItem } from '@/stores/types'

export interface RequestFormData {
  tour_id: string
  order_id: string
  request_date: string
  note: string
  is_special_billing: boolean
  created_by: string
}

export interface BatchRequestFormData {
  request_date: string
  note: string
  is_special_billing: boolean
  created_by: string
}

export interface RequestItem {
  id: string
  category: PaymentRequestItem['category']
  supplier_id: string
  supplierName: string
  description: string
  unit_price: number
  quantity: number
  payment_method?: 'transfer' | 'check' | 'cash'
  custom_request_date?: string // 支票日期（只有選支票時才填）
}

export interface NewItemFormData {
  category: PaymentRequestItem['category']
  supplier_id: string
  description: string
  unit_price: number
  quantity: number
  payment_method?: 'transfer' | 'check' | 'cash'
  custom_request_date?: string // 支票日期（只有選支票時才填）
}

// 請款單狀態流轉:
// pending (請款中) -> approved (已核准) -> processing (出帳中) -> paid (已付款)
//                  -> rejected (已駁回)
export const statusLabels: Record<string, string> = {
  pending: '請款中',
  approved: '已核准',
  processing: '出帳中',
  confirmed: '已確認',
  paid: '已付款',
  rejected: '已駁回',
}

export const statusColors: Record<string, string> = {
  pending: 'bg-morandi-gold',
  approved: 'bg-blue-500',
  processing: 'bg-orange-500',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
  rejected: 'bg-red-500',
}

// 狀態流轉規則
export const statusTransitions: Record<string, string[]> = {
  pending: ['approved', 'rejected'],  // 請款中 -> 可核准或駁回
  approved: ['processing', 'pending'], // 已核准 -> 可加入出帳或退回
  processing: ['paid', 'approved'],    // 出帳中 -> 可標記已付款或退回
  paid: [],                            // 已付款 -> 終態
  rejected: ['pending'],               // 已駁回 -> 可重新提交
  confirmed: ['paid'],                 // 已確認 -> 已付款（兼容舊狀態）
}

// 取得下一個可用狀態
export function getNextStatuses(currentStatus: string): string[] {
  return statusTransitions[currentStatus] || []
}

export const categoryOptions: Array<{ value: string; label: string }> = [
  { value: '住宿', label: '🏨 住宿' },
  { value: '交通', label: '🚌 交通' },
  { value: '餐食', label: '🍽️ 餐食' },
  { value: '門票', label: '🎫 門票' },
  { value: '導遊', label: '👥 導遊' },
  { value: '保險', label: '🛡️ 保險' },
  { value: '出團款', label: '💰 出團款' },
  { value: '回團款', label: '💵 回團款' },
  { value: '員工代墊', label: '👤 員工代墊' },
  { value: 'ESIM', label: '📱 ESIM' },
  { value: '同業', label: '🤝 同業' },
  { value: '其他', label: '📦 其他' },
]
