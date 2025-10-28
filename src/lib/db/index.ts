/**
 * IndexedDB 本地資料庫管理器（型別安全版本）
 * 提供完整的 CRUD 操作和查詢功能
 */

import { handleUpgrade, clearAllTables, exportData, importData } from './migrations';
import { DB_NAME, DB_VERSION, TableName } from './schemas';
import { checkAndHandleVersion } from './version-manager';

// Re-export TableName for external use
export type { TableName };

/**
 * 帶時間戳的記錄型別
 */
interface WithTimestamps {
  created_at?: string;
  updated_at?: string;
}

/**
 * 型別守衛：檢查值是否可比較（數字或字串）
 */
function isComparable(value: unknown): value is number | string {
  return typeof value === 'number' || typeof value === 'string';
}

/**
 * 型別安全的比較函數
 */
function compareValues(
  a: unknown,
  b: unknown,
  operator: 'gt' | 'gte' | 'lt' | 'lte'
): boolean {
  // 如果兩個值都可比較，進行比較
  if (isComparable(a) && isComparable(b)) {
    switch (operator) {
      case 'gt':
        return a > b;
      case 'gte':
        return a >= b;
      case 'lt':
        return a < b;
      case 'lte':
        return a <= b;
    }
  }
  // 不可比較的值回傳 false
  return false;
}

/**
 * 查詢選項
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: 'asc' | 'desc';
}

/**
 * 過濾條件
 */
export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: unknown;
}

/**
 * LocalDatabase 類別
 * 管理所有 IndexedDB 操作
 */
export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Put 資料（更新或新增）
   * 如果 ID 存在則更新，不存在則新增
   */
  async put<T extends { id: string }>(
    tableName: TableName,
    data: T
  ): Promise<T> {
    try {
      const db = await this.ensureInit();

      // 檢查 tableName 是否有效
      if (!db.objectStoreNames.contains(tableName)) {
        throw new Error(`資料表不存在: ${tableName}`);
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(tableName, 'readwrite');
        const objectStore = transaction.objectStore(tableName);

        // 加入時間戳
        const now = new Date().toISOString();
        const dataWithTimestamps = data as T & WithTimestamps;
        const recordWithTimestamp = {
          ...data,
          created_at: dataWithTimestamps.created_at || now,
          updated_at: now,
        } as T;

        const request = objectStore.put(recordWithTimestamp);

        request.onsuccess = () => {
          resolve(recordWithTimestamp);
        };

        request.onerror = () => {
          const error = new Error(
            `Put 資料失敗 (${tableName}): ${request.error?.message}`
          );
          console.error('[LocalDB]', error);
          reject(error);
        };
      });
    } catch (error) {
      console.error('[LocalDB] put 方法錯誤:', error);
      throw error;
    }
  }

  /**
   * 初始化資料庫
   */
  async init(): Promise<IDBDatabase> {
    // 🔒 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      const error = new Error('IndexedDB 不可用（非瀏覽器環境）');
      console.warn('[LocalDB]', error.message);
      throw error;
    }

    // 如果已經初始化，直接返回
    if (this.db) {
      return this.db;
    }

    // 如果正在初始化，等待完成
    if (this.initPromise) {
      return this.initPromise;
    }

    // ✨ 檢查版本並處理升級（如有需要）
    try {
      await checkAndHandleVersion();
    } catch (error) {
      console.error('[LocalDB] 版本檢查失敗:', error);
      // 不阻擋初始化，繼續執行
    }

    // 開始初始化
    this.initPromise = new Promise((resolve, reject) => {
      // 🔥 關鍵修正：延遲執行確保環境就緒
      setTimeout(() => {
        try {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          const error = new Error(
            `無法開啟資料庫: ${request.error?.message || '未知錯誤'}`
          );
          console.error('[LocalDB] request.onerror 觸發:', error, event);
          this.initPromise = null; // 清除失敗的 Promise
          reject(error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const oldVersion = event.oldVersion;
          const newVersion = event.newVersion;

          try {
            handleUpgrade(db, oldVersion, newVersion);
          } catch (error) {
            console.error('[LocalDB] 升級失敗:', error);
            this.initPromise = null; // 清除失敗的 Promise
            // 注意: 在 onupgradeneeded 中 reject 可能無效
            // 因為還會觸發 onsuccess 或 onerror
            throw error;
          }
        };

        request.onblocked = (event) => {
          console.warn('資料庫被其他連線阻擋', event);
        };

        } catch (error) {
          console.error('[LocalDB] Promise 內部錯誤:', error);
          this.initPromise = null;
          reject(error);
        }
      }, 100); // 延遲 100ms 確保環境就緒
    });

    return this.initPromise;
  }

  /**
   * 確保資料庫已初始化
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }

    if (!this.db) {
      throw new Error('資料庫初始化失敗');
    }

    return this.db;
  }

  // ============================================
  // 基本 CRUD 操作
  // ============================================

  /**
   * 建立單筆資料
   */
  async create<T extends { id: string }>(
    tableName: TableName,
    data: T
  ): Promise<T> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite');
      const objectStore = transaction.objectStore(tableName);

      // 加入時間戳
      const now = new Date().toISOString();
      const dataWithTimestamps = data as T & WithTimestamps;
      const recordWithTimestamp = {
        ...data,
        created_at: dataWithTimestamps.created_at || now,
        updated_at: now,
      } as T;

      const request = objectStore.add(recordWithTimestamp);

      request.onsuccess = () => {
        resolve(recordWithTimestamp);
      };

      request.onerror = () => {
        const error = new Error(
          `新增資料失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  /**
   * 讀取單筆資料
   */
  async read<T>(tableName: TableName, id: string): Promise<T | null> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readonly');
      const objectStore = transaction.objectStore(tableName);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        const error = new Error(
          `讀取資料失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  /**
   * 更新單筆資料
   */
  async update<T extends { id: string }>(
    tableName: TableName,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const db = await this.ensureInit();

    return new Promise(async (resolve, reject) => {
      // 先讀取現有資料
      const existing = await this.read<T>(tableName, id);
      if (!existing) {
        reject(new Error(`資料不存在 (${tableName}): ${id}`));
        return;
      }

      const transaction = db.transaction(tableName, 'readwrite');
      const objectStore = transaction.objectStore(tableName);

      // 合併資料並更新時間戳
      const updated = {
        ...existing,
        ...data,
        id, // 確保 ID 不被覆蓋
        updated_at: new Date().toISOString(),
      };

      const request = objectStore.put(updated);

      request.onsuccess = () => {
        resolve(updated);
      };

      request.onerror = () => {
        const error = new Error(
          `更新資料失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }


  /**
   * 刪除單筆資料
   */
  async delete(tableName: TableName, id: string): Promise<void> {
    try {
      const db = await this.ensureInit();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(tableName, 'readwrite');
        const objectStore = transaction.objectStore(tableName);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          const error = new Error(
            `刪除資料失敗 (${tableName}): ${request.error?.message}`
          );
          console.error('[LocalDB]', error);
          reject(error);
        };

        transaction.onerror = () => {
          console.error('transaction 錯誤:', transaction.error);
        };
      });
    } catch (error) {
      console.error('delete 方法異常:', error);
      throw error;
    }
  }

  // ============================================
  // 批次操作
  // ============================================

  /**
   * 批次建立資料
   */
  async createMany<T extends { id: string }>(
    tableName: TableName,
    dataArray: T[]
  ): Promise<T[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite');
      const objectStore = transaction.objectStore(tableName);
      const now = new Date().toISOString();
      const results: T[] = [];

      transaction.oncomplete = () => {
        resolve(results);
      };

      transaction.onerror = () => {
        const error = new Error(
          `批次新增失敗 (${tableName}): ${transaction.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };

      dataArray.forEach((data) => {
        const dataWithTimestamps = data as T & WithTimestamps;
        const recordWithTimestamp = {
          ...data,
          created_at: dataWithTimestamps.created_at || now,
          updated_at: now,
        } as T;
        objectStore.add(recordWithTimestamp);
        results.push(recordWithTimestamp);
      });
    });
  }

  /**
   * 批次更新資料
   */
  async updateMany<T extends { id: string }>(
    tableName: TableName,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<T[]> {
    const results: T[] = [];

    for (const { id, data } of updates) {
      const updated = await this.update<T>(tableName, id, data);
      results.push(updated);
    }

    return results;
  }

  /**
   * 批次刪除資料
   */
  async deleteMany(tableName: TableName, ids: string[]): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite');
      const objectStore = transaction.objectStore(tableName);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(
          `批次刪除失敗 (${tableName}): ${transaction.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };

      ids.forEach((id) => {
        objectStore.delete(id);
      });
    });
  }

  // ============================================
  // 查詢功能
  // ============================================

  /**
   * 取得所有資料
   */
  async getAll<T>(
    tableName: TableName,
    options?: QueryOptions
  ): Promise<T[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      // 檢查資料表是否存在
      if (!db.objectStoreNames.contains(tableName)) {
        reject(new Error(`資料表不存在: ${tableName}`));
        return;
      }

      const transaction = db.transaction(tableName, 'readonly');
      const objectStore = transaction.objectStore(tableName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // 排序
        if (options?.orderBy) {
          results.sort((a, b) => {
            const aVal = a[options.orderBy!];
            const bVal = b[options.orderBy!];
            const order = options.direction === 'desc' ? -1 : 1;
            return aVal > bVal ? order : aVal < bVal ? -order : 0;
          });
        }

        // 分頁
        if (options?.offset !== undefined || options?.limit !== undefined) {
          const offset = options.offset || 0;
          const limit = options.limit || results.length;
          results = results.slice(offset, offset + limit);
        }

        resolve(results);
      };

      request.onerror = () => {
        const error = new Error(
          `查詢失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  /**
   * 根據索引查詢
   */
  async findByIndex<T>(
    tableName: TableName,
    indexName: string,
    value: unknown
  ): Promise<T[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readonly');
      const objectStore = transaction.objectStore(tableName);
      const index = objectStore.index(indexName);
      const request = index.getAll(value as IDBValidKey);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        const error = new Error(
          `索引查詢失敗 (${tableName}.${indexName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  /**
   * 過濾查詢
   */
  async filter<T>(
    tableName: TableName,
    conditions: FilterCondition[]
  ): Promise<T[]> {
    const allRecords = await this.getAll<T>(tableName);

    return allRecords.filter((record) => {
      return conditions.every((condition) => {
        const fieldValue = (record as Record<string, unknown>)[condition.field];

        switch (condition.operator) {
          case 'eq':
            return fieldValue === condition.value;
          case 'ne':
            return fieldValue !== condition.value;
          case 'gt':
            return compareValues(fieldValue, condition.value, 'gt');
          case 'gte':
            return compareValues(fieldValue, condition.value, 'gte');
          case 'lt':
            return compareValues(fieldValue, condition.value, 'lt');
          case 'lte':
            return compareValues(fieldValue, condition.value, 'lte');
          case 'contains':
            return String(fieldValue)
              .toLowerCase()
              .includes(String(condition.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  /**
   * 計算資料筆數
   */
  async count(tableName: TableName): Promise<number> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readonly');
      const objectStore = transaction.objectStore(tableName);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        const error = new Error(
          `計數失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  /**
   * 檢查資料是否存在
   */
  async exists(tableName: TableName, id: string): Promise<boolean> {
    const result = await this.read(tableName, id);
    return result !== null;
  }

  /**
   * 清空資料表
   */
  async clear(tableName: TableName): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite');
      const objectStore = transaction.objectStore(tableName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        const error = new Error(
          `清空失敗 (${tableName}): ${request.error?.message}`
        );
        console.error('[LocalDB]', error);
        reject(error);
      };
    });
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清空所有資料表
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureInit();
    await clearAllTables(db);
  }

  /**
   * 匯出資料
   */
  async export(): Promise<Record<string, unknown[]>> {
    const db = await this.ensureInit();
    return exportData(db);
  }

  /**
   * 匯入資料
   */
  async import(data: Record<string, unknown[]>): Promise<void> {
    const db = await this.ensureInit();
    await importData(db, data);
  }

  /**
   * 關閉資料庫連線
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * 重置資料庫實例（強制清除所有狀態）
   */
  reset(): void {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    this.initPromise = null;
  }
}

// 匯出單例實例和類別
export const localDB = new LocalDatabase();
