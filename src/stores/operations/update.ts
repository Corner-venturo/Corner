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
    // 清理資料：將空字串的時間欄位轉為 null（PostgreSQL 不接受空字串）
    const cleanedData = { ...data } as Record<string, unknown>;
    Object.keys(cleanedData).forEach(key => {
      const value = cleanedData[key];
      // 時間相關欄位：空字串轉 null
      if (
        (key.endsWith('_at') || key.endsWith('_date') || key === 'deadline') &&
        value === ''
      ) {
        cleanedData[key] = null;
      }
    });

    // ✅ 步驟 1：更新 IndexedDB（本地快取）⚡ 立即反映
    await indexedDB.update(id, cleanedData as UpdateInput<T>);

    // ✅ 步驟 2：背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined') {
      supabase.update(id, cleanedData as UpdateInput<T>).catch(error => {
        logger.warn(`⚠️ [${tableName}] Supabase 背景同步失敗（已保存到本地）:`, error);
      });
    }

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
