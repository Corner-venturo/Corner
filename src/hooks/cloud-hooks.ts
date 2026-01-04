// src/hooks/cloud-hooks.ts
// 所有模組的純雲端 SWR Hooks

import { createCloudHook } from './createCloudHook'
import type {
  Tour,
  Order,
  Customer,
  Quote,
  PaymentRequest,
  PaymentRequestItem,
  DisbursementOrder,
  ReceiptOrder,
  Member,
  Employee,
  Todo,
  Visa,
  Supplier,
  Itinerary,
  AirportImage,
  CustomerGroup,
  CustomerGroupMember,
} from '@/stores/types'
import type { QuoteItem } from '@/types/quote.types'

// ===== 核心業務模組 =====

// 團行程
export const useTours = createCloudHook<Tour>('tours', {
  orderBy: { column: 'departure_date', ascending: false },
})

// 訂單
export const useOrders = createCloudHook<Order>('orders', {
  orderBy: { column: 'created_at', ascending: false },
})

// 客戶
export const useCustomers = createCloudHook<Customer>('customers', {
  orderBy: { column: 'created_at', ascending: false },
})

// 報價單
export const useQuotes = createCloudHook<Quote>('quotes', {
  orderBy: { column: 'created_at', ascending: false },
})

// 行程表
export const useItineraries = createCloudHook<Itinerary>('itineraries', {
  orderBy: { column: 'created_at', ascending: false },
})

// ===== 財務模組 =====

// 付款申請
export const usePaymentRequests = createCloudHook<PaymentRequest>('payment_requests', {
  orderBy: { column: 'created_at', ascending: false },
})

// 付款申請項目
export const usePaymentRequestItems = createCloudHook<PaymentRequestItem>('payment_request_items')

// 支出單
export const useDisbursementOrders = createCloudHook<DisbursementOrder>('disbursement_orders', {
  orderBy: { column: 'created_at', ascending: false },
})

// 收款單
export const useReceiptOrders = createCloudHook<ReceiptOrder>('receipt_orders', {
  orderBy: { column: 'created_at', ascending: false },
})

// ===== 人員與團員 =====

// 團員
export const useMembers = createCloudHook<Member>('members')

// 員工
export const useEmployees = createCloudHook<Employee>('employees', {
  orderBy: { column: 'employee_number', ascending: true },
})

// ===== 待辦與簽證 =====

// 待辦事項 (已有獨立的 useTodos.ts，這裡保持相容)
export const useTodosCloud = createCloudHook<Todo>('todos', {
  orderBy: { column: 'created_at', ascending: false },
})

// 簽證
export const useVisas = createCloudHook<Visa>('visas', {
  orderBy: { column: 'created_at', ascending: false },
})

// ===== 基礎資料 =====

// 供應商
export const useSuppliers = createCloudHook<Supplier>('suppliers', {
  orderBy: { column: 'name', ascending: true },
})

// 報價項目
export const useQuoteItems = createCloudHook<QuoteItem>('quote_items')

// ===== 圖片庫 =====

// 機場圖片（封面圖片庫）
export const useAirportImages = createCloudHook<AirportImage>('airport_images', {
  orderBy: { column: 'display_order', ascending: true },
})

// ===== 客戶群組 =====

// 客戶群組
export const useCustomerGroups = createCloudHook<CustomerGroup>('customer_groups', {
  orderBy: { column: 'created_at', ascending: false },
})

// 客戶群組成員
export const useCustomerGroupMembers = createCloudHook<CustomerGroupMember>('customer_group_members', {
  orderBy: { column: 'created_at', ascending: false },
})
