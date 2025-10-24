/**
 * 核心資料模型定義
 * 統一的型別定義，供整個應用使用
 */

import { Database } from '@/lib/supabase/types'
import type { ChannelPoll } from './workspace.types'

// ==================== 基礎型別 ====================

export type ID = string  // 統一使用 string
export type ISODateTime = string  // ISO 8601 格式時間戳記
export type Email = string
export type URL = string

// ==================== Supabase 表格型別映射 ====================

export type Employee = Database['public']['Tables']['employees']['Row']
export type Tour = Database['public']['Tables']['tours']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Todo = Database['public']['Tables']['todos']['Row']
export type Visa = Database['public']['Tables']['visas']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type QuoteItem = Database['public']['Tables']['quote_items']['Row']
export type PaymentRequest = Database['public']['Tables']['payment_requests']['Row']
export type DisbursementOrder = Database['public']['Tables']['disbursement_orders']['Row']
export type ReceiptOrder = Database['public']['Tables']['receipt_orders']['Row']

// ==================== 使用者相關 ====================

/**
 * 當前登入使用者
 */
export interface User {
  id: ID
  employee_number: string
  display_name: string
  english_name: string
  email: Email
  permissions: string[]
  avatar?: URL
  is_active: boolean
  last_login_at?: ISODateTime
}

// ==================== 工作區相關 ====================

/**
 * 工作區
 */
export interface Workspace {
  id: ID
  name: string
  description?: string
  owner_id: ID
  member_ids: ID[]
  settings: WorkspaceSettings
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface WorkspaceSettings {
  theme?: 'light' | 'dark' | 'auto'
  language?: 'zh-TW' | 'en-US'
  timezone?: string
}

// ==================== 文件/訊息相關 ====================

/**
 * 通用文件介面
 */
export interface Document {
  id: ID
  title: string
  content: string
  author_id: ID
  created_at: ISODateTime
  updated_at: ISODateTime
  tags?: string[]
}

/**
 * 頻道訊息
 */
export interface Message {
  id: ID
  channel_id: ID
  author_id: ID
  content: string
  type: 'text' | 'image' | 'file' | 'system' | 'poll'
  attachments?: Attachment[]
  created_at: ISODateTime
  updated_at?: ISODateTime
  deleted_at?: ISODateTime
  poll?: ChannelPoll
}

export interface Attachment {
  id: ID
  name: string
  url: URL
  size: number
  type: string
}

// ==================== Widget 相關 ====================

/**
 * 首頁小工具
 */
export interface Widget {
  id: string
  type: WidgetType
  title: string
  config?: WidgetConfig
  position?: WidgetPosition
  size?: WidgetSize
}

export type WidgetType =
  | 'calculator'
  | 'weather'
  | 'map'
  | 'todo'
  | 'calendar'
  | 'clock'
  | 'notes'

export interface WidgetConfig {
  [key: string]: unknown
}

export interface WidgetPosition {
  x: number
  y: number
}

export interface WidgetSize {
  width: number
  height: number
  minHeight?: number
  preferredAspectRatio?: number
}

// ==================== 同步相關 ====================

/**
 * 同步狀態
 */
export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: ISODateTime | null
  error: string | null
}

/**
 * 待同步項目
 */
export interface PendingChange {
  id: ID
  table: string
  operation: 'create' | 'update' | 'delete'
  data: unknown
  timestamp: ISODateTime
  retries: number
}

/**
 * 同步衝突
 */
export interface SyncConflict {
  id: ID
  table: string
  recordId: ID
  localData: unknown
  remoteData: unknown
  timestamp: ISODateTime
}

// ==================== API 響應 ====================

/**
 * API 成功響應
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * API 錯誤響應
 */
export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// ==================== 分頁 ====================

/**
 * 分頁參數
 */
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分頁響應
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== 表單 ====================

/**
 * 表單狀態
 */
export interface FormState<T = unknown> {
  data: T
  errors: FormErrors<T>
  touched: FormTouched<T>
  isSubmitting: boolean
  isValid: boolean
}

export type FormErrors<T> = Partial<Record<keyof T, string>>
export type FormTouched<T> = Partial<Record<keyof T, boolean>>

// ==================== 過濾與搜尋 ====================

/**
 * 過濾條件
 */
export interface FilterCondition<T = unknown> {
  field: keyof T
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like'
  value: unknown
}

/**
 * 搜尋參數
 */
export interface SearchParams {
  query: string
  fields?: string[]
  filters?: FilterCondition[]
  pagination?: PaginationParams
}
