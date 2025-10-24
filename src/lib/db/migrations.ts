/**
 * IndexedDB 資料庫升級與遷移邏輯
 */

import { TABLE_SCHEMAS } from './schemas';
import { _isSyncableTable } from './sync-schema-helper';

/**
 * 資料庫升級處理器
 * @param db - IDBDatabase 實例
 * @param oldVersion - 舊版本號
 * @param newVersion - 新版本號
 */
export function handleUpgrade(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number | null
): void {
  console.log(`[DB Migration] 升級資料庫: v${oldVersion} -> v${newVersion}`);

  try {
    // v0 -> v1: 建立所有資料表（包含 regions 和 workspace）
    if (oldVersion === 0) {
      console.log('[DB Migration] 初始化 v1 資料庫（包含所有資料表）');
      createAllTables(db);
    }

    console.log('[DB Migration] 升級完成！');
  } catch (error) {
    console.error('[DB Migration] 升級失敗:', error);
    throw error;
  }
}

/**
 * 建立所有資料表（v1）
 * 包含：tours, orders, workspace 等所有表格
 */
function createAllTables(db: IDBDatabase): void {
  console.log('[DB Migration] 建立所有資料表（v1 完整版）...');

  TABLE_SCHEMAS.forEach((schema) => {
    // 如果資料表已存在，跳過（理論上不應該發生）
    if (db.objectStoreNames.contains(schema.name)) {
      console.warn(`[DB Migration] 資料表 ${schema.name} 已存在，跳過`);
      return;
    }

    // 建立資料表
    const objectStore = db.createObjectStore(schema.name, {
      keyPath: schema.keyPath,
      autoIncrement: schema.autoIncrement,
    });

    // 建立索引
    schema.indexes.forEach((index) => {
      objectStore.createIndex(index.name, index.keyPath, {
        unique: index.unique,
      });
    });

    console.log(`[DB Migration] ✓ 建立資料表: ${schema.name} (${schema.indexes.length} 個索引)`);
  });

  console.log(`[DB Migration] ✓ 完成！共建立 ${TABLE_SCHEMAS.length} 個資料表`);
}

/**
 * 清除所有資料表（危險操作，僅供開發測試）
 */
export function clearAllTables(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      Array.from(db.objectStoreNames),
      'readwrite'
    );

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      console.log('[DB Migration] 所有資料表已清空');
      resolve();
    };

    Array.from(db.objectStoreNames).forEach((tableName) => {
      const objectStore = transaction.objectStore(tableName);
      objectStore.clear();
    });
  });
}

/**
 * 匯出資料（備份用）
 */
export async function exportData(db: IDBDatabase): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};

  for (const tableName of Array.from(db.objectStoreNames)) {
    const transaction = db.transaction(tableName, 'readonly');
    const objectStore = transaction.objectStore(tableName);
    const request = objectStore.getAll();

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        data[tableName] = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  return data;
}

/**
 * 匯入資料（還原用）
 */
export async function importData(
  db: IDBDatabase,
  data: Record<string, unknown[]>
): Promise<void> {
  for (const [tableName, records] of Object.entries(data)) {
    if (!db.objectStoreNames.contains(tableName)) {
      console.warn(`[DB Migration] 資料表 ${tableName} 不存在，跳過匯入`);
      continue;
    }

    const transaction = db.transaction(tableName, 'readwrite');
    const objectStore = transaction.objectStore(tableName);

    for (const record of records) {
      objectStore.put(record);
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    console.log(`[DB Migration] 匯入 ${records.length} 筆資料到 ${tableName}`);
  }
}
