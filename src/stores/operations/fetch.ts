/**
 * Fetch 操作
 * 負責從 IndexedDB 和 Supabase 讀取資料
 */

import type { BaseEntity } from '@/types';
import type { StoreConfig } from '../core/types';
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter } from '../adapters/supabase-adapter';
import { SyncCoordinator } from '../sync/coordinator';
import { MergeStrategy } from '../sync/merge-strategy';
import { logger } from '@/lib/utils/logger';

/**
 * 取得所有資料（IndexedDB 優先，背景同步 Supabase）
 */
export async function fetchAll<T extends BaseEntity>(
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>,
  controller?: AbortController
): Promise<T[]> {
  const { tableName, enableSupabase } = config;

  try {
    if (enableSupabase && typeof window !== 'undefined') {
      // 1. 先從 IndexedDB 讀取（快速顯示）
      let cachedItems: T[] = [];
      try {
        cachedItems = await indexedDB.getAll(3000); // 3 秒超時
      } catch (error) {
        cachedItems = [];
      }

      // 2. ✅ Supabase 優先策略（雲端為權威來源）
      // 策略：
      // - 先顯示快取（避免空白畫面）
      // - 立即從 Supabase 拉取最新資料並覆蓋快取
      // - 確保資料一致性

      // 🎯 立即從 Supabase 拉取最新資料
      try {
        const latestItems = await supabase.fetchAll(controller?.signal);

        // ✅ 完全同步策略：清空舊資料 + 寫入新資料
        await indexedDB.clear();
        await indexedDB.batchPut(latestItems);

        logger.log(`✅ [${tableName}] 從 Supabase 同步 ${latestItems.length} 筆資料`);
        return latestItems;
      } catch (supabaseError) {
        // Supabase 失敗時，才使用快取（靜默降級）
        logger.warn(`⚠️ [${tableName}] Supabase 連線失敗，使用快取資料 (${cachedItems.length} 筆)`, supabaseError);
        return cachedItems;
      }

      // 情境 B：無快取資料 → 快速下載前 100 筆

      try {
        // ✅ 策略：先快速下載前 100 筆顯示（1 秒內）
        const { supabase: supabaseClient } = await import('@/lib/supabase/client');
        const { data: initialItems, error: fetchError } = await supabaseClient
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) {
          logger.error(`❌ [${tableName}] Supabase 查詢失敗:`, fetchError);
          throw fetchError;
        }

        const typedInitialItems = (initialItems || []) as T[];

        if (typedInitialItems.length > 0) {
          // 存入快取（不阻擋返回）
          await indexedDB.batchPut(typedInitialItems);

          // 🎯 背景下載剩餘資料（不阻擋 UI）
          Promise.resolve().then(async () => {
            try {
              const allItems = await supabase.fetchAll();
              if (allItems.length > typedInitialItems.length) {
                await indexedDB.batchPut(allItems);
              }
            } catch (err) {
              // 靜默失敗
            }
          });

          return typedInitialItems;
        }

        return [];
      } catch (err) {
        logger.error(`❌ [${tableName}] 快速載入失敗:`, err);

        // 嘗試從 IndexedDB 讀取（可能有舊資料）
        try {
          const fallbackItems = await indexedDB.getAll();
          if (fallbackItems.length > 0) {
            return fallbackItems;
          }
        } catch (idbError) {
          // 靜默失敗
        }

        return [];
      }
    } else {
      // 從 IndexedDB 讀取（離線模式或未啟用 Supabase）
      const items = await indexedDB.getAll();
      return items;
    }
  } catch (error) {
    // 任何錯誤：靜默切換到本地模式
    try {
      const items = await indexedDB.getAll();
      return items;
    } catch (localError) {
      logger.error(`❌ [${tableName}] 無法載入資料:`, localError);
      throw new Error('無法載入資料');
    }
  }
}

/**
 * 根據 ID 取得單筆資料
 */
export async function fetchById<T extends BaseEntity>(
  id: string,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>
): Promise<T | null> {
  const { tableName, enableSupabase } = config;

  try {
    // 嘗試從 Supabase 讀取
    if (enableSupabase && typeof window !== 'undefined') {
      try {
        const data = await supabase.getById(id);
        logger.log(`☁️ [${tableName}] Supabase getById:`, id);
        return data;
      } catch (supabaseError) {
        // Supabase 失敗（找不到資料或連線錯誤），靜默降級到 IndexedDB
        logger.log(`⚠️ [${tableName}] Supabase 查詢失敗，切換到本地模式`, supabaseError);
      }
    }

    // 從 IndexedDB 讀取（無論是 Supabase 關閉或失敗）
    const item = await indexedDB.getById(id);
    logger.log(`💾 [${tableName}] IndexedDB getById:`, id, item ? '找到' : '未找到');
    return item;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '讀取失敗';
    logger.error(`❌ [${tableName}] fetchById 失敗:`, error);
    throw new Error(errorMessage);
  }
}
