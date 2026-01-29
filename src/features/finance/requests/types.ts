import { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import {
  PaymentRequestCategory,
  CompanyExpenseType,
} from '@/stores/types/finance.types'

export interface RequestFormData {
  request_category: PaymentRequestCategory // 請款類別（團體/公司）
  tour_id: string // 團體請款使用
  order_id: string // 團體請款使用
  expense_type: CompanyExpenseType | '' // 公司請款使用
  request_date: string
  notes: string
  is_special_billing: boolean
  created_by: string
}

export interface BatchRequestFormData {
  request_date: string
  notes: string
  is_special_billing: boolean
  created_by: string
}

export interface RequestItem {
  id: string
  category: PaymentRequestItem['category']
  supplier_id: string
  supplierName: string | null
  description: string
  unit_price: number
  quantity: number
}

export interface NewItemFormData {
  category: PaymentRequestItem['category']
  supplier_id: string
  description: string
  unit_price: number
  quantity: number
}

export const statusLabels: Record<'pending' | 'approved' | 'paid', string> = {
  pending: '請款中',
  approved: '已確認',
  paid: '已付款',
}

export const statusColors: Record<'pending' | 'approved' | 'paid', string> = {
  pending: 'bg-morandi-gold',
  approved: 'bg-morandi-green',
  paid: 'bg-morandi-primary',
}

export const categoryOptions = [
  { value: '匯款', label: '匯款' },
  { value: '住宿', label: '住宿' },
  { value: '交通', label: '交通' },
  { value: '餐食', label: '餐食' },
  { value: '門票', label: '門票' },
  { value: '導遊', label: '導遊' },
  { value: '保險', label: '保險' },
  { value: '出團款', label: '出團款' },
  { value: '回團款', label: '回團款' },
  { value: '員工代墊', label: '員工代墊' },
  { value: 'ESIM', label: 'ESIM' },
  { value: '同業', label: '同業' },
  { value: '其他', label: '其他' },
] as const


