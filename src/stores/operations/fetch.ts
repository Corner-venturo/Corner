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

      // 2. 檢查是否需要首次初始化下載
      const initFlag = `${tableName}_initialized`;
      const isInitialized = localStorage.getItem(initFlag);

      if (!isInitialized && cachedItems.length === 0) {
        // 🔄 首次載入 + 本地為空 → 前景完整下載
        logger.log(`🔄 [${tableName}] 首次初始化，從 Supabase 下載資料...`);

        try {
          const items = await supabase.fetchAll(controller?.signal);

          // 批次存入 IndexedDB（靜默失敗，不阻擋 UI）
          try {
            await indexedDB.batchPut(items, 1000);
          } catch (cacheError) {
            logger.warn(`⚠️ [${tableName}] IndexedDB 快取失敗（不影響功能）`);
          }

          // 設置初始化標記
          localStorage.setItem(initFlag, 'true');

          logger.log(`✅ [${tableName}] 初始化完成:`, items.length, '筆');
          return items;
        } catch (initError) {
          logger.warn(`⚠️ [${tableName}] Supabase 初始化失敗，繼續使用空資料`);
          return [];
        }
      }

      // 3. 已初始化或有快取資料 → 離線優先策略

      // 🎯 策略：立即返回 IndexedDB 快取，同時啟動背景同步
      // 好處：
      // 1. UI 立即顯示（0.1秒）
      // 2. 背景同步確保資料最新
      // 3. Realtime 訂閱處理即時變更

      logger.log(`✅ [${tableName}] 採用離線優先策略`);

      // 如果有快取資料，立即返回
      if (cachedItems.length > 0) {
        logger.log(`💾 [${tableName}] 立即返回快取:`, cachedItems.length, '筆');

        // 背景同步（不阻擋 UI）
        sync.uploadLocalChanges()
          .then(() => logger.log(`📤 [${tableName}] 背景上傳完成`))
          .catch((err) => logger.warn(`⚠️ [${tableName}] 背景上傳失敗:`, err));

        return cachedItems;
      }

      // 沒有快取資料，需要等待 Supabase（首次載入後的情況）
      logger.log(`☁️ [${tableName}] 無快取，從 Supabase 載入...`);

      try {
        await sync.uploadLocalChanges();
        const remoteItems = await supabase.fetchAll(controller?.signal);

        if (remoteItems.length > 0) {
          logger.log(`✅ [${tableName}] Supabase 載入成功:`, remoteItems.length, '筆');
          await indexedDB.batchPut(remoteItems, 1000);
          return remoteItems;
        }

        return [];
      } catch (syncError) {
        logger.warn(`⚠️ [${tableName}] Supabase 載入失敗:`, syncError);
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
