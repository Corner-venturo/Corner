/**
 * Zustand Store 工廠函數
 * 支援 Supabase 雲端同步 + IndexedDB 本地快取
 *
 * 架構：
 * - Supabase: 雲端資料庫（Single Source of Truth）
 * - IndexedDB: 本地快取（離線支援）
 * - Zustand: UI 狀態管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { BaseEntity } from '@/types';

import { memoryCache } from '@/lib/cache/memory-cache';
import { localDB } from '@/lib/db';
import { TableName } from '@/lib/db/schemas';
import { isSyncableTable } from '@/lib/db/sync-schema-helper';
import { withSyncFields, markAsSynced } from '@/lib/db/sync-utils';
import { generateUUID } from '@/lib/utils/uuid';
import { logger } from '@/lib/utils/logger';
import { backgroundSyncService } from '@/lib/sync/background-sync-service';

/**
 * Store 狀態介面
 */
interface StoreState<T extends BaseEntity> {
  // 資料狀態
  items: T[];
  loading: boolean;
  error: string | null;

  // 🔧 新增：請求取消控制器
  _abortController?: AbortController;

  // CRUD 操作
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;

  // 批次操作
  createMany: (dataArray: Omit<T, 'id' | 'created_at' | 'updated_at'>[]) => Promise<T[]>;
  deleteMany: (ids: string[]) => Promise<void>;

  // 查詢操作
  findByField: (field: keyof T, value: unknown) => T[];
  filter: (predicate: (item: T) => boolean) => T[];
  count: () => number;

  // 工具方法
  clear: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  cancelRequests: () => void; // 🔧 新增：取消進行中的請求
}

/**
 * 編號生成配置
 */
interface CodeConfig {
  prefix: string; // 前綴（如 'T', 'O', 'C'）
  year?: number;  // 年份（預設當前年份）
}

/**
 * 生成編號
 */
function generateCode(config: CodeConfig, existingItems: BaseEntity[]): string {
  const year = config.year || new Date().getFullYear();
  const yearStr = year.toString();

  // 找出當年度最大的流水號
  const prefix = `${config.prefix}${yearStr}`;
  const maxNumber = existingItems
    .map((item) => {
      if ('code' in item) {
        const code = (item as { code?: string }).code;
        if (code?.startsWith(prefix)) {
          const numPart = code.substring(prefix.length);
          return parseInt(numPart, 10) || 0;
        }
      }
      return 0;
    })
    .reduce((max, num) => Math.max(max, num), 0);

  // 生成新編號
  const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
}

/**
 * 建立 Store 工廠函數
 *
 * @param tableName - 資料表名稱
 * @param codePrefix - 編號前綴（可選，如 'T', 'O', 'C'）
 * @param enableSupabase - 是否啟用 Supabase 同步（預設讀取 NEXT_PUBLIC_ENABLE_SUPABASE 環境變數）
 * @returns Zustand Store Hook
 */
export function createStore<T extends BaseEntity>(
  tableName: TableName,
  codePrefix?: string,
  enableSupabase: boolean = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'
) {
  const store = create<StoreState<T>>()(
    persist(
      (set, get) => ({
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
            // 🔧 取消前一個請求
            const state = get();
            if (state._abortController) {
              state._abortController.abort();
            }

            // 建立新的 AbortController
            const controller = new AbortController();
            set({ loading: true, error: null, _abortController: controller });

            if (enableSupabase && typeof window !== 'undefined') {
              // 1. 先從 IndexedDB 讀取
              let cachedItems = await localDB.getAll(tableName) as T[];
              // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
              // cachedItems = cachedItems.filter((item: any) => !item._deleted);

              // 2. 檢查是否需要首次初始化下載
              const initFlag = `${tableName}_initialized`;
              const isInitialized = localStorage.getItem(initFlag);

              if (!isInitialized && cachedItems.length === 0) {
                // 🔄 首次載入 + 本地為空 → 前景完整下載
                logger.log(`🔄 [${tableName}] 首次初始化，從 Supabase 下載資料...`);

                try {
                  const { supabase } = await import('@/lib/supabase/client');
                  const { data, error: supabaseError } = await supabase
                    .from(tableName)
                    .select('*')
                    .order('created_at', { ascending: true })
                    .abortSignal(controller.signal);

                  if (!supabaseError && data) {
                    let items = (data || []) as T[];
                    // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
                    // items = items.filter((item: any) => !item._deleted);

                    // 批次存入 IndexedDB
                    for (const item of items) {
                      await localDB.put(tableName, item);
                    }

                    // 更新 UI
                    set({ items, loading: false });

                    // 設置初始化標記
                    localStorage.setItem(initFlag, 'true');

                    logger.log(`✅ [${tableName}] 初始化完成:`, items.length, '筆');
                    return;
                  } else {
                    logger.warn(`⚠️ [${tableName}] Supabase 初始化失敗，繼續使用空資料`);
                  }
                } catch (initError) {
                  logger.warn(`⚠️ [${tableName}] 初始化下載失敗:`, initError);
                }
              }

              // 3. 已初始化或有快取資料 → 使用快取優先策略
              logger.log(`💾 [${tableName}] 從 IndexedDB 快速載入...`);

              // 立即更新 UI（不等 Supabase）
              set({ items: cachedItems, loading: false });
              logger.log(`✅ [${tableName}] IndexedDB 快速載入完成:`, cachedItems.length, '筆');

              // 2. 背景從 Supabase 同步（不阻塞 UI）
              setTimeout(async () => {
                try {
                  // 🔄 Step 1: 先上傳待同步資料
                  if (isSyncableTable(tableName)) {
                    logger.log(`📤 [${tableName}] 上傳待同步資料...`);
                    await backgroundSyncService.syncTable(tableName);
                    logger.log(`✅ [${tableName}] 待同步資料已上傳`);
                  }

                  // 🔄 Step 2: 下載最新資料
                  logger.log(`☁️ [${tableName}] 背景同步 Supabase...`);
                  const { supabase } = await import('@/lib/supabase/client');

                  const { data, error: supabaseError } = await supabase
                    .from(tableName)
                    .select('*')
                    .order('created_at', { ascending: true })
                    .abortSignal(controller.signal);

                  if (supabaseError) {
                    logger.warn(`⚠️ [${tableName}] Supabase 同步失敗，繼續使用快取資料`);
                    return;
                  }

                  let items = (data || []) as T[];
                  // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
                  // items = items.filter((item: any) => !item._deleted);

                  logger.log(`✅ [${tableName}] Supabase 同步成功:`, items.length, '筆');

                  // 🔧 修正：合併本地待上傳資料，不直接覆蓋
                  const currentItems = get().items;

                  // 找出本地有但 Supabase 沒有的資料（待上傳或新增的）
                  const localOnlyItems = currentItems.filter((localItem: any) => {
                    // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
                    // if (localItem._deleted) return false;

                    // 保留有 sync_status: 'pending' 標記的本地資料（新增或修改）
                    if (localItem.sync_status === 'pending') return true;
                    // 保留 Supabase 中不存在的資料
                    return !items.find((serverItem: any) => serverItem.id === localItem.id);
                  });

                  // 合併：Supabase 資料 + 本地專屬資料
                  const mergedItems = [...items, ...localOnlyItems];

                  if (JSON.stringify(mergedItems) !== JSON.stringify(currentItems)) {
                    set({ items: mergedItems });
                    logger.log(`🔄 [${tableName}] UI 已更新 (Supabase: ${items.length} 筆 + 本地: ${localOnlyItems.length} 筆)`);
                  }

                  // 分批更新 IndexedDB 快取
                  const batchSize = 10;
                  const syncBatch = async (startIndex: number) => {
                    if (startIndex >= items.length) {
                      logger.log(`✅ [${tableName}] IndexedDB 快取完成 (共 ${items.length} 筆)`);
                      return;
                    }
                    const batch = items.slice(startIndex, startIndex + batchSize);
                    await Promise.all(batch.map(item => localDB.put(tableName, item)));
                    setTimeout(() => syncBatch(startIndex + batchSize), 10);
                  };
                  syncBatch(0).catch(err => {
                    logger.warn(`⚠️ [${tableName}] IndexedDB 快取失敗:`, err);
                  });
                } catch (syncError) {
                  logger.warn(`⚠️ [${tableName}] 背景同步失敗:`, syncError);
                }
              }, 0);

            } else {
              // 從 IndexedDB 讀取（離線模式或未啟用 Supabase）
              logger.log(`💾 [${tableName}] 從 IndexedDB 載入資料...`);
              let items = await localDB.getAll(tableName) as T[];

              // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
              // items = items.filter((item: any) => !item._deleted);

              set({ items, loading: false });
              logger.log(`✅ [${tableName}] IndexedDB 讀取成功:`, items.length, '筆');
            }

          } catch (error) {
            // 🔧 忽略 AbortError（正常的請求取消）
            if (error && typeof error === 'object' && 'code' in error && (error as any).code === '20') {
              set({ loading: false });
              return;
            }

            // 🔧 忽略 AbortError（DOMException 類型）
            if (error && error instanceof Error && error.name === 'AbortError') {
              set({ loading: false });
              return;
            }

            // 🔧 任何其他錯誤：靜默切換到本地模式
            try {
              let items = await localDB.getAll(tableName) as T[];
              // TODO: 軟刪除機制需要重新設計（目前暫時移除 _deleted 過濾）
              // items = items.filter((item: any) => !item._deleted);
              set({ items, loading: false, error: null });
              logger.log(`💾 [${tableName}] IndexedDB 讀取成功:`, items.length, '筆');
            } catch (localError) {
              // 連 IndexedDB 都失敗，才顯示錯誤
              logger.error(`❌ [${tableName}] 無法載入資料:`, localError);
              set({ error: '無法載入資料', loading: false });
            }
          }
        },

        // 根據 ID 取得單筆
        fetchById: async (id: string) => {
          try {
            set({ loading: true, error: null });

            // 嘗試從 Supabase 讀取
            if (enableSupabase && typeof window !== 'undefined') {
              try {
                const { supabase } = await import('@/lib/supabase/client');
                const { data, error: supabaseError } = await supabase
                  .from(tableName)
                  .select('*')
                  .eq('id', id)
                  .single();

                if (supabaseError) throw supabaseError;

                // Supabase 成功，返回資料
                set({ loading: false });
                return data as T;
              } catch (supabaseError) {
                // Supabase 失敗（找不到資料或連線錯誤），靜默降級到 IndexedDB
                logger.log(`⚠️ [${tableName}] Supabase 查詢失敗，切換到本地模式`, supabaseError);
              }
            }

            // 從 IndexedDB 讀取（無論是 Supabase 關閉或失敗）
            const items = await localDB.getAll(tableName) as T[];
            const item = items.find((i: any) => i.id === id) || null;
            set({ loading: false });
            return item;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '讀取失敗';
            set({ error: errorMessage, loading: false });
            logger.error(`❌ [${tableName}] fetchById 失敗:`, error);
            return null;
          }
        },

        // 建立資料（Supabase → IndexedDB → Store，離線時降級）
        create: async (data) => {
          // 🔧 建立獨立的 AbortController，不與 fetchAll 共用
          const createController = new AbortController();

          try {
            set({ loading: true, error: null });

            // 生成 ID
            const id = generateUUID();

            // 如果有 codePrefix，自動生成編號（但不覆蓋已存在的 code）
            let recordData = { ...data, id } as T;
            if (codePrefix && 'code' in data) {
              const existingCode = (data as any).code;
              if (!existingCode) {
                // 預設使用 TBC 編號（離線模式）
                let code: string = `${codePrefix}TBC`;

                // 🌐 檢查是否能連線 Supabase
                let isOnline = false;
                if (enableSupabase && typeof window !== 'undefined') {
                  try {
                    const { supabase } = await import('@/lib/supabase/client');
                    const { data: dbItems } = await supabase.from(tableName).select('*').limit(1);
                    isOnline = true; // 連線成功

                    // 從 Supabase 查詢所有資料以生成正式編號
                    const { data: allDbItems } = await supabase.from(tableName).select('*');
                    const allItems = (allDbItems || []) as T[];
                    code = generateCode({ prefix: codePrefix }, allItems);
                  } catch {
                    isOnline = false; // 連線失敗
                    // 📴 離線模式：使用 TBC 編號（已在上方初始化）
                    logger.log(`📴 [${tableName}] 離線模式：使用 TBC 編號 ${code}`);
                  }
                }

                recordData = { ...recordData, code } as T;
              }
            }

            // 🔧 檢查是否為可同步表，決定是否加入同步欄位
            const needsSyncFields = isSyncableTable(tableName);

            if (enableSupabase && typeof window !== 'undefined') {
              // 先嘗試存到 Supabase
              try {
                logger.log(`☁️ [${tableName}] 同步到 Supabase...`);
                const { supabase } = await import('@/lib/supabase/client');

                const { data: created, error: supabaseError } = await (supabase as any)
                  .from(tableName)
                  .insert([recordData])
                  .select();

                if (supabaseError) throw supabaseError;

                logger.log(`✅ [${tableName}] Supabase 新增成功`);

                // 🔧 取得第一筆資料（因為 insert 回傳的是陣列）
                const createdRecord = (created && created.length > 0) ? created[0] : recordData;

                // 🔧 標記為已同步
                recordData = needsSyncFields
                  ? markAsSynced(createdRecord) as T
                  : createdRecord as T;

                // 🔧 立即更新 Store（不等 IndexedDB）
                set((state) => ({
                  items: [...state.items, recordData],
                  loading: false,
                }));

                // 同步到 IndexedDB（背景執行）
                localDB.put(tableName, recordData).catch(err => {
                  logger.warn(`⚠️ [${tableName}] IndexedDB 快取失敗:`, err);
                });

                logger.log(`✅ [${tableName}] 新增完成`);
                return recordData;

              } catch (supabaseError) {
                // 🔧 離線降級：Supabase 失敗時靜默使用 IndexedDB，標記為待同步
                logger.warn(`⚠️ [${tableName}] 離線模式：使用 IndexedDB`);

                // 標記為待同步
                recordData = needsSyncFields
                  ? withSyncFields(recordData, false) as T
                  : recordData;

                await localDB.put(tableName, recordData);
                logger.log(`💾 [${tableName}] 已存入 IndexedDB:`, '1 筆（離線模式）');
              }

            } else {
              // 只存到 IndexedDB
              // 🔧 標記為待同步
              recordData = needsSyncFields
                ? withSyncFields(recordData, false) as T
                : recordData;

              await localDB.put(tableName, recordData);
            }

            // 更新 Store
            set((state) => ({
              items: [...state.items, recordData],
              loading: false,
            }));

            logger.log(`✅ [${tableName}] 新增完成`);
            return recordData;

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '建立失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 更新資料（Supabase → Store → IndexedDB，離線時降級）
        update: async (id: string, data: Partial<T>) => {
          try {
            set({ loading: true, error: null });

            // 🔧 檢查是否為可同步表
            const needsSyncFields = isSyncableTable(tableName);
            let syncData = data;

            if (enableSupabase && typeof window !== 'undefined') {
              // 先嘗試更新 Supabase
              try {
                logger.log(`☁️ [${tableName}] 同步到 Supabase...`);
                const { supabase } = await import('@/lib/supabase/client');

                const result: any = await (supabase as any)
                  .from(tableName)
                  .update(data)
                  .eq('id', id);

                const { error: supabaseError } = result;

                if (supabaseError) throw supabaseError;

                logger.log(`✅ [${tableName}] Supabase 更新成功`);

                // 🔧 標記為已同步
                if (needsSyncFields) {
                  syncData = markAsSynced(data) as Partial<T>;
                }

              } catch (supabaseError) {
                // 🔧 離線降級：Supabase 失敗時靜默使用 IndexedDB，標記為待同步
                // 標記為待同步
                if (needsSyncFields) {
                  syncData = {
                    ...data,
                    sync_status: 'pending' as any,
                    synced_at: null as any,
                  };
                }

                await localDB.update(tableName, id, syncData);
                logger.log(`💾 [${tableName}] 已更新 IndexedDB: 1 筆（離線模式）`);
              }

            } else {
              // 更新 IndexedDB
              // 🔧 標記為待同步
              if (needsSyncFields) {
                syncData = {
                  ...data,
                  sync_status: 'pending' as any,
                  synced_at: null as any,
                };
              }

              await localDB.update(tableName, id, syncData);
            }

            // 更新 Store 並取得更新後的項目
            let updatedItem: T | undefined;
            set((state) => {
              const newItems = (state.items || []).map(item => {
                if (item.id === id) {
                  updatedItem = { ...item, ...syncData, updated_at: new Date().toISOString() };
                  return updatedItem;
                }
                return item;
              });
              return { items: newItems, loading: false };
            });

            if (!updatedItem) {
              throw new Error('找不到要更新的項目');
            }

            // 同步到 IndexedDB（背景執行）
            if (enableSupabase) {
              localDB.put(tableName, updatedItem).catch(err => {
                logger.warn(`⚠️ [${tableName}] IndexedDB 快取失敗:`, err);
              });
            }

            logger.log(`✅ [${tableName}] 更新完成`);
            return updatedItem;

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 刪除資料（Supabase → Store → IndexedDB，離線時降級）
        delete: async (id: string) => {
          try {
            set({ loading: true, error: null });

            if (enableSupabase && typeof window !== 'undefined') {
              // 先嘗試從 Supabase 刪除
              try {
                logger.log(`☁️ [${tableName}] 從 Supabase 刪除...`);
                const { supabase } = await import('@/lib/supabase/client');

                const { error: supabaseError } = await supabase
                  .from(tableName)
                  .delete()
                  .eq('id', id);

                if (supabaseError) throw supabaseError;

                logger.log(`✅ [${tableName}] Supabase 刪除成功`);

                // 🔧 立即更新 Store（不等 IndexedDB）
                set((state) => ({
                  items: (state.items || []).filter(item => item.id !== id),
                  loading: false,
                }));

                // 從 IndexedDB 刪除（背景執行）
                localDB.delete(tableName, id).catch(err => {
                  logger.warn(`⚠️ [${tableName}] IndexedDB 清除失敗:`, err);
                });

                logger.log(`✅ [${tableName}] 刪除完成`);
                return;

              } catch (supabaseError) {
                // 🔧 離線降級：靜默標記為已刪除，等待同步
                logger.error(`❌ [${tableName}] Supabase 刪除失敗:`, supabaseError);

                // 取得原始資料
                const items = await localDB.getAll(tableName) as T[];
                const item = items.find((i: any) => i.id === id);

                if (item) {
                  // TODO: 軟刪除機制需要重新設計
                  // 目前暫時直接從 IndexedDB 刪除，並標記為待同步刪除
                  // 未來應該：1. 在 Supabase 加入 deleted_at 欄位 2. 使用 soft delete

                  // 標記為待同步刪除（暫時方案：加入刪除隊列）
                  const deletedItem = {
                    ...item,
                    sync_status: 'pending' as any,
                    synced_at: null as any,
                  } as any;

                  // 加入刪除隊列（使用 syncQueue 表記錄）
                  try {
                    await localDB.put('syncQueue', {
                      id: generateUUID(),
                      table_name: tableName,
                      record_id: id,
                      operation: 'delete',
                      data: deletedItem,
                      created_at: new Date().toISOString(),
                    });
                    logger.log(`💾 [${tableName}] 已加入刪除隊列: 1 筆（離線模式）`);
                  } catch (queueError) {
                    logger.warn(`⚠️ [${tableName}] 無法加入刪除隊列:`, queueError);
                  }

                  // 從 IndexedDB 刪除
                  await localDB.delete(tableName, id);
                }

                // 🔧 立即更新 Store UI（從畫面上移除）
                set((state) => ({
                  items: (state.items || []).filter(item => item.id !== id),
                  loading: false,
                }));

                logger.log(`✅ [${tableName}] 刪除完成（離線模式）`);
                return;
              }

            } else {
              // 從 IndexedDB 刪除
              await localDB.delete(tableName, id);
            }

            // 更新 Store
            set((state) => ({
              items: (state.items || []).filter(item => item.id !== id),
              loading: false,
            }));

            logger.log(`✅ [${tableName}] 刪除完成`);

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '刪除失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 批次建立
        createMany: async (dataArray) => {
          const results: T[] = [];

          for (const data of dataArray) {
            const created = await get().create(data);
            results.push(created);
          }

          return results;
        },

        // 批次刪除
        deleteMany: async (ids: string[]) => {
          for (const id of ids) {
            await get().delete(id);
          }
        },

        // 根據欄位查詢
        findByField: (field: keyof T, value: unknown) => {
          return get().items.filter((item) => item[field] === value);
        },

        // 自訂過濾
        filter: (predicate: (item: T) => boolean) => {
          return get().items.filter(predicate);
        },

        // 計數
        count: () => {
          return get().items.length;
        },

        // 清空資料
        clear: async () => {
          set({ items: [], error: null });
          memoryCache.invalidatePattern(`${tableName}:`);
        },

        // 🔄 同步待處理資料到 Supabase（手動觸發）
        syncPending: async () => {
          if (!enableSupabase || typeof window === 'undefined') {
            logger.log(`⏭️ [${tableName}] 跳過同步（Supabase 未啟用或非瀏覽器環境）`);
            return;
          }

          try {
            logger.log(`🔄 [${tableName}] 開始手動同步...`);

            // 使用背景同步服務
            await backgroundSyncService.syncTable(tableName);

            // 同步完成後重新載入資料
            await get().fetchAll();

            logger.log(`✅ [${tableName}] 同步完成`);
          } catch (error) {
            logger.error(`❌ [${tableName}] 同步失敗:`, error);
            throw error;
          }
        },

        // 🔧 取消進行中的請求
        cancelRequests: () => {
          const state = get();
          if (state._abortController) {
            state._abortController.abort();
            set({ _abortController: undefined, loading: false });
            logger.log(`🛑 [${tableName}] 已取消進行中的請求`);
          }
        },
      }),
      {
        name: `${tableName}-storage`,
        // 只持久化 items，不持久化 loading 和 error
        partialize: (state) => ({ items: state.items }),
      }
    )
  );

  // 監聽網路同步完成事件，自動重新載入資料
  if (typeof window !== 'undefined') {
    const handleSyncCompleted = () => {
      logger.log(`📥 [${tableName}] 收到同步完成通知，重新載入資料...`);
      store.getState().fetchAll();
    };

    window.addEventListener('venturo:sync-completed', handleSyncCompleted);

    // 注意：在實際應用中，應該在適當的時機移除監聽器
    // 但由於 Store 是全域單例，通常不需要清理
  }

  return store;
}
