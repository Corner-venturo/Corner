/**
 * 資料存取層 (Data Access Layer) 統一導出
 *
 * 將所有 Supabase 查詢邏輯集中管理，實現 UI 與資料邏輯的徹底分離。
 *
 * 使用方式：
 * ```typescript
 * // Server Components (伺服器端)
 * import { getPaginatedOrders, getPaginatedTours } from '@/lib/data'
 *
 * // Client Components (客戶端)
 * import { getChannelMessages, getAllTodos } from '@/lib/data'
 * ```
 *
 * 架構優勢：
 * - 單一責任原則：查詢邏輯與 UI 分離
 * - 可測試性：可以獨立測試資料查詢函式
 * - 可重用性：多個元件可以共用相同的查詢函式
 * - 可維護性：查詢邏輯變更時只需修改一處
 */

// ============================================
// Server-side Data Access (Server Components)
// ============================================

// Orders
export {
  getPaginatedOrders,
  getOrderById,
  getOrdersByTourId,
  type GetPaginatedOrdersParams,
  type PaginatedOrdersResult,
} from './orders'

// Customers
export {
  getPaginatedCustomers,
  getCustomerById,
  checkCustomerByPassport,
  type GetPaginatedCustomersParams,
  type PaginatedCustomersResult,
} from './customers'

// Quotes
export {
  getPaginatedQuotes,
  getQuotesPageData,
  getQuoteById,
  type GetPaginatedQuotesParams,
  type PaginatedQuotesResult,
  type QuotesPageData,
} from './quotes'

// Tours
export {
  getPaginatedTours,
  getTourById,
  getActiveToursForSelect,
  type GetPaginatedToursParams,
  type PaginatedToursResult,
} from './tours'

// ============================================
// Client-side Data Access (Client Components)
// ============================================

// Messages
export {
  getChannelMessages,
  getChannelMessagesSimple,
  getMessageAuthor,
  type GetChannelMessagesParams,
  type MessageWithAuthor,
} from './messages'

// Todos
export {
  getAllTodos,
  getTodoById,
  getTodosByStatus,
  getTodosByAssignee,
  getTodosByEntity,
} from './todos'

// ============================================
// Utilities
// ============================================

export { generateId, generateTimestamp } from './create-data-store'
