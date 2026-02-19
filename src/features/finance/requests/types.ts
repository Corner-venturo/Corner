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
  tour_request_id?: string | null // 關聯的需求單 ID
}

export interface NewItemFormData {
  category: PaymentRequestItem['category']
  supplier_id: string
  description: string
  unit_price: number
  quantity: number
}

import { REQUEST_TYPE_LABELS } from '../constants/labels'

export const statusLabels: Record<'pending' | 'confirmed' | 'billed', string> = {
  pending: REQUEST_TYPE_LABELS.STATUS_PENDING,
  confirmed: REQUEST_TYPE_LABELS.STATUS_CONFIRMED,
  billed: REQUEST_TYPE_LABELS.STATUS_BILLED,
}

export const statusColors: Record<'pending' | 'confirmed' | 'billed', string> = {
  pending: 'bg-morandi-gold',
  confirmed: 'bg-status-info',
  billed: 'bg-morandi-green',
}

export const categoryOptions = [
  { value: REQUEST_TYPE_LABELS.CAT_ACCOMMODATION, label: REQUEST_TYPE_LABELS.CAT_ACCOMMODATION },
  { value: REQUEST_TYPE_LABELS.CAT_TRANSPORTATION, label: REQUEST_TYPE_LABELS.CAT_TRANSPORTATION },
  { value: REQUEST_TYPE_LABELS.CAT_MEAL, label: REQUEST_TYPE_LABELS.CAT_MEAL },
  { value: REQUEST_TYPE_LABELS.CAT_TICKET, label: REQUEST_TYPE_LABELS.CAT_TICKET },
  { value: REQUEST_TYPE_LABELS.CAT_GUIDE, label: REQUEST_TYPE_LABELS.CAT_GUIDE },
  { value: REQUEST_TYPE_LABELS.CAT_INSURANCE, label: REQUEST_TYPE_LABELS.CAT_INSURANCE },
  { value: REQUEST_TYPE_LABELS.CAT_TOUR_ADVANCE, label: REQUEST_TYPE_LABELS.CAT_TOUR_ADVANCE },
  { value: REQUEST_TYPE_LABELS.CAT_TOUR_RETURN, label: REQUEST_TYPE_LABELS.CAT_TOUR_RETURN },
  { value: REQUEST_TYPE_LABELS.CAT_EMPLOYEE_ADVANCE, label: REQUEST_TYPE_LABELS.CAT_EMPLOYEE_ADVANCE },
  { value: 'ESIM', label: 'ESIM' },
  { value: REQUEST_TYPE_LABELS.CAT_PEER, label: REQUEST_TYPE_LABELS.CAT_PEER },
  { value: REQUEST_TYPE_LABELS.CAT_OTHER, label: REQUEST_TYPE_LABELS.CAT_OTHER },
] as const


