/**
 * Hooks 統一匯出
 * 通用 Hooks 的統一入口
 *
 * 注意：業務邏輯 Hooks 已遷移至 features/ 目錄
 * - useTours → @/features/tours/hooks/useTours
 * - useOrders → @/features/orders/hooks/useOrders
 * - useCustomers → @/features/customers/hooks/useCustomers
 * - usePayments → @/features/payments/hooks/usePayments (deprecated)
 */

// 通用 Hooks
export { usePermissions } from './usePermissions'
export { useDialog } from './useDialog'
export { useEnterSubmit } from './useEnterSubmit'
export { useCrudOperations } from './useCrudOperations'
export { useDataFiltering } from './useDataFiltering'
export { useDialogState } from './useDialogState'
export { useListPageState } from './useListPageState'

// Dialog 生命週期管理 Hooks
export {
  useManagedDialogState,
  useSimpleDialogState,
  type UseManagedDialogStateOptions,
  type UseManagedDialogStateReturn,
} from './useManagedDialogState'

// 圖片編輯 & OCR 辨識 Hooks
export { useImageEditor } from './useImageEditor'
export { useOcrRecognition, type OcrParsedData } from './useOcrRecognition'

// 導航 Hooks
export {
  useBreadcrumb,
  getPageTitle,
  getParentPath,
  type BreadcrumbItem,
  type UseBreadcrumbOptions,
} from './useBreadcrumb'
