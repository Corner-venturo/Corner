/**
 * 旅行業代轉發票 Zustand Store
 */

import { create } from 'zustand'

export interface TravelInvoiceItem {
  item_name: string
  item_count: number
  item_unit: string
  item_price: number
  itemAmt: number
  itemTaxType?: string
  itemWord?: string
}

export interface BuyerInfo {
  buyerName: string
  buyerUBN?: string
  buyerAddress?: string
  buyerEmail?: string
  buyerMobileCode?: string
  buyerMobile?: string
  carrierType?: string
  carrierNum?: string
  loveCode?: string
  printFlag?: 'Y' | 'N'
}

export interface TravelInvoice {
  id: string
  transactionNo: string
  merchantId: string
  invoice_number?: string
  invoice_date: string
  total_amount: number
  tax_type: 'dutiable' | 'zero' | 'free'
  buyerInfo: BuyerInfo
  items: TravelInvoiceItem[]
  status: 'pending' | 'issued' | 'voided' | 'allowance' | 'failed'
  apiStatus?: string
  apiMessage?: string
  randomNum?: string
  barcode?: string
  qrcodeL?: string
  qrcodeR?: string
  voidDate?: string
  voidReason?: string
  allowanceDate?: string
  allowanceAmount?: number
  allowanceItems?: TravelInvoiceItem[]
  order_id?: string
  tour_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface TravelInvoiceState {
  invoices: TravelInvoice[]
  currentInvoice: TravelInvoice | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchInvoices: (filters?: {
    status?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }) => Promise<void>
  fetchInvoiceById: (id: string) => Promise<void>
  issueInvoice: (data: {
    invoice_date: string
    total_amount: number
    tax_type?: string
    buyerInfo: BuyerInfo
    items: TravelInvoiceItem[]
    order_id?: string
    tour_id?: string
    created_by: string
  }) => Promise<TravelInvoice>
  voidInvoice: (invoiceId: string, voidReason: string, operatedBy: string) => Promise<void>
  allowanceInvoice: (
    invoiceId: string,
    allowanceAmount: number,
    allowanceItems: TravelInvoiceItem[],
    operatedBy: string
  ) => Promise<void>
  setCurrentInvoice: (invoice: TravelInvoice | null) => void
  clearError: () => void
}

export const useTravelInvoiceStore = create<TravelInvoiceState>((set, get) => ({
  invoices: [],
  currentInvoice: null,
  isLoading: false,
  error: null,

  fetchInvoices: async (filters = {}) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/travel-invoice/query?${params.toString()}`)
      if (!response.ok) throw new Error('查詢發票失敗')

      const result = await response.json()
      set({ invoices: result.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  fetchInvoiceById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/travel-invoice/query?id=${id}`)
      if (!response.ok) throw new Error('查詢發票失敗')

      const result = await response.json()
      if (result.data && result.data.length > 0) {
        set({ currentInvoice: result.data[0], isLoading: false })
      } else {
        throw new Error('找不到發票')
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  issueInvoice: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/travel-invoice/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || result.error || '開立發票失敗')
      }

      // 重新載入發票列表
      await get().fetchInvoices()
      set({ isLoading: false })

      return result.data
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  voidInvoice: async (invoiceId, voidReason, operatedBy) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/travel-invoice/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, voidReason, operatedBy }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || result.error || '作廢發票失敗')
      }

      // 更新當前發票
      if (get().currentInvoice?.id === invoiceId) {
        set({ currentInvoice: result.data })
      }

      // 重新載入發票列表
      await get().fetchInvoices()
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  allowanceInvoice: async (invoiceId, allowanceAmount, allowanceItems, operatedBy) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/travel-invoice/allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, allowanceAmount, allowanceItems, operatedBy }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || result.error || '開立折讓失敗')
      }

      // 更新當前發票
      if (get().currentInvoice?.id === invoiceId) {
        set({ currentInvoice: result.data })
      }

      // 重新載入發票列表
      await get().fetchInvoices()
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
  clearError: () => set({ error: null }),
}))
