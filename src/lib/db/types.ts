/**
 * 共用型別定義
 */

/**
 * 帶時間戳的記錄型別
 */
export interface WithTimestamps {
  created_at?: string
  updated_at?: string
}

/**
 * 查詢選項
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  direction?: 'asc' | 'desc'
}

/**
 * 過濾條件
 */
export interface FilterCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  value: unknown
}
