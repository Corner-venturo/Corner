/**
 * Supabase Realtime 型別定義
 */

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Realtime 事件類型
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Realtime 變更處理器
 */
export interface RealtimeHandlers<T = unknown> {
  onInsert?: (record: T) => void | Promise<void>
  onUpdate?: (record: T, oldRecord?: T) => void | Promise<void>
  onDelete?: (oldRecord: T) => void | Promise<void>
}

/**
 * Realtime 訂閱配置
 */
export interface RealtimeSubscriptionConfig<T = unknown> {
  /** 資料表名稱 */
  table: string
  /** 監聽的事件類型 */
  event?: RealtimeEventType
  /** Schema 名稱 (預設: public) */
  schema?: string
  /** 過濾條件 (例如: "workspace_id=eq.123") */
  filter?: string
  /** 事件處理器 */
  handlers: RealtimeHandlers<T>
  /** 訂閱 ID (用於識別，預設自動生成) */
  subscriptionId?: string
}

/**
 * Realtime 連線狀態
 */
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'

/**
 * Realtime 訂閱狀態
 */
export interface SubscriptionState {
  id: string
  table: string
  status: RealtimeStatus
  channel: RealtimeChannel | null
  error: Error | null
  retryCount: number
  lastConnectedAt: Date | null
}

/**
 * Realtime Manager 配置
 */
export interface RealtimeManagerConfig {
  /** 是否啟用 Realtime (預設: true) */
  enabled?: boolean
  /** 是否啟用自動重連 (預設: true) */
  autoReconnect?: boolean
  /** 最大重試次數 (預設: 5) */
  maxRetries?: number
  /** 重試延遲 (毫秒，預設: 1000) */
  retryDelay?: number
  /** 是否啟用除錯日誌 (預設: false) */
  debug?: boolean
}

/**
 * Postgres 變更 Payload (簡化版型別)
 */
export type PostgresChangesPayload<T extends Record<string, unknown> = Record<string, unknown>> = RealtimePostgresChangesPayload<T>
