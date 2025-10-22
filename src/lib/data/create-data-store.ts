/**
 * 🏗️ Venturo v5.0 - Store 生成工具
 *
 * 功能：
 * - 自動生成標準 CRUD 方法
 * - 統一使用 UnifiedDataService
 * - 簡化 Store 開發
 */

import { dataService, TableName } from './unified-data-service';

type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
type GetState<T> = () => T;

/**
 * 建立標準的資料 Store 方法
 *
 * @example
 * const store = create(
 *   (set, get) => ({
 *     tours: [],
 *     ...createDataStoreMethods<Tour>('TOURS', 'tours', set, get)
 *   })
 * )
 */
export function createDataStoreMethods<T extends { id: string }>(
  tableName: TableName,
  stateKey: string,
  set: SetState<any>,
  get: GetState<any>
) {
  const capitalizedName = stateKey.charAt(0).toUpperCase() + stateKey.slice(1, -1);

  return {
    // 載入資料
    [`load${capitalizedName}s`]: async () => {
      try {
        if (typeof window === 'undefined') {
          console.log('⚠️ SSR 環境，跳過載入');
          return [];
        }

        const items = await dataService.getAll<T>(tableName);
        set({ [stateKey]: items });
        console.log(`✅ 載入 ${tableName}:`, items.length, '筆');
        return items;
      } catch (error) {
        console.error(`❌ 載入 ${tableName} 失敗:`, error);
        return [];
      }
    },

    // 新增資料
    [`add${capitalizedName}`]: async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const newItem = await dataService.create<T>(tableName, data);
        const state = get();
        set({ [stateKey]: [...state[stateKey], newItem] });
        console.log(`✅ 新增 ${tableName}:`, newItem.id);
        return newItem;
      } catch (error) {
        console.error(`❌ 新增 ${tableName} 失敗:`, error);
        throw error;
      }
    },

    // 更新資料
    [`update${capitalizedName}`]: async (id: string, updates: Partial<T>) => {
      try {
        const updated = await dataService.update<T>(tableName, id, updates);
        const state = get();
        set({
          [stateKey]: state[stateKey].map((item: T) =>
            item.id === id ? updated : item
          )
        });
        console.log(`✅ 更新 ${tableName}:`, id);
        return updated;
      } catch (error) {
        console.error(`❌ 更新 ${tableName} 失敗:`, error);
        throw error;
      }
    },

    // 刪除資料
    [`delete${capitalizedName}`]: async (id: string) => {
      try {
        await dataService.delete(tableName, id);
        const state = get();
        set({
          [stateKey]: state[stateKey].filter((item: T) => item.id !== id)
        });
        console.log(`✅ 刪除 ${tableName}:`, id);
        return true;
      } catch (error) {
        console.error(`❌ 刪除 ${tableName} 失敗:`, error);
        throw error;
      }
    },
  };
}

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * 生成時間戳
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};
