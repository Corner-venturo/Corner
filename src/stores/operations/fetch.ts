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
        logger.log(`💾 [${tableName}] IndexedDB 讀取成功:`, cachedItems.length, '筆');
      } catch (error) {
        logger.warn(`⚠️ [${tableName}] IndexedDB 讀取失敗，跳過快取`);
        cachedItems = [];
      }

      // 2. ✅ 離線優先策略（無論首次或後續）
      // 策略：
      // - 有快取 → 立即返回，背景同步
      // - 無快取 → 返回空陣列，背景下載（不阻擋 UI）

      if (cachedItems.length > 0) {
        // 情境 A：有快取資料 → 離線優先：立即返回快取
        logger.log(`💾 [${tableName}] 立即返回快取:`, cachedItems.length, '筆');

        // 🔄 背景靜默同步（不阻擋 UI，不影響返回值）
        // 策略：上傳本地修改，Realtime 會自動推送其他人的新增/更新
        Promise.resolve().then(async () => {
          try {
            await sync.uploadLocalChanges();
            logger.log(`✅ [${tableName}] 本地修改已上傳`);
          } catch (err) {
            // 靜默失敗
          }
        });

        return cachedItems; // ← 立即返回，依賴 Realtime 推送新資料
      }

      // 情境 B：無快取資料 → 顯示 loading，快速下載前 100 筆
      logger.log(`🔄 [${tableName}] 無快取，快速載入前 100 筆...`);

      try {
        // ✅ 策略：先快速下載前 100 筆顯示（1 秒內）
        const { data: initialItems, error: fetchError } = await supabase.supabase
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
          // 存入快取
          try {
            await indexedDB.batchPut(typedInitialItems, 1000);
            logger.log(`✅ [${tableName}] 快速載入完成:`, typedInitialItems.length, '筆');
          } catch (putError) {
            // 🔥 IndexedDB 寫入失敗 - 這是嚴重問題，需要記錄
            logger.error(`❌ [${tableName}] IndexedDB 寫入失敗:`, putError);
            // 即使寫入失敗，仍然返回資料（記憶體模式）
          }

          // 🎯 背景下載剩餘資料（不阻擋 UI）
          Promise.resolve().then(async () => {
            try {
              logger.log(`🔄 [${tableName}] 開始背景下載剩餘資料...`);
              const allItems = await supabase.fetchAll();
              if (allItems.length > typedInitialItems.length) {
                try {
                  await indexedDB.batchPut(allItems, 1000);
                  logger.log(`✅ [${tableName}] 背景下載完成:`, allItems.length, '筆');
                } catch (putError) {
                  logger.error(`❌ [${tableName}] 背景下載寫入 IndexedDB 失敗:`, putError);
                }
              }
            } catch (err) {
              logger.error(`❌ [${tableName}] 背景下載失敗:`, err);
            }
          });

          return typedInitialItems;
        }

        // 沒有資料，返回空陣列
        logger.log(`ℹ️ [${tableName}] Supabase 無資料`);
        return [];
      } catch (err) {
        logger.error(`❌ [${tableName}] 快速載入失敗:`, err);

        // 嘗試從 IndexedDB 讀取（可能有舊資料）
        try {
          const fallbackItems = await indexedDB.getAll();
          if (fallbackItems.length > 0) {
            logger.log(`💾 [${tableName}] 降級到 IndexedDB:`, fallbackItems.length, '筆（舊資料）');
            return fallbackItems;
          }
        } catch (idbError) {
          logger.error(`❌ [${tableName}] IndexedDB 讀取也失敗:`, idbError);
        }

        // 完全失敗，返回空陣列（記憶體模式）
        logger.warn(`⚠️ [${tableName}] 所有資料源都失敗，返回空陣列`);
        return [];
      }
    } else {
      // 從 IndexedDB 讀取（離線模式或未啟用 Supabase）
      logger.log(`💾 [${tableName}] 從 IndexedDB 載入資料（離線模式）...`);
      const items = await indexedDB.getAll();
      logger.log(`✅ [${tableName}] IndexedDB 讀取成功:`, items.length, '筆');
      return items;
    }
  } catch (error) {
    // 任何錯誤：靜默切換到本地模式
    try {
      const items = await indexedDB.getAll();
      logger.log(`💾 [${tableName}] 降級到 IndexedDB:`, items.length, '筆');
      return items;
    } catch (localError) {
      // 連 IndexedDB 都失敗，拋出錯誤
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
