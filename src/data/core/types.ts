/**
 * 統一資料層型別定義
 */

// ============================================
// 基礎型別
// ============================================

export interface BaseEntity {
  id: string
  created_at?: string | null
  updated_at?: string | null
  workspace_id?: string | null
}

// ============================================
// 快取配置
// ============================================

export interface CacheConfig {
  /** 快取存活時間（毫秒） */
  ttl?: number
  /** 資料視為新鮮的時間（毫秒） */
  staleTime?: number
  /** 是否去重複請求 */
  dedupe?: boolean
  /** 切換視窗時是否重新載入 */
  revalidateOnFocus?: boolean
  /** 重新連線時是否重新載入 */
  revalidateOnReconnect?: boolean
}

// 預設快取配置
export const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  ttl: 60000,              // 1 分鐘
  staleTime: 30000,        // 30 秒
  dedupe: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
}

// 快取配置預設值
export const CACHE_PRESETS = {
  /** 高頻資料（tours, orders）*/
  high: {
    ttl: 60000,
    staleTime: 30000,
    dedupe: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  },
  /** 中頻資料（quotes, itineraries）*/
  medium: {
    ttl: 300000,
    staleTime: 60000,
    dedupe: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  },
  /** 低頻資料（regions, settings）*/
  low: {
    ttl: 3600000,
    staleTime: 300000,
    dedupe: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  },
} as const

// ============================================
// Entity 配置
// ============================================

export interface ListConfig {
  /** 要選取的欄位 */
  select: string
  /** 排序設定 */
  orderBy?: {
    column: string
    ascending: boolean
  }
  /** 預設過濾條件 */
  defaultFilter?: Record<string, unknown>
}

export interface EntityConfig {
  /** 列表查詢配置 */
  list?: ListConfig
  /** 精簡版查詢配置（列表顯示用）*/
  slim?: {
    select: string
  }
  /** 單筆查詢配置 */
  detail?: {
    select: string
  }
  /** 快取配置 */
  cache?: CacheConfig
  /** 是否啟用 workspace 隔離（預設根據表格名稱自動判斷）*/
  workspaceScoped?: boolean
}

// ============================================
// Hook 選項
// ============================================

export interface ListOptions {
  /** 是否啟用載入（false 時不會發送請求） */
  enabled?: boolean
}

// ============================================
// Hook 回傳型別
// ============================================

export interface ListResult<T> {
  items: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface DetailResult<T> {
  item: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface PaginatedParams {
  page: number
  pageSize: number
  filter?: Record<string, unknown>
  search?: string
  searchFields?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export interface DictionaryResult<T> {
  dictionary: Record<string, Partial<T>>
  loading: boolean
  get: (id: string) => Partial<T> | undefined
}

// ============================================
// Entity Hook 型別
// ============================================

export interface EntityHook<T extends BaseEntity> {
  /** 列表 hook（支援 enabled 選項控制是否載入） */
  useList: (options?: ListOptions) => ListResult<T>
  /** 精簡列表 hook（支援 enabled 選項控制是否載入） */
  useListSlim: (options?: ListOptions) => ListResult<Partial<T>>
  /** 單筆 hook（支援 skip pattern）*/
  useDetail: (id: string | null) => DetailResult<T>
  /** 分頁 hook */
  usePaginated: (params: PaginatedParams) => PaginatedResult<T>
  /** Dictionary hook */
  useDictionary: () => DictionaryResult<T>
  /** 建立（code 可選，會自動生成）*/
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at' | '_needs_sync' | '_synced_at' | '_deleted' | 'code'> & { code?: string }) => Promise<T>
  /** 更新 */
  update: (id: string, data: Partial<T>) => Promise<T>
  /** 刪除 */
  delete: (id: string) => Promise<boolean>
  /** 使快取失效 */
  invalidate: () => Promise<void>
}
