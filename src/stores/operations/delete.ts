/**
 * Delete 操作
 * 負責刪除資料（FastIn 模式：立即刪除 → 背景同步）
 */

import type { BaseEntity } from '@/types';
import type { StoreConfig } from '../core/types';
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter } from '../adapters/supabase-adapter';
import { SyncCoordinator } from '../sync/coordinator';
import { generateUUID } from '@/lib/utils/uuid';
import { localDB } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

/**
 * 刪除資料（簡化版：直接刪除 Supabase + IndexedDB）
 */
export async function deleteItem<T extends BaseEntity>(
  id: string,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<void> {
  const { tableName, enableSupabase } = config;

  try {
    // ✅ 步驟 1：先刪除 Supabase（確保雲端同步）
    if (enableSupabase && typeof window !== 'undefined') {
      logger.log(`☁️ [${tableName}] 刪除 Supabase...`);
      await supabase.delete(id);
      logger.log(`✅ [${tableName}] Supabase 刪除成功`);
    }

    // ✅ 步驟 2：刪除 IndexedDB（本地快取）
    await indexedDB.delete(id);
    logger.log(`💾 [${tableName}] IndexedDB 刪除成功`);

    logger.log(`✅ [${tableName}] 刪除完成: ${id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '刪除失敗';
    logger.error(`❌ [${tableName}] 刪除失敗:`, error);
    throw new Error(errorMessage);
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
    await deleteItem(id, config, indexedDB, supabase, sync);
  }

  logger.log(`✅ [${config.tableName}] deleteMany: 已刪除 ${ids.length} 筆`);
}
