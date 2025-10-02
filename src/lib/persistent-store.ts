// src/lib/persistent-store.ts
// 統一的 Store 持久化與離線同步工具
// 支援：本地 localStorage + IndexedDB + Supabase 雲端同步

import { v4 as uuidv4 } from 'uuid';

type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
type GetState<T> = () => T;

// ============= 離線同步功能 =============
let offlineStore: any = null;

// 動態導入離線 store（避免循環依賴）
const getOfflineStore = async () => {
  if (typeof window === 'undefined') return null;
  if (!offlineStore) {
    try {
      // 使用動態 import 避免同步載入問題
      const module = await import('@/lib/offline/sync-manager');
      offlineStore = module.useOfflineStore;
    } catch (e) {
      console.warn('離線同步模組載入失敗，將僅使用本地儲存', e);
    }
  }
  return offlineStore;
};

// 加入待同步隊列（不立即同步，等待定期同步）
const addPendingChange = async (operation: {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  localId?: string;
}) => {
  // 📦 暫時停用以修復編譯問題
  console.log('📦 本地模式：跳過同步隊列');
  return;

  if (typeof window === 'undefined') return;

  const OfflineStore = await getOfflineStore();
  if (!OfflineStore) return;

  try {
    const store = OfflineStore.getState();

    // 檢查是否已存在相同的操作（避免重複）
    const existingOp = store.pendingChanges.find((op: any) =>
      op.table === operation.table &&
      (op.data?.id === operation.data?.id || op.localId === operation.localId)
    );

    if (existingOp) {
      console.log(`跳過重複操作: ${operation.table} ${operation.data?.id || operation.localId}`);
      return;
    }

    store.addPendingChange({
      id: uuidv4(),
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      userId: 'current-user' // TODO: 從 auth store 取得
    });
  } catch (error) {
    console.warn('加入同步隊列失敗:', error);
  }
};

// 檢查是否在線
const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// ============= CRUD 方法生成器（支援離線） =============

/**
 * 建立具有離線同步功能的 CRUD 方法
 *
 * @param tableName - Supabase 表格名稱
 * @param arrayKey - Store 中陣列的 key 名稱（如 'todos', 'tours'）
 * @returns CRUD 方法物件
 *
 * @example
 * const todoMethods = createPersistentCrudMethods<Todo>('todos', 'todos');
 * // 會產生: addTodo, updateTodo, deleteTodo, loadTodos
 */
export const createPersistentCrudMethods = <T extends { id?: string }>(
  tableName: string,
  arrayKey: string,
  set: SetState<any>,
  get: GetState<any>
) => {
  const capitalizedName = arrayKey.charAt(0).toUpperCase() + arrayKey.slice(1, -1);

  return {
    // ===== 新增 =====
    [`add${capitalizedName}`]: async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const id = uuidv4();
        const now = new Date().toISOString();

        let newItem = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now
        } as T;

        // 自動生成編號（如果是 quotes 表格且沒有 quoteNumber）
        if (tableName === 'quotes' && !(data as any).quoteNumber) {
          const year = new Date().getFullYear();
          const state = get();
          const existingQuotes = state[arrayKey] || [];
          const lastNumber = existingQuotes
            .map((q: any) => q.quoteNumber)
            .filter((num: string) => num?.startsWith(`QUOTE-${year}`))
            .map((num: string) => parseInt(num.split('-')[2] || '0'))
            .sort((a: number, b: number) => b - a)[0] || 0;

          const newNumber = (lastNumber + 1).toString().padStart(4, '0');
          (newItem as any).quoteNumber = `QUOTE-${year}-${newNumber}`;
        }

        // 1. 立即更新本地 store
        const state = get();
        set({
          [arrayKey]: [...state[arrayKey], newItem]
        });

        // 2. 存到 IndexedDB
        const { getSyncManager } = await import('@/lib/offline/sync-manager');
        const syncManager = getSyncManager();
        const localDb = syncManager.getLocalDb();
        if (localDb) {
          await localDb.put(tableName, newItem);
        }

        // 3. 立即同步到 Supabase（如果在線）
        // ⚠️ 暫時停用 Supabase 同步 - 等網站穩定後再啟用
        /*
        if (isOnline()) {
          try {
            const { VenturoAPI } = await import('@/lib/supabase/api');
            await VenturoAPI.create(tableName, newItem);
            console.log(`✅ 成功同步新增 ${tableName}:`, id);
          } catch (syncError) {
            console.error(`❌ 同步新增失敗 ${tableName}:`, syncError);
            // 同步失敗時加入隊列
            addPendingChange({
              type: 'CREATE',
              table: tableName,
              data: newItem,
              localId: id
            });
          }
        }
        */
        console.log(`📦 本地模式：新增 ${tableName}:`, id);

        return newItem;
      } catch (error) {
        console.error(`❌ 新增 ${tableName} 失敗:`, error);
        throw new Error(`無法新增${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 更新 =====
    [`update${capitalizedName}`]: async (id: string, data: Partial<T>) => {
      try {
        const now = new Date().toISOString();
        const updateData = { ...data, updatedAt: now };

        // 1. 立即更新本地 store
        const state = get();
        const updatedArray = state[arrayKey].map((item: T) =>
          item.id === id ? { ...item, ...updateData } : item
        );

        set({ [arrayKey]: updatedArray });

        const updatedItem = updatedArray.find((item: T) => item.id === id);

        // 2. 存到 IndexedDB
        if (updatedItem) {
          const { getSyncManager } = await import('@/lib/offline/sync-manager');
          const syncManager = getSyncManager();
          const localDb = syncManager.getLocalDb();
          if (localDb) {
            await localDb.put(tableName, updatedItem);
          }
        }

        // 3. 立即同步到 Supabase（如果在線）
        // ⚠️ 暫時停用 Supabase 同步 - 等網站穩定後再啟用
        /*
        if (isOnline()) {
          try {
            const { VenturoAPI } = await import('@/lib/supabase/api');
            await VenturoAPI.update(tableName, id, updateData);
            console.log(`✅ 成功同步更新 ${tableName}:`, id);
          } catch (syncError) {
            console.error(`❌ 同步更新失敗 ${tableName}:`, syncError);
            // 同步失敗時加入隊列
            addPendingChange({
              type: 'UPDATE',
              table: tableName,
              data: { id, ...updateData }
            });
          }
        }
        */
        console.log(`📦 本地模式：更新 ${tableName}:`, id);

        return updatedItem;
      } catch (error) {
        console.error(`❌ 更新 ${tableName} 失敗:`, error);
        throw new Error(`無法更新${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 刪除 =====
    [`delete${capitalizedName}`]: async (id: string) => {
      try {
        // 1. 立即更新本地 store
        const state = get();
        set({
          [arrayKey]: state[arrayKey].filter((item: T) => item.id !== id)
        });

        // 2. 從 IndexedDB 刪除
        const { getSyncManager } = await import('@/lib/offline/sync-manager');
        const syncManager = getSyncManager();
        const localDb = syncManager.getLocalDb();
        if (localDb) {
          await localDb.delete(tableName, id);
        }

        // 3. 立即同步到 Supabase（如果在線）
        // ⚠️ 暫時停用 Supabase 同步 - 等網站穩定後再啟用
        /*
        if (isOnline()) {
          try {
            const { VenturoAPI } = await import('@/lib/supabase/api');
            await VenturoAPI.delete(tableName, id);
            console.log(`✅ 成功同步刪除 ${tableName}:`, id);
          } catch (syncError) {
            console.error(`❌ 同步刪除失敗 ${tableName}:`, syncError);
            // 同步失敗時加入隊列
            addPendingChange({
              type: 'DELETE',
              table: tableName,
              data: { id }
            });
          }
        }
        */
        console.log(`📦 本地模式：刪除 ${tableName}:`, id);

        return true;
      } catch (error) {
        console.error(`❌ 刪除 ${tableName} 失敗:`, error);
        throw new Error(`無法刪除${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 載入（合併本地和雲端資料） =====
    [`load${capitalizedName}s`]: async () => {
      try {
        const { getSyncManager } = await import('@/lib/offline/sync-manager');
        const syncManager = getSyncManager();
        const localDb = syncManager.getLocalDb();

        // 1. 先從 IndexedDB 載入本地資料
        let localData: T[] = [];
        if (localDb) {
          const allLocalData = await localDb.getAll(tableName);
          localData = (allLocalData || []).filter((item: any) => !item.deleted);
        }

        // 2. 如果在線，從 Supabase 載入雲端資料
        // ⚠️ 暫時停用 Supabase 同步 - 等網站穩定後再啟用
        /*
        if (isOnline()) {
          try {
            const { VenturoAPI } = await import('@/lib/supabase/api');
            const remoteData = await VenturoAPI.read<T>(tableName);

            if (remoteData) {
              // 合併本地和雲端資料（使用 Map 去重，優先使用雲端資料）
              const mergedMap = new Map<string, T>();

              // 先加入本地資料
              localData.forEach(item => {
                if (item.id) mergedMap.set(item.id, item);
              });

              // 雲端資料覆蓋本地（雲端為準）
              remoteData.forEach(item => {
                if (item.id) mergedMap.set(item.id, item);
              });

              const mergedData = Array.from(mergedMap.values());

              // 更新 Store
              set({ [arrayKey]: mergedData });

              // 更新 IndexedDB（保持本地和雲端一致）
              if (localDb) {
                for (const item of mergedData) {
                  await localDb.put(tableName, { ...item, sync_status: 'synced' });
                }
              }

              console.log(`✅ 合併載入 ${tableName}: 本地 ${localData.length} 筆 + 雲端 ${remoteData.length} 筆 = ${mergedData.length} 筆`);
              return mergedData;
            }
          } catch (error) {
            console.warn(`⚠️ 從雲端載入 ${tableName} 失敗，使用本地資料:`, error);
            // 如果雲端載入失敗，使用本地資料
            set({ [arrayKey]: localData });
            return localData;
          }
        } else {
          // 離線時只使用本地資料
          set({ [arrayKey]: localData });
          console.log(`📦 離線模式，從本地載入 ${tableName}:`, localData.length, '筆');
          return localData;
        }
        */

        // 本地模式：只使用 IndexedDB 資料
        set({ [arrayKey]: localData });
        console.log(`📦 本地模式：載入 ${tableName}:`, localData.length, '筆');
        return localData;
      } catch (error) {
        console.error(`⚠️ 載入 ${tableName} 失敗:`, error);
        return null;
      }
    }
  };
};

// ============= 輔助函數 =============

/**
 * 生成唯一 ID
 * 使用 UUID v4 確保全域唯一性
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * 生成時間戳
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 錯誤處理包裝器
 * 統一處理所有 store 操作的錯誤
 */
export const withErrorHandling = <T>(
  operation: () => T,
  errorMessage: string
): T => {
  try {
    return operation();
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error);
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};
