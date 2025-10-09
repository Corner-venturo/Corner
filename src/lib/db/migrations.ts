/**
 * IndexedDB 資料庫升級與遷移邏輯
 */

import { TABLE_SCHEMAS } from './schemas';

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

  // 版本 0 -> 1: 初始化資料庫
  if (oldVersion < 1) {
    migrateToV1(db);
  }

  // 未來版本可在此加入
  // if (oldVersion < 2) {
  //   migrateToV2(db);
  // }
}

/**
 * 遷移到版本 1: 建立所有資料表
 */
function migrateToV1(db: IDBDatabase): void {
  console.log('[DB Migration] 執行 v1 遷移：建立所有資料表');

  TABLE_SCHEMAS.forEach((schema) => {
    // 如果資料表已存在，跳過
    if (db.objectStoreNames.contains(schema.name)) {
      console.log(`[DB Migration] 資料表 ${schema.name} 已存在，跳過`);
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

    console.log(`[DB Migration] 建立資料表: ${schema.name}`);
  });

  console.log('[DB Migration] v1 遷移完成');
}

/**
 * 遷移到版本 2 的範例（未來使用）
 */
// function migrateToV2(db: IDBDatabase): void {
//   console.log('[DB Migration] 執行 v2 遷移');
//
//   // 範例：新增索引
//   const transaction = db.transaction(['tours'], 'versionchange');
//   const objectStore = transaction.objectStore('tours');
//
//   if (!objectStore.indexNames.contains('newIndex')) {
//     objectStore.createIndex('newIndex', 'newField', { unique: false });
//   }
//
//   console.log('[DB Migration] v2 遷移完成');
// }

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
