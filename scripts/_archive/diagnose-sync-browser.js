/**
 * 瀏覽器 Console 同步診斷工具
 *
 * 使用方式：
 * 1. 開啟 Chrome DevTools (F12)
 * 2. 複製整個腳本到 Console
 * 3. 按 Enter 執行
 */

(async function diagnoseSyncStatus() {
  console.log('🔍 開始診斷同步狀態...\n');

  // 開啟 IndexedDB
  const dbName = 'VenturoLocalDB';
  const dbVersion = 1;

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const tables = [
    'tours', 'quotes', 'orders', 'members', 'customers',
    'payments', 'employees', 'visas', 'finance_records',
    'workspaces', 'channels', 'messages', 'workspace_members',
    'channel_members', 'syncQueue'
  ];

  const results = {};
  let totalPending = 0;

  for (const tableName of tables) {
    try {
      // 檢查表格是否存在
      if (!db.objectStoreNames.contains(tableName)) {
        continue;
      }

      const transaction = db.transaction([tableName], 'readonly');
      const store = transaction.objectStore(tableName);
      const allItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // 檢查 TBC 項目
      const tbcItems = allItems.filter(item =>
        item.code && typeof item.code === 'string' && item.code.startsWith('TBC-')
      );

      // 檢查 _needs_sync 項目
      const needsSyncItems = allItems.filter(item => {
        const isTbc = item.code && typeof item.code === 'string' && item.code.startsWith('TBC-');
        const isDeleted = item._deleted === true;
        return item._needs_sync === true && !isTbc && !isDeleted;
      });

      // 檢查軟刪除項目
      const deletedItems = allItems.filter(item => item._deleted === true);

      const tablePendingCount = tbcItems.length + needsSyncItems.length;
      totalPending += tablePendingCount;

      if (tablePendingCount > 0 || deletedItems.length > 0) {
        results[tableName] = {
          total: allItems.length,
          tbcCount: tbcItems.length,
          needsSyncCount: needsSyncItems.length,
          deletedCount: deletedItems.length,
          tbcItems: tbcItems.map(item => ({
            id: item.id,
            code: item.code,
            _needs_sync: item._needs_sync,
            _synced_at: item._synced_at,
          })),
          needsSyncItems: needsSyncItems.map(item => ({
            id: item.id,
            code: item.code || 'N/A',
            _needs_sync: item._needs_sync,
            _synced_at: item._synced_at,
          })),
        };
      }
    } catch (error) {
      console.error(`❌ 檢查 ${tableName} 失敗:`, error);
    }
  }

  // 檢查 syncQueue
  if (db.objectStoreNames.contains('syncQueue')) {
    try {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const syncQueueItems = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (syncQueueItems.length > 0) {
        results['syncQueue'] = {
          total: syncQueueItems.length,
          items: syncQueueItems.map(item => ({
            id: item.id,
            table_name: item.table_name,
            operation: item.operation,
            record_id: item.record_id,
            created_at: item.created_at,
          })),
        };
        totalPending += syncQueueItems.length;
      }
    } catch (error) {
      console.error('❌ 檢查 syncQueue 失敗:', error);
    }
  }

  db.close();

  console.log('📊 診斷結果：\n');
  console.log(`%c總待同步項目數：${totalPending}`, 'font-size: 16px; font-weight: bold; color: ' + (totalPending > 0 ? '#ff6b6b' : '#51cf66'));
  console.log('');

  if (totalPending === 0) {
    console.log('%c✅ 沒有發現待同步項目！', 'color: #51cf66; font-weight: bold');
    console.log('%c   → 同步狀態應該顯示「已同步」', 'color: #868e96');
    console.log('%c   → 如果仍顯示「等待同步」，可能是前端狀態更新問題', 'color: #868e96');
  } else {
    console.log('%c⚠️ 發現待同步項目：', 'color: #ff6b6b; font-weight: bold');
    console.log('');

    const tableData = Object.entries(results).map(([table, data]) => ({
      '表格': table,
      '總數': data.total !== undefined ? data.total : (data.items?.length || 0),
      'TBC編號': data.tbcCount || 0,
      '待同步': data.needsSyncCount || 0,
      '待刪除': data.deletedCount || (table === 'syncQueue' ? data.items.length : 0),
    }));

    console.table(tableData);

    console.log('\n📝 詳細資訊：');
    for (const [table, data] of Object.entries(results)) {
      console.group(`${table} (${data.total || data.items?.length || 0} 項)`);

      if (data.tbcItems && data.tbcItems.length > 0) {
        console.log('%cTBC 編號項目:', 'font-weight: bold; color: #ff6b6b');
        console.table(data.tbcItems);
      }

      if (data.needsSyncItems && data.needsSyncItems.length > 0) {
        console.log('%c待同步項目:', 'font-weight: bold; color: #ff922b');
        console.table(data.needsSyncItems);
      }

      if (table === 'syncQueue' && data.items && data.items.length > 0) {
        console.log('%c同步佇列:', 'font-weight: bold; color: #748ffc');
        console.table(data.items);
      }

      console.groupEnd();
    }
  }

  console.log('\n💡 建議操作：');
  if (totalPending > 0) {
    console.log('1. 檢查網路連線是否正常');
    console.log('2. 點擊同步狀態指示器的「手動同步」按鈕');
    console.log('3. 查看 Console 是否有同步錯誤訊息');
    console.log('4. 如果問題持續，可能需要清除 IndexedDB 重新同步');
  } else {
    console.log('1. 重新整理頁面，看狀態是否更新');
    console.log('2. 如果仍顯示「等待同步」，可能是前端 React 狀態未更新');
  }

  return results;
})();
