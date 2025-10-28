/**
 * 修復 IndexedDB 中無效的 quotes 資料
 *
 * 使用方式：在瀏覽器 Console 執行
 */

(async function fixInvalidQuotes() {
  console.log('🔧 開始修復無效的 quotes 資料...\n');

  // 開啟 IndexedDB
  const dbName = 'VenturoLocalDB';
  const dbVersion = 1;

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!db.objectStoreNames.contains('quotes')) {
    console.log('❌ quotes 表格不存在');
    db.close();
    return;
  }

  // 讀取所有 quotes
  const transaction = db.transaction(['quotes'], 'readwrite');
  const store = transaction.objectStore('quotes');
  const allQuotes = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  console.log(`📊 總共有 ${allQuotes.length} 筆 quotes\n`);

  let fixedCount = 0;
  let deletedCount = 0;

  for (const quote of allQuotes) {
    // 檢查 1: id 是否存在
    if (!quote.id) {
      console.log(`❌ 發現無效資料（缺少 id）:`, quote);

      // 刪除這筆無效資料
      const deleteRequest = store.delete(quote.id || Math.random().toString());
      await new Promise((resolve) => {
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve();
      });

      deletedCount++;
      continue;
    }

    // 檢查 2: code 是否存在
    if (!quote.code) {
      console.log(`⚠️ 發現缺少 code 的資料: ${quote.id}`);

      // 生成臨時 code
      const tempCode = `TBC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      quote.code = tempCode;

      // 更新資料
      const putRequest = store.put(quote);
      await new Promise((resolve) => {
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => resolve();
      });

      console.log(`   ✅ 已設定臨時 code: ${tempCode}`);
      fixedCount++;
    }

    // 檢查 3: _needs_sync 標記
    if (quote._needs_sync) {
      console.log(`🔄 待同步資料: ${quote.code} (id: ${quote.id})`);
    }
  }

  db.close();

  console.log('\n📊 修復結果：');
  console.log(`   - 修復資料數：${fixedCount}`);
  console.log(`   - 刪除無效資料：${deletedCount}`);
  console.log(`   - 總資料數：${allQuotes.length}`);

  if (fixedCount > 0 || deletedCount > 0) {
    console.log('\n💡 建議重新整理頁面，讓同步重新執行');
  } else {
    console.log('\n✅ 所有資料都正常！');
  }
})();
