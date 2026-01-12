/**
 * Stores 統一匯出（Zustand-based）
 *
 * ⚠️ 架構說明：
 * - 此檔案使用 Zustand Store（舊架構，向後相容）
 * - 新功能請優先使用 @/data（SWR-based 統一資料層）
 *
 * 兩套系統對照：
 * | Zustand (此處)           | @/data (新架構)              |
 * |--------------------------|------------------------------|
 * | useTourStore             | useTours                     |
 * | useOrderStore            | useOrders                    |
 * | useCustomerStore         | useCustomers                 |
 * | useTourLeaderStore ⚠️    | useTourLeaders (已遷移)      |
 * | useRegionsStore ⚠️       | useCountries, useCities      |
 * | usePaymentRequestStore   | usePaymentRequests (進行中)  |
 * | ...                      | ...                          |
 *
 * 遷移狀態 (2026-01-12)：
 * - ✅ TourLeaders: 已遷移到 @/data
 * - ✅ Regions: 已遷移到 @/data (useCountries, useCities)
 * - 🔄 PaymentRequest: 服務層已遷移，hooks 待遷移
 * - ⏳ 其他: 待遷移
 */

import { createStore } from './core/create-store'

// 從 @/types 匯入（使用 types/ 目錄下的標準定義）
import type { Tour, Order, Member, Customer, ReceiptOrder, Employee } from '@/types'

// 從本地 types 匯入（包含 PaymentRequest, DisbursementOrder 等）
import type {
  PaymentRequest,
  PaymentRequestItem,
  DisbursementOrder,
  Todo,
  Visa,
  Payment,
  Quote,
  QuoteItem,
  Itinerary,
} from './types'

// Supplier 從標準 types 匯入（完整定義含 supplier_code, country, location）
import type { Supplier } from '@/types/supplier.types'

// ============================================
// 業務實體 Stores（有編號前綴）
// ============================================

/**
 * 旅遊團 Store
 * 編號格式：T{year}{4位數} (如: T20240001)
 * 🔒 啟用 Workspace 隔離
 */
export const useTourStore = createStore<Tour>({
  tableName: 'tours',
  codePrefix: 'T',
  workspaceScoped: true,
})

/**
 * 行程表 Store
 * 編號格式：I{year}{4位數} (如: I20240001)
 * 🔒 啟用 Workspace 隔離
 */
export const useItineraryStore = createStore<Itinerary>({
  tableName: 'itineraries',
  codePrefix: 'I',
  workspaceScoped: true,
})

/**
 * 訂單 Store
 * 編號格式：{團號}-O{2位數} (如: CNX250128A-O01)
 * 編號由建立訂單時根據團號自動生成，不使用 codePrefix
 * 🔒 啟用 Workspace 隔離
 */
export const useOrderStore = createStore<Order>({
  tableName: 'orders',
  // 不使用 codePrefix，訂單編號需依賴團號，由建立邏輯處理
  workspaceScoped: true,
})

/**
 * 客戶 Store
 * 編號格式：C{year}{4位數} (如: C20240001)
 * 🔒 啟用 Workspace 隔離
 */
export const useCustomerStore = createStore<Customer>({
  tableName: 'customers',
  codePrefix: 'C',
  workspaceScoped: true,
})

/**
 * 報價單 Store
 * 編號格式：Q{year}{4位數} (如: Q20240001)
 * 🔒 啟用 Workspace 隔離
 */
export const useQuoteStore = createStore<Quote>({
  tableName: 'quotes',
  codePrefix: 'Q',
  workspaceScoped: true,
})

/**
 * 請款單 Store
 * 編號格式：{團號}-I{2位數} (如: CNX250128A-I01)
 * 編號由建立請款單時根據團號自動生成，不使用 codePrefix
 * 🔒 啟用 Workspace 隔離
 */
export const usePaymentRequestStore = createStore<PaymentRequest>({
  tableName: 'payment_requests',
  // 不使用 codePrefix，請款單編號需依賴團號，由建立邏輯處理
  workspaceScoped: true,
})

/**
 * 請款項目 Store
 * 無獨立編號，依附於請款單
 * 🔒 啟用 Workspace 隔離
 */
export const usePaymentRequestItemStore = createStore<PaymentRequestItem>({
  tableName: 'payment_request_items',
  workspaceScoped: true,
})

/**
 * 出納單 Store
 * 編號格式：P{出帳年月日}{A-Z} (如: P250128A)
 * 編號由建立出納單時根據出帳日期自動生成，不使用 codePrefix
 * 🔒 啟用 Workspace 隔離
 */
export const useDisbursementOrderStore = createStore<DisbursementOrder>({
  tableName: 'disbursement_orders',
  // 不使用 codePrefix，出納單編號需依賴出帳日期，由建立邏輯處理
  workspaceScoped: true,
})

/**
 * 收款單 Store
 * 編號格式：{團號}-R{2位數} (如: CNX250128A-R01)
 * 編號由建立收款單時根據團號自動生成，不使用 codePrefix
 * 🔒 啟用 Workspace 隔離
 */
export const useReceiptOrderStore = createStore<ReceiptOrder>({
  tableName: 'receipt_orders',
  // 不使用 codePrefix，收款單編號需依賴團號，由建立邏輯處理
  workspaceScoped: true,
})

// ============================================
// 子實體 Stores（無編號）
// ============================================

/**
 * 團員 Store
 * 無獨立編號，依附於訂單
 * 注意：資料庫表格名稱是 members（不是 order_members）
 * 透過 order_id 關聯到訂單，不需要直接 workspace 隔離
 */
export const useMemberStore = createStore<Member>({
  tableName: 'members',
})

/**
 * 報價項目 Store
 * 無獨立編號，依附於報價單
 * ⚠️ 無 workspace_id 欄位，RLS 已禁用
 */
export const useQuoteItemStore = createStore<import('@/types/quote.types').QuoteItem>({
  tableName: 'quote_items',
  workspaceScoped: false,
})

/**
 * 團體加購項目 Store
 * 無獨立編號，依附於旅遊團
 * ⚠️ 無 workspace_id 欄位，RLS 已禁用
 */
export const useTourAddOnStore = createStore<import('./types').TourAddOn>({
  tableName: 'tour_addons',
  workspaceScoped: false,
})

// ============================================
// 系統管理 Stores（無編號）
// ============================================

/**
 * 員工 Store
 * 使用員工編號（employee_number），不是 code
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 */
export const useEmployeeStore = createStore<Employee>({
  tableName: 'employees',
  workspaceScoped: false,
})

// ============================================
// 待補充的 Stores（根據需要啟用）
// ============================================

// 待辦事項 Store
// 🔒 啟用 Workspace 隔離
export const useTodoStore = createStore<Todo>({
  tableName: 'todos',
  workspaceScoped: true,
})

// 簽證 Store
// 🔒 啟用 Workspace 隔離
export const useVisaStore = createStore<Visa>({
  tableName: 'visas',
  codePrefix: 'V',
  workspaceScoped: true,
})

/**
 * 代辦商成本 Store
 * 記住代辦商+簽證類型的成本
 * ⚠️ 不啟用 Workspace 隔離（全局共享）
 */
export const useVendorCostStore = createStore<import('./types').VendorCost>({
  tableName: 'vendor_costs',
  workspaceScoped: false,
})

/**
 * 供應商 Store
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 */
export const useSupplierStore = createStore<Supplier>({
  tableName: 'suppliers',
  codePrefix: 'S',
  workspaceScoped: false,
})

/**
 * 領隊資料 Store
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 *
 * @deprecated 請使用 @/data 的 useTourLeaders, createTourLeader 等
 * 此 store 保留是為了向後兼容，新代碼請使用 @/data
 */
export const useTourLeaderStore = createStore<import('@/types/tour-leader.types').TourLeader>({
  tableName: 'tour_leaders',
  codePrefix: 'TL',
  workspaceScoped: false,
})

/**
 * 車隊車輛 Store
 * 🔒 啟用 Workspace 隔離
 */
export const useFleetVehicleStore = createStore<import('@/types/fleet.types').FleetVehicle>({
  tableName: 'fleet_vehicles',
  workspaceScoped: true,
})

/**
 * 車隊司機 Store
 * 🔒 啟用 Workspace 隔離
 */
export const useFleetDriverStore = createStore<import('@/types/fleet.types').FleetDriver>({
  tableName: 'fleet_drivers',
  workspaceScoped: true,
})

/**
 * 車輛維護記錄 Store
 * 🔒 啟用 Workspace 隔離
 */
export const useFleetVehicleLogStore = createStore<import('@/types/fleet.types').FleetVehicleLog>({
  tableName: 'fleet_vehicle_logs',
  workspaceScoped: true,
})

/**
 * 車輛調度 Store
 * 🔒 啟用 Workspace 隔離
 */
export const useFleetScheduleStore = createStore<import('@/types/fleet.types').FleetSchedule>({
  tableName: 'fleet_schedules',
  workspaceScoped: true,
})

/**
 * 領隊調度 Store
 * 🔒 啟用 Workspace 隔離
 */
export const useLeaderScheduleStore = createStore<import('@/types/fleet.types').LeaderSchedule>({
  tableName: 'leader_schedules',
  workspaceScoped: true,
})

// 供應商類別 Store - 已遷移到 @/data (useSupplierCategories)
// 成本模板 Store - 已遷移到 @/data (useCostTemplates)

/**
 * 企業客戶 Store
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 */
export const useCompanyStore = createStore<import('./types').Company>({
  tableName: 'companies',
  workspaceScoped: false,
})

/**
 * 企業聯絡人 Store
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 */
export const useCompanyContactStore = createStore<import('./types').CompanyContact>({
  tableName: 'company_contacts',
  workspaceScoped: false,
})

/**
 * 地區 Store（舊版，保留向後相容）
 * ⚠️ 不啟用 Workspace 隔離（全局共享基礎資料）
 */
export const useRegionStore = createStore<import('./region-store').Region>({
  tableName: 'regions',
  workspaceScoped: false,
})

// 地區 Store（新版，三層架構）
// 支援 Countries > Regions > Cities 三層架構
// 使用 createStore 工廠，提供統一的快取優先架構
export { useRegionsStore } from './region-store'
export type { Country, City, RegionStats } from './region-store'
export type { Region as RegionNew } from './region-store'

// 景點 Store - 已遷移到 @/data (useAttractions)

// 行事曆事件 Store
// 🔒 啟用 Workspace 隔離
export const useCalendarEventStore = createStore<import('@/types/calendar.types').CalendarEvent>({
  tableName: 'calendar_events',
  workspaceScoped: true,
})

// 確認單 Store - 已遷移到 @/data (useConfirmations)

// ============================================
// 財務收款系統 Stores - 已遷移到 @/data
// ============================================
// 收款單 Store - 已遷移到 @/data (useReceipts)
// LinkPay 付款記錄 Store - 已遷移到 @/data (useLinkPayLogs)

// WorkspaceItem, TimeboxSession 型別需要定義後再啟用
// export const useTimeboxSessionStore = createStore<TimeboxSession>('timebox_sessions');
// export const useWorkspaceItemStore = createStore<WorkspaceItem>('workspace_items');

// ============================================
// 型別匯出（方便使用）
// ============================================

// ============================================
// 保留的特殊 Stores（認證、UI 狀態）
// ============================================

export { useAuthStore } from './auth-store'
export { useThemeStore } from './theme-store'
export { useHomeSettingsStore } from './home-settings-store'

// ============================================
// 暫時保留的複雜 Stores（待重構）
// ============================================

// 移到 hooks/use-employees.ts
export { useUserStore } from './user-store'

// 拆分為 4 個 createStore + hooks/use-accounting.ts
export { useAccountingStore } from './accounting-store'

// 移到 hooks/use-calendar.ts
// calendar-store 需要額外的 settings 功能，暫時保留
export { useCalendarStore } from './calendar-store'

// 移到 hooks/use-timebox.ts
// ⚠️ Timebox 功能已停用（表格已從 schemas.ts 移除）
// export { useTimeboxStore } from './timebox-store'

// 已有 useWorkspaceItemStore，檢查是否重複
export { useWorkspaceStore } from './workspace-store'

// ============================================
// 暫時保留的舊 Stores（待重構）
// ============================================

/**
 * @deprecated payment-store 將逐步遷移到新架構
 *
 * 此 Store 包含：
 * - PaymentRequest (請款單) - 應改用 usePaymentRequestStore
 * - DisbursementOrder (出納單) - 應改用 useDisbursementOrderStore
 * - 複雜的業務邏輯 - 應移到 payment.service.ts
 *
 * TODO:
 * - [ ] 遷移 PaymentRequest 相關頁面
 * - [ ] 遷移 DisbursementOrder 相關頁面
 * - [ ] 業務邏輯移到 service
 * - [ ] 刪除 payment-store.deprecated.ts
 */
// usePaymentStore 已遷移到新架構（payment-store.deprecated.ts）
// 新的 Store：usePaymentRequestStore, useDisbursementOrderStore
// export { usePaymentStore } from './payment-store'; // DEPRECATED

// ============================================
// 型別匯出（方便使用）
// ============================================

export type {
  Tour,
  Itinerary,
  Order,
  Member,
  Customer,
  Payment,
  PaymentRequest,
  DisbursementOrder,
  ReceiptOrder,
  Quote,
  QuoteItem,
  Employee,
  Todo,
  Visa,
  Supplier,
}

// 企業客戶系統型別
export type { Company, CompanyContact } from './types'

// 財務收款系統型別
export type {
  Receipt,
  LinkPayLog,
  ReceiptType,
  ReceiptStatus,
  LinkPayStatus,
  CreateReceiptData,
  UpdateReceiptData,
  ReceiptItem,
  RECEIPT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_COLORS,
  LINKPAY_STATUS_LABELS,
  LINKPAY_STATUS_COLORS,
} from '@/types/receipt.types'

// ============================================
// Store 同步系統
// ============================================

// 事件系統
export {
  storeEvents,
  setupStoreSyncListeners,
  STORE_SYNC_RELATIONS,
  type StoreEventType,
  type StoreSource,
  type TourEventPayload,
  type OrderEventPayload,
  type MemberEventPayload,
  type StoreSyncConfig,
} from './sync'

// 同步事件輔助函數
export {
  emitCreated,
  emitUpdated,
  emitDeleted,
  TOUR_SYNC_CONFIG,
  ORDER_SYNC_CONFIG,
  MEMBER_SYNC_CONFIG,
  ITINERARY_SYNC_CONFIG,
  PAYMENT_REQUEST_SYNC_CONFIG,
  RECEIPT_ORDER_SYNC_CONFIG,
  type SyncEventConfig,
  type SyncEntityType,
} from './sync/with-sync-events'

// 同步 Hook（在 Provider 中使用）
export { useStoreSyncSetup } from './sync'
