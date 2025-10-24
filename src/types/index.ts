/**
 * 型別定義中央匯出
 * 統一從這裡匯入所有型別
 */

// 基礎型別
export type { Database, Json } from '@/lib/supabase/types'

// 資料模型
export type {
  // 基礎型別
  ID,
  ISODateTime,
  Email,
  URL,

  // Supabase 表格
  Employee,
  Tour,
  Order,
  Customer,
  Member,
  Payment,
  Todo,
  Visa,
  Supplier,
  Quote,
  QuoteItem,
  PaymentRequest,
  DisbursementOrder,
  ReceiptOrder,

  // 使用者
  User,

  // 工作區
  Workspace,
  WorkspaceSettings,

  // 文件/訊息
  Document,
  Message,
  Attachment,

  // Widget
  Widget,
  WidgetType,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,

  // 同步
  SyncStatus,
  PendingChange,
  SyncConflict,

  // API
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,

  // 分頁
  PaginationParams,
  PaginatedResponse,

  // 表單
  FormState,
  FormErrors,
  FormTouched,

  // 過濾與搜尋
  FilterCondition,
  SearchParams,
} from './models'

// Store 型別（稍後添加）
// export type { AuthState, AuthActions } from './store-types'
