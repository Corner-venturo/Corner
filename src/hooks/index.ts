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
export { useEnterSubmit } from './useEnterSubmit'
export { useCrudOperations } from './useCrudOperations'
export { useDataFiltering } from './useDataFiltering'
export { useListPageState } from './useListPageState'

// Dialog 生命週期管理 Hooks
export {
  useManagedDialogState,
  useSimpleDialogState,
  type UseManagedDialogStateOptions,
  type UseManagedDialogStateReturn,
} from './useManagedDialogState'

// 統一的 Dialog 狀態管理 Hooks (P2 優化)
export {
  useDialogState,
  useMultiDialogState,
  type UseDialogStateOptions,
  type UseDialogStateReturn,
} from './useDialogState'

// OCR 辨識 Hook
export { useOcrRecognition, type OcrParsedData } from './useOcrRecognition'

// 統一的異步操作狀態管理 Hooks (P2 優化)
export {
  useAsyncData,
  useLoadingState,
  useMultiLoadingState,
  type UseAsyncDataOptions,
  type UseAsyncDataReturn,
  type ExecuteOptions,
} from './useAsyncData'

// 圖片編輯 Hook - 請直接從 '@/hooks/image-editor' 匯入
// import { useImageEditor } from '@/hooks/image-editor'

// 導航 Hooks
export {
  useBreadcrumb,
  getPageTitle,
  getParentPath,
  type BreadcrumbItem,
  type UseBreadcrumbOptions,
} from './useBreadcrumb'
