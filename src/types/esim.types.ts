import type { Database } from './supabase'

// eSIM 狀態（參考 CornerERP）
export const ESIM_STATUSES = {
  UNCONFIRMED: 0, // 待確認
  CONFIRMED: 1, // 已確認
  ERROR: 2, // 錯誤
} as const

export type EsimStatus = (typeof ESIM_STATUSES)[keyof typeof ESIM_STATUSES]

// eSIM 資料表型別
export type EsimRow = Database['public']['Tables']['esims']['Row']
export type EsimInsert = Database['public']['Tables']['esims']['Insert']
export type EsimUpdate = Database['public']['Tables']['esims']['Update']

// eSIM 實體
export interface Esim {
  id: string
  workspace_id: string
  esim_number: string
  group_code: string
  order_number?: string
  supplier_order_number?: string
  status: EsimStatus
  product_id?: string
  quantity: number
  email?: string
  note?: string
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
  // 關聯資料
  tour?: {
    code: string
    name: string
  }
  order?: {
    code: string
    customer_name: string
  }
}

// eSIM 表單資料
export interface EsimFormData {
  group_code: string
  order_number?: string
  product_id: string
  quantity: number
  email: string
  note?: string
}

// eSIM 搜尋條件
export interface EsimSearchFilters {
  esim_number?: string
  group_code?: string
  order_number?: string
  supplier_order_number?: string
  status?: EsimStatus
  product_id?: string
  email?: string
}

// FastMove 產品資訊
export interface FastMoveProduct {
  wmproduct_id: string
  product_id: string
  product_name: string
  product_region: string
  product_price: number
  product_type: number
  le_sim: boolean
}

// FastMove 訂單請求
export interface FastMoveOrderRequest {
  email: string
  product_id: string
  quantity: number
  price: number
  group_code: string
  order_number: string
  created_by: string
  invoice_number: string
  esim_number: string
}

// FastMove 訂單詳情
export interface FastMoveOrderDetail {
  order_id: string
  order_time: string
  item_list: {
    product_name: string
    redemption_code: string
    usage: {
      use_s_date: string
      use_e_date: string
      total_usage: string
      esim_status: number
    }
  }[]
}
