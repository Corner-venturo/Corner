/**
 * Venturo 業務層統一導出
 *
 * 使用範例：
 * import { usePayments, useTours, useOrders } from '@/features';
 *
 * 這個檔案提供了所有業務層 Hooks 的統一入口，
 * 方便管理和使用，也讓 IDE 自動補全更友善。
 */

// ========== Hooks ==========
export { usePayments } from './payments/hooks/usePayments'
export { useQuotes } from './quotes/hooks/useQuotes'
export { useOrders } from './orders/hooks/useOrders'
export { useTodos } from './todos/hooks/useTodos'
export { useAccounting } from './accounting/hooks/useAccounting'
export { useTours } from './tours/hooks/useTours'
export { useSuppliers } from './suppliers/hooks/useSuppliers'
export { useCustomers } from './customers/hooks/useCustomers'

// ========== Services ==========
// paymentService deprecated (moved to payment.service.deprecated.ts)
// export { paymentService } from './payments/services/payment.service';
export { quoteService } from './quotes/services/quote.service'
export { orderService } from './orders/services/order.service'
export { todoService } from './todos/services/todo.service'
export { accountingService, categoryService } from './accounting/services/accounting.service'
export { tourService } from './tours/services/tour.service'
export { supplierService } from './suppliers/services/supplier.service'
export { customerService } from './customers/services/customer.service'

// ========== Types (Re-export for convenience) ==========
export type {
  PaymentRequest,
  PaymentRequestItem,
  DisbursementOrder,
  Quote,
  Order,
  Todo,
  Tour,
  Supplier,
  Customer,
  // Account,
  // Transaction,
  // Category,
} from '@/stores/types'
