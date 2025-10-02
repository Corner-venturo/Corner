/**
 * 🔄 Venturo v4.0 - 統一的 Store 持久化工具（重構版）
 *
 * 改用新的離線架構：
 * - 使用 unified-types.ts 統一資料模型
 * - 使用 offline-manager.ts 管理離線資料
 * - 自動處理 Supabase 同步
 */

import { getOfflineManager, StoreName } from '@/lib/offline/offline-manager';
import { generateUUID } from '@/lib/offline/unified-types';

type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
type GetState<T> = () => T;

// 表格名稱映射：Store key → IndexedDB store name
const TABLE_MAP: Record<string, StoreName> = {
  'tours': 'tours',
  'orders': 'orders',
  'quotes': 'quotes',
  'todos': 'todos',
  'suppliers': 'suppliers',
  'customers': 'customers',
  'payments': 'paymentRequests', // 'payments' 對應到 'paymentRequests'
  'paymentRequests': 'paymentRequests',
  'members': 'orders', // members 存在 orders 裡（暫時）
  'tourAddOns': 'tours', // tourAddOns 存在 tours 裡（暫時）
};

// ============= CRUD 方法生成器（使用新架構） =============

/**
 * 建立具有離線同步功能的 CRUD 方法（v4.0 重構版）
 *
 * @param tableName - 表格名稱
 * @param arrayKey - Store 中陣列的 key 名稱（如 'todos', 'tours'）
 * @param set - Zustand set 函數
 * @param get - Zustand get 函數
 * @returns CRUD 方法物件
 */
export const createPersistentCrudMethods = <T extends { id?: string }>(
  tableName: string,
  arrayKey: string,
  set: SetState<any>,
  get: GetState<any>
) => {
  const capitalizedName = arrayKey.charAt(0).toUpperCase() + arrayKey.slice(1, -1);
  const storeName = (TABLE_MAP[tableName] || tableName) as StoreName;
  const offlineManager = getOfflineManager();

  return {
    // ===== 新增 =====
    [`add${capitalizedName}`]: async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // 特殊處理：自動生成編號
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
          (data as any).quoteNumber = `QUOTE-${year}-${newNumber}`;
        }

        // 使用 OfflineManager 建立資料
        const newItem = await offlineManager.create<T>(storeName, data as Partial<T>);

        // 更新 Zustand store
        const state = get();
        set({
          [arrayKey]: [...state[arrayKey], newItem]
        });

        return newItem;
      } catch (error) {
        console.error(`❌ 新增 ${tableName} 失敗:`, error);
        throw new Error(`無法新增${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 更新 =====
    [`update${capitalizedName}`]: async (id: string, data: Partial<T>) => {
      try {
        // 使用 OfflineManager 更新資料
        const updatedItem = await offlineManager.update<T>(storeName, id, data);

        // 更新 Zustand store
        const state = get();
        const updatedArray = state[arrayKey].map((item: T) =>
          item.id === id ? updatedItem : item
        );
        set({ [arrayKey]: updatedArray });

        return updatedItem;
      } catch (error) {
        console.error(`❌ 更新 ${tableName} 失敗:`, error);
        throw new Error(`無法更新${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 刪除 =====
    [`delete${capitalizedName}`]: async (id: string) => {
      try {
        // 使用 OfflineManager 刪除資料
        await offlineManager.delete(storeName, id);

        // 更新 Zustand store
        const state = get();
        set({
          [arrayKey]: state[arrayKey].filter((item: T) => item.id !== id)
        });

        return true;
      } catch (error) {
        console.error(`❌ 刪除 ${tableName} 失敗:`, error);
        throw new Error(`無法刪除${tableName}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    },

    // ===== 載入 =====
    [`load${capitalizedName}s`]: async () => {
      try {
        // 使用 OfflineManager 載入資料
        const data = await offlineManager.getAll<T>(storeName);

        // 更新 Zustand store
        set({ [arrayKey]: data });

        console.log(`✅ 載入 ${tableName}:`, data.length, '筆');
        return data;
      } catch (error) {
        console.error(`⚠️ 載入 ${tableName} 失敗:`, error);
        return null;
      }
    }
  };
};

// ============= 輔助函數 =============

/**
 * 生成唯一 ID（使用 unified-types 的 UUID 生成器）
 */
export const generateId = (): string => {
  return generateUUID();
};

/**
 * 生成時間戳
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 錯誤處理包裝器
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
