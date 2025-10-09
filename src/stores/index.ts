/**
 * Stores 統一匯出
 * 使用工廠函數建立所有 Store
 */

import { createStore } from './create-store';

// 從 @/types 匯入（使用 types/ 目錄下的標準定義）
import type {
  Tour,
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
} from '@/types';

// 從本地 types 匯入其他型別
import type {
  CalendarEvent,
  Todo,
  Visa,
  Supplier,
} from './types';

// ============================================
// 業務實體 Stores（有編號前綴）
// ============================================

/**
 * 旅遊團 Store
 * 編號格式：T{year}{4位數} (如: T20240001)
 */
export const useTourStore = createStore<Tour>('tours', 'T');

/**
 * 訂單 Store
 * 編號格式：O{year}{4位數} (如: O20240001)
 */
export const useOrderStore = createStore<Order>('orders', 'O');

/**
 * 客戶 Store
 * 編號格式：C{year}{4位數} (如: C20240001)
 */
export const useCustomerStore = createStore<Customer>('customers', 'C');

/**
 * 付款記錄 Store
 * 編號格式：P{year}{4位數} (如: P20240001)
 */
export const usePaymentStore = createStore<Payment>('payments', 'P');

/**
 * 報價單 Store
 * 編號格式：Q{year}{4位數} (如: Q20240001)
 */
export const useQuoteStore = createStore<Quote>('quotes', 'Q');

/**
 * 請款單 Store
 * 編號格式：PR{year}{4位數} (如: PR20240001)
 */
export const usePaymentRequestStore = createStore<PaymentRequest>(
  'payment_requests',
  'PR'
);

/**
 * 出納單 Store
 * 編號格式：DO{year}{4位數} (如: DO20240001)
 */
export const useDisbursementOrderStore = createStore<DisbursementOrder>(
  'disbursement_orders',
  'DO'
);

/**
 * 收款單 Store
 * 編號格式：RO{year}{4位數} (如: RO20240001)
 */
export const useReceiptOrderStore = createStore<ReceiptOrder>(
  'receipt_orders',
  'RO'
);

// ============================================
// 子實體 Stores（無編號）
// ============================================

/**
 * 團員 Store
 * 無獨立編號，依附於訂單
 */
export const useMemberStore = createStore<Member>('members');

/**
 * 報價項目 Store
 * 無獨立編號，依附於報價單
 */
export const useQuoteItemStore = createStore<QuoteItem>('quote_items');

/**
 * 團體加購項目 Store
 * 無獨立編號，依附於旅遊團
 */
export const useTourAddOnStore = createStore<import('./types').TourAddOn>('tour_addons');

// ============================================
// 系統管理 Stores（無編號）
// ============================================

/**
 * 員工 Store
 * 使用員工編號（employeeNumber），不是 code
 */
export const useEmployeeStore = createStore<Employee>('employees');

// ============================================
// 待補充的 Stores（根據需要啟用）
// ============================================

// 待辦事項 Store
export const useTodoStore = createStore<Todo>('todos');

// 簽證 Store
export const useVisaStore = createStore<Visa>('visas', 'V');

// 供應商 Store
export const useSupplierStore = createStore<Supplier>('suppliers', 'S');

// 行事曆 Store
export const useCalendarEventStore = createStore<CalendarEvent>('calendar_events');

// TODO: WorkspaceItem, Template, TimeboxSession 型別需要定義後再啟用
// export const useTemplateStore = createStore<Template>('templates');
// export const useTimeboxSessionStore = createStore<TimeboxSession>('timebox_sessions');
// export const useWorkspaceItemStore = createStore<WorkspaceItem>('workspace_items');

// ============================================
// 型別匯出（方便使用）
// ============================================

// ============================================
// 保留的特殊 Stores（認證、UI 狀態）
// ============================================

export { useAuthStore } from './auth-store';
export { useThemeStore } from './theme-store';
export { useHomeSettingsStore } from './home-settings-store';

// ============================================
// 暫時保留的複雜 Stores（待重構）
// ============================================

// TODO: 移到 hooks/use-employees.ts
export { useUserStore } from './user-store';

// TODO: 拆分為 4 個 createStore + hooks/use-accounting.ts
export { useAccountingStore } from './accounting-store';

// TODO: 移到 hooks/use-calendar.ts
export { useCalendarStore } from './calendar-store';

// TODO: 移到 hooks/use-timebox.ts
export { useTimeboxStore } from './timebox-store';

// TODO: 已有 useTemplateStore，檢查是否重複
// export { useTemplateStore } from './template-store';

// TODO: 已有 useWorkspaceItemStore，檢查是否重複
export { useWorkspaceStore } from './workspace-store';

// ============================================
// 型別匯出（方便使用）
// ============================================

export type {
  Tour,
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
};
