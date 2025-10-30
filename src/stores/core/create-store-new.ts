/**
 * Zustand Store 工廠函數（重構版）
 * 支援 Supabase 雲端同步 + IndexedDB 本地快取
 *
 * 架構：
 * - Supabase: 雲端資料庫（Single Source of Truth）
 * - IndexedDB: 本地快取（離線支援）
 * - Zustand: UI 狀態管理
 */

import { create } from 'zustand';
import { BaseEntity } from '@/types';
import { TableName } from '@/lib/db/schemas';
import { memoryCache } from '@/lib/cache/memory-cache';
import { realtimeManager } from '@/lib/realtime';

// 型別定義
import type { StoreState, StoreConfig } from './types';

// 適配器
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter';
import { SupabaseAdapter } from '../adapters/supabase-adapter';

// 同步邏輯
import { SyncCoordinator } from '../sync/coordinator';
import { storeEventBus } from '../sync/event-bus';
import { networkMonitor } from '@/lib/sync/network-monitor';

// 操作
import { fetchAll, fetchById } from '../operations/fetch';
import { create as createItem, createMany as createManyItems } from '../operations/create';
import { update as updateItem } from '../operations/update';
import { deleteItem, deleteMany as deleteManyItems } from '../operations/delete';
import { findByField, filter, count, clear } from '../operations/query';

// 工具
import { AbortManager } from '../utils/abort-manager';
import { logger } from '@/lib/utils/logger';

/**
 * 建立 Store 工廠函數
 *
 * @example
 * // 基本使用
 * const useTourStore = createStore({ tableName: 'tours', codePrefix: 'T' });
 *
 * // FastIn 模式（預設）
 * const useQuoteStore = createStore({ tableName: 'quotes', fastInsert: true });
 *
 * // 舊版向後相容
 * const useOrderStore = createStore('orders', 'O');
 */
export function createStore<T extends BaseEntity>(
  tableNameOrConfig: TableName | StoreConfig,
  codePrefixParam?: string,
  enableSupabaseParam: boolean = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'
) {
  // 支援兩種調用方式：1. 舊版參數 2. 配置物件
  let config: StoreConfig;
  if (typeof tableNameOrConfig === 'string') {
    // 舊版調用方式（向後相容）
    config = {
      tableName: tableNameOrConfig,
      codePrefix: codePrefixParam,
      enableSupabase: enableSupabaseParam,
      fastInsert: true, // 預設啟用 FastIn
    };
  } else {
    // 新版配置物件
    config = {
      ...tableNameOrConfig,
      enableSupabase: tableNameOrConfig.enableSupabase ?? (process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'),
      fastInsert: tableNameOrConfig.fastInsert ?? true, // 預設啟用 FastIn
    };
  }

  const { tableName, enableSupabase } = config;

  // 建立適配器
  const indexedDB = new IndexedDBAdapter<T>(tableName);
  const supabase = new SupabaseAdapter<T>(tableName, enableSupabase || false);

  // 建立同步協調器
  const sync = new SyncCoordinator<T>(tableName, indexedDB, supabase);

  // 建立 AbortController 管理器
  const abortManager = new AbortManager();

  // 建立 Zustand Store
  // ⚠️ 不使用 persist middleware（避免跨裝置同步問題）
  // 資料持久化完全由 IndexedDB 負責
  const store = create<StoreState<T>>()((set, get) => ({
    // 初始狀態
    items: [],
    loading: false,
    error: null,

        // 設定載入狀態
        setLoading: (loading: boolean) => set({ loading }),

        // 設定錯誤
        setError: (error: string | null) => set({ error }),

        // 取得所有資料（IndexedDB 優先顯示，背景同步 Supabase）
        fetchAll: async () => {
          try {
            // 取消前一個請求
            abortManager.abort();

            // 建立新的 AbortController
            const controller = abortManager.create();

            set({ loading: true, error: null });

            const items = await fetchAll(config, indexedDB, supabase, sync, controller);

            set({ items, loading: false });
            logger.log(`✅ [${tableName}] fetchAll 完成:`, items.length, '筆');
          } catch (error) {
            // 忽略 AbortError
            if (error instanceof Error && error.name === 'AbortError') {
              set({ loading: false });
              return;
            }

            // 其他錯誤：靜默切換到本地模式
            try {
              const items = await indexedDB.getAll();
              set({ items, loading: false, error: null });
            } catch (localError) {
              const errorMessage = localError instanceof Error ? localError.message : '無法載入資料';
              set({ error: errorMessage, loading: false });
            }
          } finally {
            abortManager.abort(); // 清理
          }
        },

        // 根據 ID 取得單筆
        fetchById: async (id: string) => {
          try {
            set({ loading: true, error: null });
            const item = await fetchById(id, config, indexedDB, supabase);
            set({ loading: false });
            return item;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '讀取失敗';
            set({ error: errorMessage, loading: false });
            return null;
          }
        },

        // 建立資料（FastIn 模式）
        create: async (data) => {
          try {
            set({ loading: true, error: null });

            const newItem = await createItem(data, get().items, config, indexedDB, supabase, sync);

            // 樂觀更新 UI
            set((state) => ({
              items: [...state.items, newItem],
              loading: false,
            }));

            // 通知 NetworkMonitor 資料已變更
            networkMonitor?.markDataChanged();

            logger.log(`✅ [${tableName}] 已建立:`, newItem.id);

            return newItem;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '建立失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 更新資料（FastIn 模式）
        update: async (id: string, data: Partial<T>) => {
          try {
            set({ loading: true, error: null });

            const updatedItem = await updateItem(id, data, config, indexedDB, supabase, sync);

            // 樂觀更新 UI
            set((state) => ({
              items: state.items.map(item => item.id === id ? updatedItem : item),
              loading: false,
            }));

            // 通知 NetworkMonitor 資料已變更
            networkMonitor?.markDataChanged();

            logger.log(`✅ [${tableName}] 已更新:`, id);

            return updatedItem;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 刪除資料（FastIn 模式）
        delete: async (id: string) => {
          try {
            set({ loading: true, error: null });

            await deleteItem(id, config, indexedDB, supabase, sync);

            // 樂觀更新 UI
            set((state) => ({
              items: state.items.filter(item => item.id !== id),
              loading: false,
            }));

            // 通知 NetworkMonitor 資料已變更
            networkMonitor?.markDataChanged();

            logger.log(`✅ [${tableName}] 已刪除:`, id);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 批次建立
        createMany: async (dataArray) => {
          const results = await createManyItems(dataArray, get().items, config, indexedDB, supabase, sync);

          // 樂觀更新 UI
          set((state) => ({
            items: [...state.items, ...results],
          }));

          // 通知 NetworkMonitor 資料已變更
          networkMonitor?.markDataChanged();

          return results;
        },

        // 批次刪除
        deleteMany: async (ids: string[]) => {
          await deleteManyItems(ids, config, indexedDB, supabase, sync);

          // 樂觀更新 UI
          set((state) => ({
            items: state.items.filter(item => !ids.includes(item.id)),
          }));

          // 通知 NetworkMonitor 資料已變更
          networkMonitor?.markDataChanged();
        },

        // 根據欄位查詢
        findByField: (field: keyof T, value: unknown) => {
          return findByField(get().items, field, value);
        },

        // 自訂過濾
        filter: (predicate: (item: T) => boolean) => {
          return filter(get().items, predicate);
        },

        // 計數
        count: () => {
          return count(get().items);
        },

        // 清空資料
        clear: async () => {
          set({ items: clear<T>(), error: null });
          memoryCache.invalidatePattern(`${tableName}:`);
        },

        // 同步待處理資料到 Supabase（手動觸發）
        syncPending: async () => {
          if (!enableSupabase || typeof window === 'undefined') {
            logger.log(`⏭️ [${tableName}] 跳過同步（Supabase 未啟用或非瀏覽器環境）`);
            return;
          }

          try {
            logger.log(`🔄 [${tableName}] 開始手動同步...`);
            await sync.syncPending();
            await get().fetchAll(); // 同步完成後重新載入
            logger.log(`✅ [${tableName}] 同步完成`);
          } catch (error) {
            logger.error(`❌ [${tableName}] 同步失敗:`, error);
            throw error;
          }
        },

        // 取消進行中的請求
        cancelRequests: () => {
          abortManager.abort();
          set({ loading: false });
          logger.log(`🛑 [${tableName}] 已取消進行中的請求`);
        },
      }));

  // 註冊同步完成監聽器
  if (typeof window !== 'undefined') {
    storeEventBus.onSyncCompleted(tableName, () => {
      logger.log(`📥 [${tableName}] 收到同步完成通知，重新載入資料...`);
      store.getState().fetchAll();
    });

    // ⚠️ Realtime 訂閱已改為「按需訂閱」
    // 不再自動訂閱，需在各頁面使用 useRealtimeFor[Table]() Hook
    // 範例：useRealtimeForTours()
  }

  return store;
}
