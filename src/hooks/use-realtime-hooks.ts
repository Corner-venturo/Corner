/**
 * Realtime Hooks 集中匯出
 * 所有資料表的按需訂閱 Hooks
 *
 * 使用方式：
 * ```typescript
 * // 在頁面中使用
 * function ToursPage() {
 *   useRealtimeForTours(); // ← 進入頁面時訂閱，離開時取消
 *   const tours = useTourStore(state => state.items);
 * }
 * ```
 */

'use client'

import { createRealtimeHook } from '@/lib/realtime/createRealtimeHook'

// Stores
import {
  useTourStore,
  useOrderStore,
  useQuoteStore,
  useCustomerStore,
  useItineraryStore,
  usePaymentRequestStore,
  useDisbursementOrderStore,
  useReceiptOrderStore,
  useVisaStore,
  useSupplierStore,
  useRegionStore,
  useCalendarEventStore,
  useTodoStore,
  useMemberStore,
  useQuoteItemStore,
  useTourAddOnStore,
  useEmployeeStore,
  useReceiptStore,
  useLinkPayLogStore,
  useConfirmationStore,
  useAttractionStore,
} from '@/stores'

// IndexedDB adapters
import { IndexedDBAdapter } from '@/stores/adapters/indexeddb-adapter'

// Types
import type {
  Tour,
  Order,
  Quote,
  Customer,
  Itinerary,
  PaymentRequest,
  DisbursementOrder,
  ReceiptOrder,
  Visa,
  Supplier,
  Member,
  QuoteItem,
  Todo,
  Employee,
  TourAddOn,
} from '@/stores/types'
import type { CalendarEvent } from '@/types/calendar.types'
import type { Receipt, LinkPayLog } from '@/types/receipt.types'
import type { Confirmation } from '@/types/confirmation.types'
import type { Attraction } from '@/features/attractions/types'

// ============================================
// 業務實體（13 個）
// ============================================

/**
 * 旅遊團 Realtime Hook
 * 使用時機：進入 /tours 頁面
 */
export const useRealtimeForTours = createRealtimeHook<Tour>({
  tableName: 'tours',
  indexedDB: new IndexedDBAdapter<Tour>('tours'),
  store: useTourStore as any,
})

/**
 * 訂單 Realtime Hook
 * 使用時機：進入 /orders 頁面
 */
export const useRealtimeForOrders = createRealtimeHook<Order>({
  tableName: 'orders',
  indexedDB: new IndexedDBAdapter<Order>('orders'),
  store: useOrderStore as any,
})

/**
 * 報價單 Realtime Hook
 * 使用時機：進入 /quotes 頁面
 */
export const useRealtimeForQuotes = createRealtimeHook<Quote>({
  tableName: 'quotes',
  indexedDB: new IndexedDBAdapter<Quote>('quotes'),
  store: useQuoteStore as any,
})

/**
 * 客戶 Realtime Hook
 * 使用時機：進入 /customers 頁面
 */
export const useRealtimeForCustomers = createRealtimeHook<Customer>({
  tableName: 'customers',
  indexedDB: new IndexedDBAdapter<Customer>('customers'),
  store: useCustomerStore as any,
})

/**
 * 行程表 Realtime Hook
 * 使用時機：進入 /itineraries 頁面
 */
export const useRealtimeForItineraries = createRealtimeHook<Itinerary>({
  tableName: 'itineraries',
  indexedDB: new IndexedDBAdapter<Itinerary>('itineraries'),
  store: useItineraryStore as any,
})

/**
 * 請款單 Realtime Hook
 * 使用時機：進入 /payment-requests 頁面
 */
export const useRealtimeForPaymentRequests = createRealtimeHook<PaymentRequest>({
  tableName: 'payment_requests',
  indexedDB: new IndexedDBAdapter<PaymentRequest>('payment_requests'),
  store: usePaymentRequestStore as any,
})

/**
 * 出納單 Realtime Hook
 * 使用時機：進入 /disbursement-orders 頁面
 */
export const useRealtimeForDisbursementOrders = createRealtimeHook<DisbursementOrder>({
  tableName: 'disbursement_orders',
  indexedDB: new IndexedDBAdapter<DisbursementOrder>('disbursement_orders'),
  store: useDisbursementOrderStore as any,
})

/**
 * 收款單 Realtime Hook
 * 使用時機：進入 /receipt-orders 頁面
 */
export const useRealtimeForReceiptOrders = createRealtimeHook<ReceiptOrder>({
  tableName: 'receipt_orders',
  indexedDB: new IndexedDBAdapter<ReceiptOrder>('receipt_orders'),
  store: useReceiptOrderStore as any,
})

/**
 * 簽證 Realtime Hook
 * 使用時機：進入 /visas 頁面
 */
export const useRealtimeForVisas = createRealtimeHook<Visa>({
  tableName: 'visas',
  indexedDB: new IndexedDBAdapter<Visa>('visas'),
  store: useVisaStore as any,
})

/**
 * 供應商 Realtime Hook
 * 使用時機：進入 /suppliers 頁面
 */
export const useRealtimeForSuppliers = createRealtimeHook<Supplier>({
  tableName: 'suppliers',
  indexedDB: new IndexedDBAdapter<Supplier>('suppliers'),
  store: useSupplierStore as any,
})

/**
 * 地區 Realtime Hook
 * 使用時機：進入 /regions 頁面
 */
export const useRealtimeForRegions = createRealtimeHook<any>({
  tableName: 'regions',
  indexedDB: new IndexedDBAdapter<any>('regions'),
  store: useRegionStore as any,
})

/**
 * 景點 Realtime Hook
 * 使用時機：進入 /database/attractions 頁面
 */
export const useRealtimeForAttractions = createRealtimeHook<Attraction>({
  tableName: 'attractions',
  indexedDB: new IndexedDBAdapter<Attraction>('attractions'),
  store: useAttractionStore as any,
})

/**
 * 行事曆 Realtime Hook
 * 使用時機：進入 /calendar 頁面
 */
export const useRealtimeForCalendarEvents = createRealtimeHook<CalendarEvent>({
  tableName: 'calendar_events',
  indexedDB: new IndexedDBAdapter<CalendarEvent>('calendar_events'),
  store: useCalendarEventStore as any,
})

/**
 * 待辦事項 Realtime Hook
 * 使用時機：進入 /todos 頁面
 */
export const useRealtimeForTodos = createRealtimeHook<Todo>({
  tableName: 'todos',
  indexedDB: new IndexedDBAdapter<Todo>('todos'),
  store: useTodoStore as any,
})

// ============================================
// 子實體（3 個）
// ============================================

/**
 * 團員 Realtime Hook
 * 使用時機：進入訂單詳情頁面
 */
export const useRealtimeForMembers = createRealtimeHook<Member>({
  tableName: 'members',
  indexedDB: new IndexedDBAdapter<Member>('members'),
  store: useMemberStore as any,
})

/**
 * 報價項目 Realtime Hook
 * 使用時機：進入報價單編輯頁面
 */
export const useRealtimeForQuoteItems = createRealtimeHook<QuoteItem>({
  tableName: 'quote_items',
  indexedDB: new IndexedDBAdapter<QuoteItem>('quote_items'),
  store: useQuoteItemStore as any,
})

/**
 * 加購項目 Realtime Hook
 * 使用時機：進入旅遊團詳情頁面
 */
export const useRealtimeForTourAddons = createRealtimeHook<TourAddOn>({
  tableName: 'tour_addons',
  indexedDB: new IndexedDBAdapter<TourAddOn>('tour_addons'),
  store: useTourAddOnStore as any,
})

// ============================================
// Workspace 系統（5 個）- 已有專用 Hooks
// ============================================

/**
 * Workspaces Realtime Hook
 * 使用時機：進入工作空間頁面（永久訂閱）
 */
export { useChannelsRealtime } from './useChannelsRealtime'

/**
 * Channels Realtime Hook
 * 使用時機：進入工作空間頁面
 */
export { useChannelsRealtime as useRealtimeForChannels } from './useChannelsRealtime'

/**
 * Messages Realtime Hook
 * 使用時機：進入頻道聊天頁面
 */
export { useChatRealtime } from './useChatRealtime'

/**
 * Messages Realtime Hook (別名)
 * 使用時機：進入頻道聊天頁面
 */
export { useChatRealtime as useRealtimeForMessages } from './useChatRealtime'

// ============================================
// 其他（2 個）
// ============================================

/**
 * 員工 Realtime Hook
 * 使用時機：進入 /employees 頁面（按需訂閱）
 * ✅ 按需訂閱（進入頁面才訂閱，離開自動取消）
 */
export const useRealtimeForEmployees = createRealtimeHook<Employee>({
  tableName: 'employees',
  indexedDB: new IndexedDBAdapter<Employee>('employees'),
  store: useEmployeeStore as any,
})

// ============================================
// 未來擴充（高優先級 - 10 個）
// ============================================

// 1. Workspace 系統
// export const useRealtimeForWorkspaces = ...
// export const useRealtimeForWorkspaceItems = ...
// export const useRealtimeForChannelMembers = ...
// export const useRealtimeForChannelGroups = ...
// export const useRealtimeForBulletins = ...

// 2. 團員管理
// export const useRealtimeForOrderMembers = ...
// export const useRealtimeForTourMembers = ...

// 3. 財務即時
// export const useRealtimeForPayments = ...

/**
 * 收款單 Realtime Hook
 * 使用時機：進入 /finance/payments 或 /receipts 頁面
 */
export const useRealtimeForReceipts = createRealtimeHook<Receipt>({
  tableName: 'receipts',
  indexedDB: new IndexedDBAdapter<Receipt>('receipts'),
  store: useReceiptStore as any,
})

/**
 * LinkPay 記錄 Realtime Hook
 * 使用時機：進入收款單詳情頁面（如果有 LinkPay）
 */
export const useRealtimeForLinkPayLogs = createRealtimeHook<LinkPayLog>({
  tableName: 'linkpay_logs',
  indexedDB: new IndexedDBAdapter<LinkPayLog>('linkpay_logs'),
  store: useLinkPayLogStore as any,
})

/**
 * 確認單（航班/住宿）Realtime Hook
 * 使用時機：進入確認單列表頁面
 */
export const useRealtimeForConfirmations = createRealtimeHook<Confirmation>({
  tableName: 'confirmations',
  indexedDB: new IndexedDBAdapter<Confirmation>('confirmations'),
  store: useConfirmationStore as any,
})

// 4. 協作功能
// export const useRealtimeForAdvanceLists = ...
// export const useRealtimeForSharedOrderLists = ...
// export const useRealtimeForActivities = ...

// ============================================
// 帶 Filter 的 Realtime Hooks（展開時才訂閱）
// ============================================

/**
 * 帶 filter 的訂單 Realtime Hook
 * 使用時機：展開旅遊團/客戶時，只訂閱該對象的訂單
 *
 * @example
 * ```typescript
 * // 展開旅遊團時
 * function TourExpandedView({ tour }) {
 *   useRealtimeForOrdersFiltered(`tour_id=eq.${tour.id}`);
 *   // ...
 * }
 *
 * // 不展開時傳 null，不會訂閱
 * useRealtimeForOrdersFiltered(null);
 * ```
 */
export const useRealtimeForOrdersFiltered = createRealtimeHook<Order>({
  tableName: 'orders',
  indexedDB: new IndexedDBAdapter<Order>('orders'),
  store: useOrderStore as any,
})

/**
 * 帶 filter 的團員 Realtime Hook
 * 使用時機：展開訂單/旅遊團時，只訂閱該對象的團員
 */
export const useRealtimeForMembersFiltered = createRealtimeHook<Member>({
  tableName: 'members',
  indexedDB: new IndexedDBAdapter<Member>('members'),
  store: useMemberStore as any,
})

/**
 * 帶 filter 的報價項目 Realtime Hook
 * 使用時機：編輯報價單時，只訂閱該報價單的項目
 */
export const useRealtimeForQuoteItemsFiltered = createRealtimeHook<QuoteItem>({
  tableName: 'quote_items',
  indexedDB: new IndexedDBAdapter<QuoteItem>('quote_items'),
  store: useQuoteItemStore as any,
})

/**
 * 帶 filter 的收款記錄 Realtime Hook
 * 使用時機：查看收款單詳情時，只訂閱該收款單的記錄
 */
export const useRealtimeForReceiptsFiltered = createRealtimeHook<Receipt>({
  tableName: 'receipts',
  indexedDB: new IndexedDBAdapter<Receipt>('receipts'),
  store: useReceiptStore as any,
})

/**
 * 帶 filter 的 LinkPay 記錄 Realtime Hook
 * 使用時機：查看收款單詳情時，只訂閱該收款單的 LinkPay 記錄
 */
export const useRealtimeForLinkPayLogsFiltered = createRealtimeHook<LinkPayLog>({
  tableName: 'linkpay_logs',
  indexedDB: new IndexedDBAdapter<LinkPayLog>('linkpay_logs'),
  store: useLinkPayLogStore as any,
})

// ============================================
// 使用範例
// ============================================

/**
 * @example
 * ```typescript
 * // 在 Tours 頁面
 * function ToursPage() {
 *   // ✅ 進入頁面時訂閱，離開時自動取消
 *   useRealtimeForTours();
 *
 *   const tours = useTourStore(state => state.items);
 *   const loading = useTourStore(state => state.loading);
 *
 *   return <div>...</div>;
 * }
 *
 * // 在訂單詳情頁面（需要多個訂閱）
 * function OrderDetailPage({ orderId }: { orderId: string }) {
 *   // ✅ 訂閱訂單和團員
 *   useRealtimeForOrders();
 *   useRealtimeForMembers();
 *
 *   const order = useOrderStore(state =>
 *     state.items.find(o => o.id === orderId)
 *   );
 *   const members = useMemberStore(state =>
 *     state.items.filter(m => m.order_id === orderId)
 *   );
 *
 *   return <div>...</div>;
 * }
 * ```
 */
