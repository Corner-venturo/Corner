/**
 * Store 核心型別定義
 */

import { BaseEntity } from '@/types'
import { TableName } from '@/lib/db/schemas'
import type { Database } from '@/lib/supabase/types'
import type { ZodSchema } from 'zod'

/**
 * Supabase 表格名稱類型（用於 .from() 方法）
 * 從 typed-client 統一匯出
 */
export type { SupabaseTableName } from '@/lib/supabase/typed-client'
import type { SupabaseTableName } from '@/lib/supabase/typed-client'

/**
 * 建立資料的輸入型別
 * 移除系統自動生成的欄位，允許覆寫預設值
 */
export type CreateInput<T extends BaseEntity> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'is_active' | 'sync_status'
> & {
  // 允許覆寫預設值（選填）
  is_active?: boolean
  sync_status?: 'pending' | 'synced' | 'error'
}

/**
 * 更新資料的輸入型別
 * 所有欄位都是選填的，但不能修改 id 和 created_at
 */
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'created_at'>>

/**
 * Store 狀態介面
 */
export interface StoreState<T extends BaseEntity> {
  // 資料狀態
  items: T[]
  loading: boolean
  error: string | null

  // 🔧 請求取消控制器
  _abortController?: AbortController

  // CRUD 操作
  fetchAll: () => Promise<T[]>
  fetchById: (id: string) => Promise<T | null>
  create: (data: CreateInput<T>) => Promise<T>
  update: (id: string, data: UpdateInput<T>) => Promise<T>
  delete: (id: string) => Promise<void>

  // 批次操作
  createMany: (dataArray: CreateInput<T>[]) => Promise<T[]>
  deleteMany: (ids: string[]) => Promise<void>

  // 查詢操作
  findByField: (field: keyof T, value: unknown) => T[]
  filter: (predicate: (item: T) => boolean) => T[]
  count: () => number

  // 工具方法
  clear: () => Promise<void>
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  cancelRequests: () => void

  // 🔄 同步方法
  syncPending?: () => Promise<void>
}

/**
 * 編號生成配置
 */
export interface CodeConfig {
  prefix?: string // 前綴（如 'T', 'O', 'C'）
  year?: number // 年份（預設當前年份）
  quoteType?: 'standard' | 'quick' // 報價單類型（standard: Q 前綴, quick: X 前綴）
}

/**
 * Store 配置選項
 */
export interface StoreConfig {
  /** 資料表名稱 */
  tableName: TableName & SupabaseTableName
  /** 編號前綴（可選，如 'T', 'O', 'C'） */
  codePrefix?: string
  /** 是否啟用 Supabase 同步（預設讀取環境變數） */
  enableSupabase?: boolean
  /** 直接寫入模式（預設 true） */
  fastInsert?: boolean
  /** 是否依 workspace 隔離資料（預設 false）
   * 設為 true 時，fetchAll 會自動過濾 workspace_id
   * Super Admin 可以跨 workspace 查詢
   */
  workspaceScoped?: boolean
  /** Zod schema for validating create data (defense-in-depth) */
  createSchema?: ZodSchema
  /** Zod schema for validating update data (defense-in-depth) */
  updateSchema?: ZodSchema
}

/**
 * 同步狀態
 */
export interface SyncState {
  isPending: boolean
  lastSyncedAt: string | null
  pendingCount: number
}

/**
 * 適配器介面
 */
export interface StorageAdapter<T extends BaseEntity> {
  getAll: () => Promise<T[]>
  getById: (id: string) => Promise<T | null>
  put: (item: T) => Promise<void>
  update: (id: string, data: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
  clear: () => Promise<void>
}

/**
 * 遠端適配器介面（Supabase）
 */
export interface RemoteAdapter<T extends BaseEntity> extends StorageAdapter<T> {
  fetchAll: (signal?: AbortSignal) => Promise<T[]>
  insert: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>
}
