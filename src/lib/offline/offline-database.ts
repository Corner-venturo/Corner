/**
 * 🗄️ Venturo v4.0 - IndexedDB 離線資料庫封裝
 *
 * 功能：
 * - 封裝 IndexedDB 操作
 * - 提供 CRUD 介面
 * - 支援批次操作
 * - 自動索引管理
 */

import { generateUUID } from './unified-types';

// ===========================
// 資料庫配置
// ===========================

export const DB_CONFIG = {
  name: 'VenturoOfflineDB',
  version: 1,
  stores: {
    tours: {
      keyPath: 'id',
      indexes: ['code', 'status', 'startDate', 'synced']
    },
    orders: {
      keyPath: 'id',
      indexes: ['orderNumber', 'tourId', 'customerId', 'status', 'synced']
    },
    quotes: {
      keyPath: 'id',
      indexes: ['quoteNumber', 'customerId', 'status', 'synced']
    },
    paymentRequests: {
      keyPath: 'id',
      indexes: ['requestNumber', 'tourId', 'supplierId', 'status', 'synced']
    },
    todos: {
      keyPath: 'id',
      indexes: ['priority', 'completed', 'assigneeId', 'synced']
    },
    suppliers: {
      keyPath: 'id',
      indexes: ['name', 'category', 'status', 'synced']
    },
    customers: {
      keyPath: 'id',
      indexes: ['name', 'phone', 'email', 'synced']
    },
    syncQueue: {
      keyPath: 'id',
      indexes: ['operation', 'tableName', 'createdAt', 'status']
    }
  }
} as const;

export type StoreName = keyof typeof DB_CONFIG.stores;

// ===========================
// IndexedDB 封裝類別
// ===========================

export class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  /**
   * 初始化資料庫
   */
  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        console.error('❌ IndexedDB 初始化失敗:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB 初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 建立所有 Object Stores 和索引
        Object.entries(DB_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: false
            });

            // 建立索引
            config.indexes.forEach(indexName => {
              objectStore.createIndex(indexName, indexName, { unique: false });
            });

            console.log(`✅ 建立 ObjectStore: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * 確保資料庫已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('資料庫未初始化');
    }
    return this.db;
  }

  /**
   * 新增資料
   */
  async add<T extends { id: string }>(storeName: StoreName, data: T): Promise<T> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      // 確保有 ID
      if (!data.id) {
        data.id = generateUUID();
      }

      const request = objectStore.add(data);

      request.onsuccess = () => {
        console.log(`✅ 新增資料到 ${storeName}:`, data.id);
        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ 新增資料失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 更新資料
   */
  async update<T extends { id: string }>(storeName: StoreName, data: T): Promise<T> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put(data);

      request.onsuccess = () => {
        console.log(`✅ 更新資料 ${storeName}:`, data.id);
        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ 更新資料失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 刪除資料
   */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log(`✅ 刪除資料 ${storeName}:`, id);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ 刪除資料失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 取得單筆資料
   */
  async get<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`❌ 讀取資料失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 取得所有資料
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(`❌ 讀取所有資料失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 使用索引查詢
   */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const index = objectStore.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(`❌ 索引查詢失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 批次新增
   */
  async addBatch<T extends { id: string }>(
    storeName: StoreName,
    data: T[]
  ): Promise<T[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const results: T[] = [];

      transaction.oncomplete = () => {
        console.log(`✅ 批次新增 ${data.length} 筆資料到 ${storeName}`);
        resolve(results);
      };

      transaction.onerror = () => {
        console.error(`❌ 批次新增失敗:`, transaction.error);
        reject(transaction.error);
      };

      data.forEach(item => {
        if (!item.id) {
          item.id = generateUUID();
        }
        objectStore.add(item);
        results.push(item);
      });
    });
  }

  /**
   * 清空 Store
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log(`✅ 清空 ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ 清空失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 取得資料數量
   */
  async count(storeName: StoreName): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`❌ 計數失敗:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 查詢未同步的資料
   */
  async getUnsyncedData<T>(storeName: StoreName): Promise<T[]> {
    return this.getByIndex<T>(storeName, 'synced', false);
  }

  /**
   * 標記為已同步
   */
  async markAsSynced(storeName: StoreName, id: string): Promise<void> {
    const data = await this.get<any>(storeName, id);
    if (data) {
      data.synced = true;
      data.lastSyncedAt = new Date().toISOString();
      await this.update(storeName, data);
    }
  }

  /**
   * 關閉資料庫連接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ IndexedDB 連接已關閉');
    }
  }
}

// ===========================
// 單例模式
// ===========================

let dbInstance: OfflineDatabase | null = null;

export function getOfflineDB(): OfflineDatabase {
  if (!dbInstance) {
    dbInstance = new OfflineDatabase();
  }
  return dbInstance;
}
