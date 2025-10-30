#!/usr/bin/env node

/**
 * IndexedDB 快取檢查工具
 * 檢查資料是否正確同步到 IndexedDB
 *
 * 注意：此腳本需要在瀏覽器環境執行，因為 Node.js 沒有 IndexedDB
 * 使用方式：將此腳本內容複製到瀏覽器 Console 執行
 */

const checkIndexedDBScript = `
// IndexedDB 檢查腳本 - 在瀏覽器 Console 執行
(async function checkIndexedDB() {
  console.log('='.repeat(60));
  console.log('🔍 IndexedDB 快取檢查');
  console.log('='.repeat(60));

  // 開啟 IndexedDB
  const dbName = 'venturo-db';
  const dbVersion = 1;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => {
      console.error('❌ 無法開啟 IndexedDB');
      reject(request.error);
    };

    request.onsuccess = async (event) => {
      const db = event.target.result;
      console.log('✅ IndexedDB 已開啟');
      console.log('Database:', dbName);
      console.log('版本:', db.version);
      console.log('');

      // 檢查所有 ObjectStore
      const storeNames = Array.from(db.objectStoreNames);
      console.log('📊 找到', storeNames.length, '個表：');
      console.log(storeNames.join(', '));
      console.log('');

      // 統計各表資料
      const results = {};

      for (const storeName of storeNames) {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();

          const count = await new Promise((resolve, reject) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
          });

          results[storeName] = count;

        } catch (error) {
          results[storeName] = { error: error.message };
        }
      }

      console.log('📈 資料統計：');
      console.log('');

      // 顯示統計
      const sortedStores = Object.entries(results)
        .sort(([a], [b]) => a.localeCompare(b));

      let totalRecords = 0;
      for (const [store, count] of sortedStores) {
        if (typeof count === 'number') {
          console.log(\`  \${store.padEnd(20)} \${count} 筆\`);
          totalRecords += count;
        } else {
          console.log(\`  \${store.padEnd(20)} ❌ 錯誤: \${count.error}\`);
        }
      }

      console.log('');
      console.log('總記錄數:', totalRecords);
      console.log('');

      // 檢查核心表
      console.log('🔍 核心表檢查：');
      const coreTables = ['tours', 'orders', 'quotes', 'employees', 'todos'];

      for (const tableName of coreTables) {
        const count = results[tableName];
        if (typeof count === 'number') {
          console.log(\`  ✅ \${tableName}: \${count} 筆\`);
        } else if (count) {
          console.log(\`  ❌ \${tableName}: 錯誤\`);
        } else {
          console.log(\`  ⚠️  \${tableName}: 不存在\`);
        }
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('✅ 檢查完成');
      console.log('='.repeat(60));

      db.close();
      resolve(results);
    };
  });
})();
`

console.log('='.repeat(60))
console.log('🔍 IndexedDB 快取檢查工具')
console.log('='.repeat(60))
console.log('')
console.log('⚠️  注意：IndexedDB 只能在瀏覽器環境中存取')
console.log('')
console.log('📋 使用步驟：')
console.log('')
console.log('1. 開啟瀏覽器訪問：http://localhost:3000')
console.log('2. 打開開發者工具（F12）')
console.log('3. 切換到 Console 標籤')
console.log('4. 複製以下腳本並貼上執行：')
console.log('')
console.log('='.repeat(60))
console.log(checkIndexedDBScript)
console.log('='.repeat(60))
console.log('')
console.log('💡 提示：')
console.log('  - 也可以在 Application 標籤 > IndexedDB 查看資料')
console.log('  - 資料庫名稱：venturo-db')
console.log('  - 檢查 tours, orders, quotes 等表')
console.log('')
