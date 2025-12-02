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

export const statusLabels: Record<string, string> = {
  pending: '請款中',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款',
}

export const statusColors: Record<string, string> = {
  pending: 'bg-morandi-gold',
  processing: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
}

// @ts-expect-error - Const assertion compatibility
export const categoryOptions: Array<{ value: string; label: string }> = [
  { value: '住宿', label: '🏨 住宿' },
  { value: '交通', label: '🚌 交通' },
  { value: '餐食', label: '🍽️ 餐食' },
  { value: '門票', label: '🎫 門票' },
  { value: '導遊', label: '👥 導遊' },
  { value: '其他', label: '📦 其他' },
]
