/**
 * 基礎型別定義
 * 所有實體的基礎介面和通用型別
 */

// ============================================
// 基礎實體介面
// ============================================

/**
 * BaseEntity - 所有實體的基礎介面
 * 包含共用的 ID 和時間戳記欄位
 */
export interface BaseEntity {
  id: string
  created_at: string // ISO 8601 格式
  updated_at: string // ISO 8601 格式
  created_by?: string | null
  updated_by?: string | null
}

/**
 * SyncableEntity - 可同步實體的基礎介面
 * 繼承 BaseEntity 並加入同步相關欄位
 *
 * FastIn 架構欄位說明：
 * - _needs_sync: 是否需要同步到 Supabase（true = 待同步）
 * - _synced_at: 最後同步時間（null = 尚未同步）
 * - _deleted: 軟刪除標記（用於延遲刪除同步）
 */
export interface SyncableEntity extends BaseEntity {
  _needs_sync: boolean // 是否待同步
  _synced_at: string | null // 最後同步時間 (ISO 8601)
  _deleted?: boolean // 軟刪除標記
}

/**
 * @deprecated 舊版同步狀態型別，已改用 _needs_sync 布林值
 * 保留此型別以維持向後相容
 */
export type SyncStatus = 'pending' | 'synced' | 'conflict'

// ============================================
// 分頁相關型別
// ============================================

/**
 * PageRequest - 分頁請求參數
 */
export interface PageRequest {
  page: number // 頁碼（從 1 開始）
  page_size: number // 每頁筆數
  sort?: Sort[] // 排序條件
  filter?: Filter[] // 篩選條件
}

/**
 * PageResponse - 分頁回應資料
 */
export interface PageResponse<T> {
  data: T[] // 資料列表
  total: number // 總筆數
  page: number // 當前頁碼
  page_size: number // 每頁筆數
  total_pages: number // 總頁數
}

// ============================================
// 篩選與排序
// ============================================

/**
 * Filter - 篩選條件
 */
export interface Filter {
  field: string // 欄位名稱
  operator: FilterOperator // 運算子
  value: string | number | boolean | string[]
}

/**
 * FilterOperator - 篩選運算子
 */
export type FilterOperator =
  | 'eq' // 等於
  | 'ne' // 不等於
  | 'gt' // 大於
  | 'gte' // 大於等於
  | 'lt' // 小於
  | 'lte' // 小於等於
  | 'like' // 模糊搜尋
  | 'in' // 包含於
  | 'notIn' // 不包含於

/**
 * Sort - 排序條件
 */
export interface Sort {
  field: string
  order: 'asc' | 'desc'
}

// ============================================
// API 回應格式
// ============================================

/**
 * ApiResponse - 統一 API 回應格式
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

/**
 * ApiError - API 錯誤格式
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// ============================================
// 載入狀態
// ============================================

/**
 * LoadingState - 載入狀態
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * AsyncState - 非同步狀態管理
 */
export interface AsyncState<T> {
  data: T | null
  loading: LoadingState
  error: string | null
}
