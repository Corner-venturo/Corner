/**
 * VENTURO Store 層重寫
 * 使用 createStore 工廠統一建立所有 Store
 */

import { createStore } from '../src/stores/create-store'
import type {
  Tour, Order, Member, Customer, Payment,
  PaymentRequest, DisbursementOrder, ReceiptOrder,
  Quote, QuoteItem, Employee, Todo, Visa, Supplier,
  Account, TransactionCategory, Transaction, Budget,
  CalendarEvent, WorkspaceItem, TimeboxSession, Template
} from '../src/types'

// ========================================
// 業務實體（有編號）
// ========================================

/**
 * 旅遊團 Store
 * 編號格式：T20250001
 */
export const useTourStore = createStore<Tour>('tours', 'T')

/**
 * 訂單 Store
 * 編號格式：O20250001
 */
export const useOrderStore = createStore<Order>('orders', 'O')

/**
 * 客戶 Store
 * 編號格式：C20250001
 */
export const useCustomerStore = createStore<Customer>('customers', 'C')

/**
 * 收款 Store
 * 編號格式：P20250001
 */
export const usePaymentStore = createStore<Payment>('payments', 'P')

/**
 * 報價單 Store
 * 編號格式：Q20250001
 */
export const useQuoteStore = createStore<Quote>('quotes', 'Q')

/**
 * 請款單 Store
 * 編號格式：PR20250001
 */
export const usePaymentRequestStore = createStore<PaymentRequest>('payment_requests', 'PR')

/**
 * 出納單 Store
 * 編號格式：DO20250001
 */
export const useDisbursementOrderStore = createStore<DisbursementOrder>('disbursement_orders', 'DO')

/**
 * 收款單 Store
 * 編號格式：RO20250001
 */
export const useReceiptOrderStore = createStore<ReceiptOrder>('receipt_orders', 'RO')

/**
 * 簽證 Store
 * 編號格式：V20250001
 */
export const useVisaStore = createStore<Visa>('visas', 'V')

/**
 * 供應商 Store
 * 編號格式：S20250001
 */
export const useSupplierStore = createStore<Supplier>('suppliers', 'S')

// ========================================
// 系統管理（無編號）
// ========================================

/**
 * 員工 Store
 */
export const useEmployeeStore = createStore<Employee>('employees')

/**
 * 團員 Store
 */
export const useMemberStore = createStore<Member>('members')

/**
 * 報價項目 Store
 */
export const useQuoteItemStore = createStore<QuoteItem>('quote_items')

/**
 * 待辦事項 Store
 */
export const useTodoStore = createStore<Todo>('todos')

// ========================================
// 會計系統（4 個獨立 Store）
// ========================================

/**
 * 帳戶 Store
 */
export const useAccountStore = createStore<Account>('accounts')

/**
 * 交易分類 Store
 */
export const useCategoryStore = createStore<TransactionCategory>('categories')

/**
 * 交易記錄 Store
 */
export const useTransactionStore = createStore<Transaction>('transactions')

/**
 * 預算 Store
 */
export const useBudgetStore = createStore<Budget>('budgets')

// ========================================
// 其他功能
// ========================================

/**
 * 行事曆事件 Store
 */
export const useCalendarEventStore = createStore<CalendarEvent>('calendar_events')

/**
 * 工作區項目 Store
 */
export const useWorkspaceItemStore = createStore<WorkspaceItem>('workspace_items')

/**
 * 時間盒會話 Store
 */
export const useTimeboxSessionStore = createStore<TimeboxSession>('timebox_sessions')

/**
 * 模板 Store
 */
export const useTemplateStore = createStore<Template>('templates')

// ========================================
// 特殊 Store（保留原有實作）
// ========================================

export { useAuthStore } from '../src/stores/auth-store'
export { useThemeStore } from '../src/stores/theme-store'
export { useHomeSettingsStore } from '../src/stores/home-settings-store'
