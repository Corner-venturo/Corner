/**
 * Hooks 統一匯出
 * 業務邏輯層的統一入口
 */

// 業務 Hooks
export { useTours } from './useTours'
export { useOrders } from './useOrders'
export { useCustomers } from './useCustomers'
// usePayments deprecated (moved to features/payments/hooks/usePayments.ts)
// export { usePayments } from './usePayments';

// 現有通用 Hooks
export { usePermissions } from './usePermissions'
export { useDialog } from './useDialog'
export { useEnterSubmit } from './useEnterSubmit'
export { useCrudOperations } from './useCrudOperations'
export { useStatusBadge } from './useStatusBadge'
export { useDataFiltering } from './useDataFiltering'
export { useDialogState } from './useDialogState'
export { useListPageState } from './useListPageState'
