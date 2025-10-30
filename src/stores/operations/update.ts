/**
 * Update 操作
 * 負責更新資料（FastIn 模式：本地先更新 → 背景同步）
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig, UpdateInput } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { isSyncableTable } from '@/lib/db/sync-schema-helper'
import { logger } from '@/lib/utils/logger'

/**
 * 更新資料（FastIn 模式）
 */
export async function update<T extends BaseEntity>(
  id: string,
  data: UpdateInput<T>,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T> {
  const { tableName, enableSupabase } = config

  try {
    // 檢查是否為可同步表
    const needsSyncFields = isSyncableTable(tableName)

    // FastIn Step 1: 準備更新資料（標記為待同步）
    let syncData: Partial<T> = data
    if (needsSyncFields) {
      syncData = {
        ...data,
        _needs_sync: true,
        _synced_at: null,
      } as Partial<T>
    }

    // FastIn Step 2: 立即更新 IndexedDB
    await indexedDB.update(id, syncData)
    logger.log(`💾 [${tableName}] FastIn: 已更新本地 IndexedDB`)

    // 取得更新後的完整資料
    const updatedItem = await indexedDB.getById(id)
    if (!updatedItem) {
      throw new Error('找不到要更新的項目')
    }

    // FastIn Step 3: 背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined' && needsSyncFields) {
      setTimeout(async () => {
        try {
          logger.log(`☁️ [${tableName}] FastIn: 開始背景同步...`)
          await sync.uploadLocalChanges()
          logger.log(`✅ [${tableName}] FastIn: 背景同步完成`)
        } catch (syncError) {
          logger.warn(`⚠️ [${tableName}] FastIn: 背景同步失敗（不影響本地資料）`, syncError)
        }
      }, 0)
    }

    return updatedItem
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '更新失敗'
    logger.error(`❌ [${tableName}] update 失敗:`, error)
    throw new Error(errorMessage)
  }
}
