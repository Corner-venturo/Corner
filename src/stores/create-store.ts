/**
 * Zustand Store 工廠函數
 * 自動生成完整的 CRUD 操作 Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { BaseEntity } from '@/types';

import { memoryCache } from '@/lib/cache/memory-cache';
import { localDB } from '@/lib/db';
import { TableName } from '@/lib/db/schemas';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * Store 狀態介面
 */
interface StoreState<T extends BaseEntity> {
  // 資料狀態
  items: T[];
  loading: boolean;
  error: string | null;

  // CRUD 操作
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;

  // 批次操作
  createMany: (dataArray: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<T[]>;
  deleteMany: (ids: string[]) => Promise<void>;

  // 查詢操作
  findByField: (field: keyof T, value: unknown) => T[];
  filter: (predicate: (item: T) => boolean) => T[];
  count: () => number;

  // 工具方法
  clear: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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
 * Phase 1.0: 使用 IndexedDB 本地儲存
 *
 * @param tableName - 資料表名稱
 * @param codePrefix - 編號前綴（可選，如 'T', 'O', 'C'）
 * @returns Zustand Store Hook
 */
export function createStore<T extends BaseEntity>(
  tableName: TableName,
  codePrefix?: string
) {
  return create<StoreState<T>>()(
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

        // 取得所有資料
        fetchAll: async () => {
          try {
            set({ loading: true, error: null });

            // 嘗試從快取讀取
            const cacheKey = `${tableName}:list:all`;
            const cached = memoryCache.get<T[]>(cacheKey);

            if (cached) {
              set({ items: cached, loading: false });
              return;
            }

            // 快取未命中，從 IndexedDB 讀取
            const items = await localDB.getAll<T>(tableName);

            // 更新快取
            memoryCache.set(cacheKey, items);

            set({ items, loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '載入失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 根據 ID 取得單筆
        fetchById: async (id: string) => {
          try {
            set({ loading: true, error: null });

            // 嘗試從快取讀取
            const cacheKey = `${tableName}:${id}`;
            const cached = memoryCache.get<T>(cacheKey);

            if (cached) {
              set({ loading: false });
              return cached;
            }

            // 快取未命中，從 IndexedDB 讀取
            const item = await localDB.getById<T>(tableName, id);

            // 更新快取
            if (item) {
              memoryCache.set(cacheKey, item);
            }

            set({ loading: false });
            return item;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '讀取失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 建立資料
        create: async (data) => {
          try {
            set({ loading: true, error: null });

            // 生成 ID
            const id = generateUUID();

            // 如果有 codePrefix，自動生成編號（但不覆蓋已存在的 code）
            let recordData = { ...data, id } as T;
            if (codePrefix && 'code' in data) {
              const existingCode = (data as any).code;
              if (!existingCode) {
                const code = generateCode({ prefix: codePrefix }, get().items);
                recordData = { ...recordData, code } as T;
              }
            }

            // 建立記錄到 IndexedDB
            await localDB.create(tableName, recordData);

            // 清除列表快取（因為新增了資料）
            memoryCache.invalidatePattern(`${tableName}:list`);

            // 更新 Store
            set((state) => ({
              items: [...state.items, recordData],
              loading: false,
            }));

            return recordData;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '建立失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 更新資料
        update: async (id: string, data: Partial<T>) => {
          try {
            set({ loading: true, error: null });

            // 更新到 IndexedDB
            await localDB.update(tableName, id, data);

            // 清除相關快取
            memoryCache.invalidate(`${tableName}:${id}`);
            memoryCache.invalidatePattern(`${tableName}:list`);

            // 更新 Store 並取得更新後的項目
            let updatedItem: T | undefined;
            set((state) => {
              const newItems = (state.items || []).map(item => {
                if (item.id === id) {
                  updatedItem = { ...item, ...data, updated_at: new Date().toISOString() };
                  return updatedItem;
                }
                return item;
              });
              return { items: newItems, loading: false };
            });

            // 返回更新後的資料
            if (!updatedItem) {
              throw new Error('找不到要更新的項目');
            }
            return updatedItem;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新失敗';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // 刪除資料
        delete: async (id: string) => {
          console.log('[Store] delete method called, id:', id);
          console.log('[Store] tableName:', tableName);
          try {
            console.log('[Store] Setting loading state');
            set({ loading: true, error: null });

            console.log('[Store] Calling localDB.delete');
            // 從 IndexedDB 刪除
            await localDB.delete(tableName, id);
            console.log('[Store] localDB.delete completed');

            // 清除相關快取
            console.log('[Store] Invalidating cache');
            memoryCache.invalidate(`${tableName}:${id}`);
            memoryCache.invalidatePattern(`${tableName}:list`);

            // 更新 Store
            console.log('[Store] Updating store state');
            set((state) => ({
              items: (state.items || []).filter(item => item.id !== id),
              loading: false,
            }));
            console.log('[Store] Delete completed successfully');
          } catch (error) {
            console.error('[Store] Delete failed:', error);
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
      }),
      {
        name: `${tableName}-storage`,
        // 只持久化 items，不持久化 loading 和 error
        partialize: (state) => ({ items: state.items }),
      }
    )
  );
}
