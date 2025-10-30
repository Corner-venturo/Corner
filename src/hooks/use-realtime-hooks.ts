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

'use client';

import { createRealtimeHook } from '@/lib/realtime/createRealtimeHook';

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
} from '@/stores';

// IndexedDB adapters
import { IndexedDBAdapter } from '@/stores/adapters/indexeddb-adapter';

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
  Region,
  Member,
  QuoteItem,
  Todo,
  Employee,
} from '@/stores/types';
import type { TourAddOn } from '@/stores/types';
import type { CalendarEvent } from '@/types/calendar.types';

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
  store: useTourStore,
});

/**
 * 訂單 Realtime Hook
 * 使用時機：進入 /orders 頁面
 */
export const useRealtimeForOrders = createRealtimeHook<Order>({
  tableName: 'orders',
  indexedDB: new IndexedDBAdapter<Order>('orders'),
  store: useOrderStore,
});

/**
 * 報價單 Realtime Hook
 * 使用時機：進入 /quotes 頁面
 */
export const useRealtimeForQuotes = createRealtimeHook<Quote>({
  tableName: 'quotes',
  indexedDB: new IndexedDBAdapter<Quote>('quotes'),
  store: useQuoteStore,
});

/**
 * 客戶 Realtime Hook
 * 使用時機：進入 /customers 頁面
 */
export const useRealtimeForCustomers = createRealtimeHook<Customer>({
  tableName: 'customers',
  indexedDB: new IndexedDBAdapter<Customer>('customers'),
  store: useCustomerStore,
});

/**
 * 行程表 Realtime Hook
 * 使用時機：進入 /itineraries 頁面
 */
export const useRealtimeForItineraries = createRealtimeHook<Itinerary>({
  tableName: 'itineraries',
  indexedDB: new IndexedDBAdapter<Itinerary>('itineraries'),
  store: useItineraryStore,
});

/**
 * 請款單 Realtime Hook
 * 使用時機：進入 /payment-requests 頁面
 */
export const useRealtimeForPaymentRequests = createRealtimeHook<PaymentRequest>({
  tableName: 'payment_requests',
  indexedDB: new IndexedDBAdapter<PaymentRequest>('payment_requests'),
  store: usePaymentRequestStore,
});

/**
 * 出納單 Realtime Hook
 * 使用時機：進入 /disbursement-orders 頁面
 */
export const useRealtimeForDisbursementOrders = createRealtimeHook<DisbursementOrder>({
  tableName: 'disbursement_orders',
  indexedDB: new IndexedDBAdapter<DisbursementOrder>('disbursement_orders'),
  store: useDisbursementOrderStore,
});

/**
 * 收款單 Realtime Hook
 * 使用時機：進入 /receipt-orders 頁面
 */
export const useRealtimeForReceiptOrders = createRealtimeHook<ReceiptOrder>({
  tableName: 'receipt_orders',
  indexedDB: new IndexedDBAdapter<ReceiptOrder>('receipt_orders'),
  store: useReceiptOrderStore,
});

/**
 * 簽證 Realtime Hook
 * 使用時機：進入 /visas 頁面
 */
export const useRealtimeForVisas = createRealtimeHook<Visa>({
  tableName: 'visas',
  indexedDB: new IndexedDBAdapter<Visa>('visas'),
  store: useVisaStore,
});

/**
 * 供應商 Realtime Hook
 * 使用時機：進入 /suppliers 頁面
 */
export const useRealtimeForSuppliers = createRealtimeHook<Supplier>({
  tableName: 'suppliers',
  indexedDB: new IndexedDBAdapter<Supplier>('suppliers'),
  store: useSupplierStore,
});

/**
 * 地區 Realtime Hook
 * 使用時機：進入 /regions 頁面
 */
export const useRealtimeForRegions = createRealtimeHook<Region>({
  tableName: 'regions',
  indexedDB: new IndexedDBAdapter<Region>('regions'),
  store: useRegionStore,
});

/**
 * 行事曆 Realtime Hook
 * 使用時機：進入 /calendar 頁面
 */
export const useRealtimeForCalendarEvents = createRealtimeHook<CalendarEvent>({
  tableName: 'calendar_events',
  indexedDB: new IndexedDBAdapter<CalendarEvent>('calendar_events'),
  store: useCalendarEventStore,
});

/**
 * 待辦事項 Realtime Hook
 * 使用時機：進入 /todos 頁面
 */
export const useRealtimeForTodos = createRealtimeHook<Todo>({
  tableName: 'todos',
  indexedDB: new IndexedDBAdapter<Todo>('todos'),
  store: useTodoStore,
});

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
  store: useMemberStore,
});

/**
 * 報價項目 Realtime Hook
 * 使用時機：進入報價單編輯頁面
 */
export const useRealtimeForQuoteItems = createRealtimeHook<QuoteItem>({
  tableName: 'quote_items',
  indexedDB: new IndexedDBAdapter<QuoteItem>('quote_items'),
  store: useQuoteItemStore,
});

/**
 * 加購項目 Realtime Hook
 * 使用時機：進入旅遊團詳情頁面
 */
export const useRealtimeForTourAddons = createRealtimeHook<TourAddOn>({
  tableName: 'tour_addons',
  indexedDB: new IndexedDBAdapter<TourAddOn>('tour_addons'),
  store: useTourAddOnStore,
});

// ============================================
// Workspace 系統（2 個）- 已有專用 Hooks
// ============================================

/**
 * Channels Realtime Hook (Phase 2 實作)
 * 使用時機：進入工作空間頁面
 */
export { useChannelsRealtime } from './useChannelsRealtime';

/**
 * Messages Realtime Hook (Phase 3 實作)
 * 使用時機：進入頻道聊天頁面
 */
export { useChatRealtime } from './useChatRealtime';

// ============================================
// 其他（2 個）
// ============================================

/**
 * 員工 Realtime Hook
 * 使用時機：進入 /employees 頁面 或需要永久訂閱
 * ⚠️ 建議永久訂閱（在 layout 中）
 */
export const useRealtimeForEmployees = createRealtimeHook<Employee>({
  tableName: 'employees',
  indexedDB: new IndexedDBAdapter<Employee>('employees'),
  store: useEmployeeStore,
});

// ============================================
// 未來擴充（高優先級 - 10 個）
// ============================================

// TODO: 以下 Hooks 需要先建立對應的 Store

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
// export const useRealtimeForReceipts = ...

// 4. 協作功能
// export const useRealtimeForAdvanceLists = ...
// export const useRealtimeForSharedOrderLists = ...
// export const useRealtimeForActivities = ...

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
