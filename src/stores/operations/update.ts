/**
 * Update 操作（簡化版：直接更新 Supabase + IndexedDB）
 */

import type { BaseEntity } from '@/types';
import type { StoreConfig, UpdateInput } from '../core/types';
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter } from '../adapters/supabase-adapter';
import { SyncCoordinator } from '../sync/coordinator';
import { logger } from '@/lib/utils/logger';

/**
 * 更新資料（簡化版：直接更新）
 */
export async function update<T extends BaseEntity>(
  id: string,
  data: UpdateInput<T>,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T> {
  const { tableName, enableSupabase } = config;

  try {
    // ✅ 步驟 1：先更新 Supabase（確保雲端同步）
    if (enableSupabase && typeof window !== 'undefined') {
      await supabase.update(id, data);
    }

    // ✅ 步驟 2：更新 IndexedDB（本地快取）
    await indexedDB.update(id, data);

    // 取得更新後的完整資料
    const updatedItem = await indexedDB.getById(id);
    if (!updatedItem) {
      throw new Error('找不到要更新的項目');
    }

    return updatedItem;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '更新失敗';
    logger.error(`❌ [${tableName}] 更新失敗:`, error);
    throw new Error(errorMessage);
  }
}
