#!/usr/bin/env tsx
/**
 * 修復 IndexedDB 問題腳本
 * 處理：
 * 1. 重複索引問題
 * 2. 資料表不存在問題
 * 3. 資料庫版本升級問題
 */

const DB_NAME = 'VenturoOfflineDB';
const CURRENT_VERSION = 2;

interface DBFixResult {
  success: boolean;
  message: string;
  details?: any;
}

class DatabaseFixer {
  /**
   * 主要修復函數
   */
  static async fix(): Promise<DBFixResult> {
    console.log('🔧 開始修復資料庫問題...\n');

    try {
      // 1. 檢查並升級資料庫版本
      console.log('📊 檢查資料庫版本...');
      const versionResult = await this.checkAndUpgradeVersion();
      console.log(versionResult.message);

      // 2. 檢查 regions 表是否存在
      console.log('\n📊 檢查 regions 表...');
      const regionsResult = await this.checkRegionsTable();
      console.log(regionsResult.message);

      // 3. 清理重複資料
      console.log('\n🧹 清理重複資料...');
      const cleanupResult = await this.cleanupDuplicates();
      console.log(cleanupResult.message);

      // 4. 驗證修復結果
      console.log('\n✅ 驗證修復結果...');
      const validationResult = await this.validateFix();
      console.log(validationResult.message);

      console.log('\n✨ 資料庫修復完成！');

      return {
        success: true,
        message: '資料庫修復成功',
        details: {
          version: versionResult,
          regions: regionsResult,
          cleanup: cleanupResult,
          validation: validationResult
        }
      };
    } catch (error) {
      console.error('❌ 修復失敗:', error);
      return {
        success: false,
        message: '資料庫修復失敗',
        details: error
      };
    }
  }

  /**
   * 檢查並升級資料庫版本
   */
  private static checkAndUpgradeVersion(): Promise<DBFixResult> {
    return new Promise((resolve, reject) => {
      // 先獲取當前版本
      const versionRequest = indexedDB.open(DB_NAME);
      
      versionRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const currentVersion = db.version;
        db.close();

        if (currentVersion < CURRENT_VERSION) {
          // 需要升級
          console.log(`  需要升級: v${currentVersion} -> v${CURRENT_VERSION}`);
          
          const upgradeRequest = indexedDB.open(DB_NAME, CURRENT_VERSION);
          
          upgradeRequest.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // 如果 regions 表不存在，建立它
            if (!db.objectStoreNames.contains('regions')) {
              console.log('  建立 regions 表...');
              const regionsStore = db.createObjectStore('regions', {
                keyPath: 'id',
                autoIncrement: false,
              });

              // 建立索引
              regionsStore.createIndex('code', 'code', { unique: true });
              regionsStore.createIndex('name', 'name', { unique: false });
              regionsStore.createIndex('status', 'status', { unique: false });
              regionsStore.createIndex('is_active', 'is_active', { unique: false });
              regionsStore.createIndex('created_at', 'created_at', { unique: false });
              regionsStore.createIndex('updated_at', 'updated_at', { unique: false });
              regionsStore.createIndex('sync_status', 'sync_status', { unique: false });
            }
          };

          upgradeRequest.onsuccess = () => {
            upgradeRequest.result.close();
            resolve({
              success: true,
              message: `  ✅ 資料庫已升級到 v${CURRENT_VERSION}`
            });
          };

          upgradeRequest.onerror = () => {
            reject(new Error(`升級失敗: ${upgradeRequest.error?.message}`));
          };
        } else {
          resolve({
            success: true,
            message: `  ✅ 資料庫已是最新版本 v${currentVersion}`
          });
        }
      };

      versionRequest.onerror = () => {
        reject(new Error(`無法開啟資料庫: ${versionRequest.error?.message}`));
      };
    });
  }

  /**
   * 檢查 regions 表是否存在
   */
  private static checkRegionsTable(): Promise<DBFixResult> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, CURRENT_VERSION);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (db.objectStoreNames.contains('regions')) {
          // 計算 regions 表中的資料筆數
          const transaction = db.transaction(['regions'], 'readonly');
          const objectStore = transaction.objectStore('regions');
          const countRequest = objectStore.count();

          countRequest.onsuccess = () => {
            db.close();
            resolve({
              success: true,
              message: `  ✅ regions 表存在，包含 ${countRequest.result} 筆資料`
            });
          };

          countRequest.onerror = () => {
            db.close();
            reject(new Error('無法計算 regions 資料筆數'));
          };
        } else {
          db.close();
          resolve({
            success: false,
            message: '  ⚠️ regions 表不存在（需要重新建立）'
          });
        }
      };

      request.onerror = () => {
        reject(new Error(`無法開啟資料庫: ${request.error?.message}`));
      };
    });
  }

  /**
   * 清理重複資料
   */
  private static async cleanupDuplicates(): Promise<DBFixResult> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, CURRENT_VERSION);

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 需要檢查的表和唯一索引
        const tablesToCheck = [
          { table: 'regions', uniqueField: 'code' },
          { table: 'tours', uniqueField: 'code' },
          { table: 'orders', uniqueField: 'code' },
          { table: 'customers', uniqueField: 'code' },
        ];

        let totalCleaned = 0;

        for (const { table, uniqueField } of tablesToCheck) {
          if (!db.objectStoreNames.contains(table)) {
            console.log(`    跳過 ${table} (不存在)`);
            continue;
          }

          try {
            const cleaned = await this.cleanTableDuplicates(db, table, uniqueField);
            totalCleaned += cleaned;
            if (cleaned > 0) {
              console.log(`    清理 ${table}: 移除 ${cleaned} 筆重複資料`);
            }
          } catch (error) {
            console.error(`    ${table} 清理失敗:`, error);
          }
        }

        db.close();
        resolve({
          success: true,
          message: `  ✅ 清理完成，共移除 ${totalCleaned} 筆重複資料`
        });
      };

      request.onerror = () => {
        reject(new Error(`無法開啟資料庫: ${request.error?.message}`));
      };
    });
  }

  /**
   * 清理單個表的重複資料
   */
  private static cleanTableDuplicates(
    db: IDBDatabase, 
    tableName: string, 
    uniqueField: string
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], 'readwrite');
      const objectStore = transaction.objectStore(tableName);
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = async () => {
        const records = getAllRequest.result;
        const seen = new Map<any, any>();
        const duplicates: string[] = [];

        // 找出重複資料
        for (const record of records) {
          const key = record[uniqueField];
          if (key && seen.has(key)) {
            // 保留較新的資料（根據 updated_at 或 created_at）
            const existing = seen.get(key);
            const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const currentTime = new Date(record.updated_at || record.created_at || 0).getTime();
            
            if (currentTime > existingTime) {
              duplicates.push(existing.id);
              seen.set(key, record);
            } else {
              duplicates.push(record.id);
            }
          } else if (key) {
            seen.set(key, record);
          }
        }

        // 刪除重複資料
        if (duplicates.length > 0) {
          const deleteTransaction = db.transaction([tableName], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(tableName);
          
          for (const id of duplicates) {
            deleteStore.delete(id);
          }

          deleteTransaction.oncomplete = () => {
            resolve(duplicates.length);
          };

          deleteTransaction.onerror = () => {
            reject(new Error(`刪除重複資料失敗: ${deleteTransaction.error?.message}`));
          };
        } else {
          resolve(0);
        }
      };

      getAllRequest.onerror = () => {
        reject(new Error(`讀取 ${tableName} 失敗`));
      };
    });
  }

  /**
   * 驗證修復結果
   */
  private static validateFix(): Promise<DBFixResult> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, CURRENT_VERSION);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const issues: string[] = [];

        // 檢查關鍵表是否存在
        const requiredTables = ['regions', 'tours', 'orders', 'customers', 'employees'];
        for (const table of requiredTables) {
          if (!db.objectStoreNames.contains(table)) {
            issues.push(`缺少表: ${table}`);
          }
        }

        db.close();

        if (issues.length === 0) {
          resolve({
            success: true,
            message: '  ✅ 資料庫結構正常'
          });
        } else {
          resolve({
            success: false,
            message: `  ⚠️ 發現問題:\n    - ${issues.join('\n    - ')}`
          });
        }
      };

      request.onerror = () => {
        reject(new Error(`無法開啟資料庫: ${request.error?.message}`));
      };
    });
  }
}

// 在瀏覽器環境中執行
if (typeof window !== 'undefined') {
  // 添加到 window 對象以便在 console 中調用
  (window as any).fixDatabase = DatabaseFixer.fix;
  console.log('💡 在 Console 中執行 fixDatabase() 來修復資料庫問題');
} else {
  console.log('⚠️ 此腳本需要在瀏覽器環境中執行');
  console.log('請在瀏覽器的 Console 中貼上此腳本並執行 fixDatabase()');
}

// 導出供其他模組使用
export default DatabaseFixer;
