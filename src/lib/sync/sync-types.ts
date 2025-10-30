/**
 * 同步服務相關型別定義
 */

import { BaseEntity, SyncableEntity } from '@/types'
import { TableName } from '@/lib/db/schemas'

/**
 * 具有 code 欄位的實體（用於 TBC 編號檢查）
 */
export interface CodedEntity extends BaseEntity {
  code?: string
}

/**
 * TBC 實體 - 離線建立時使用臨時編號的實體
 */
export interface TbcEntity extends SyncableEntity {
  code: string // TBC 編號（如 T2025TBC）
}

/**
 * 同步隊列項目（用於刪除操作）
 */
export interface SyncQueueItem extends BaseEntity {
  table_name: TableName
  record_id: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
}

/**
 * 型別守衛：檢查是否為可同步實體
 */
export function isSyncableEntity(item: unknown): item is SyncableEntity {
  if (!item || typeof item !== 'object') return false
  const entity = item as Record<string, unknown>
  return (
    typeof entity.id === 'string' &&
    typeof entity._needs_sync === 'boolean' &&
    (entity._synced_at === null || typeof entity._synced_at === 'string')
  )
}

/**
 * 型別守衛：檢查是否有 code 欄位
 */
export function hasCode(item: unknown): item is CodedEntity {
  if (!item || typeof item !== 'object') return false
  const entity = item as Record<string, unknown>
  return (
    typeof entity.id === 'string' && (entity.code === undefined || typeof entity.code === 'string')
  )
}

/**
 * 型別守衛：檢查是否為 TBC 編號實體
 */
export function isTbcEntity(item: unknown): item is TbcEntity {
  if (!hasCode(item)) return false
  return typeof item.code === 'string' && item.code.endsWith('TBC')
}

/**
 * 型別守衛：檢查是否為同步隊列項目
 */
export function isSyncQueueItem(item: unknown): item is SyncQueueItem {
  if (!item || typeof item !== 'object') return false
  const entity = item as Record<string, unknown>
  return (
    typeof entity.id === 'string' &&
    typeof entity.table_name === 'string' &&
    typeof entity.record_id === 'string' &&
    typeof entity.operation === 'string' &&
    ['create', 'update', 'delete'].includes(entity.operation as string)
  )
}

/**
 * 型別守衛：檢查是否為待同步實體
 */
export function needsSync(item: unknown): boolean {
  if (!isSyncableEntity(item)) return false
  return item._needs_sync === true && !item._deleted
}

/**
 * 型別守衛：檢查是否為軟刪除實體
 */
export function isDeleted(item: unknown): boolean {
  if (!item || typeof item !== 'object') return false
  const entity = item as Record<string, unknown>
  return entity._deleted === true
}
