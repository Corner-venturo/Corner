/**
 * Delete 操作
 * 負責刪除資料（FastIn 模式：立即刪除 → 背景同步）
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { generateUUID } from '@/lib/utils/uuid'
import { localDB } from '@/lib/db'
import { logger } from '@/lib/utils/logger'

/**
 * 刪除資料（FastIn 模式）
 */
export async function deleteItem<T extends BaseEntity>(
  id: string,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<void> {
  const { tableName, enableSupabase } = config

  try {
    // FastIn Step 1: 加入刪除隊列（用於背景同步）
    const item = await indexedDB.getById(id)

    if (item) {
      // 加入刪除隊列
      try {
        await localDB.put('syncQueue', {
          id: generateUUID(),
          table_name: tableName,
          record_id: id,
          operation: 'delete',
          data: item,
          created_at: new Date().toISOString(),
        })
        logger.log(`📝 [${tableName}] FastIn: 已加入刪除隊列`)
      } catch (queueError) {
        logger.warn(`⚠️ [${tableName}] FastIn: 無法加入刪除隊列:`, queueError)
      }
    }

    // FastIn Step 2: 立即從 IndexedDB 刪除
    await indexedDB.delete(id)
    logger.log(`💾 [${tableName}] FastIn: 已從本地刪除`)

    // FastIn Step 3: 背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined') {
      setTimeout(async () => {
        try {
          logger.log(`☁️ [${tableName}] FastIn: 開始背景同步刪除...`)
          await sync.uploadLocalChanges()
          logger.log(`✅ [${tableName}] FastIn: 背景同步刪除完成`)
        } catch (syncError) {
          logger.warn(`⚠️ [${tableName}] FastIn: 背景同步刪除失敗（不影響本地）`, syncError)
        }
      }, 0)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '刪除失敗'
    logger.error(`❌ [${tableName}] delete 失敗:`, error)
    throw new Error(errorMessage)
  }
}

/**
 * 批次刪除資料
 */
export async function deleteMany<T extends BaseEntity>(
  ids: string[],
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<void> {
  for (const id of ids) {
    await deleteItem(id, config, indexedDB, supabase, sync)
  }

  logger.log(`✅ [${config.tableName}] deleteMany: 已刪除 ${ids.length} 筆`)
}
