/**
 * 同步狀態診斷工具
 *
 * 用途：檢查 IndexedDB 中的待同步項目，找出為什麼一直顯示「等待同步」
 *
 * 執行方式：在瀏覽器 Console 中執行此腳本
 */

import { localDB } from '@/lib/db';
import { TABLES } from '@/lib/db/schemas';
import { isTbcEntity, isSyncableEntity, needsSync } from '@/lib/sync/sync-types';

async function diagnoseSyncStatus() {
  console.log('🔍 開始診斷同步狀態...\n');

  const results: Record<string, any> = {};
  let totalPending = 0;

  for (const tableName of Object.values(TABLES)) {
    try {
      const allItems = await localDB.getAll(tableName);

      // 檢查 TBC 項目
      const tbcItems = allItems.filter(isTbcEntity);

      // 檢查 _needs_sync 項目
      const needsSyncItems = allItems.filter((item): item is any => {
        if (!isSyncableEntity(item)) return false;
        const isTbc = isTbcEntity(item);
        const isDeleted = item._deleted === true;
        return needsSync(item) && !isTbc && !isDeleted;
      });

      // 檢查軟刪除項目
      const deletedItems = allItems.filter((item: any) => item._deleted === true);

      const tablePendingCount = tbcItems.length + needsSyncItems.length;
      totalPending += tablePendingCount;

      if (tablePendingCount > 0 || deletedItems.length > 0) {
        results[tableName] = {
          total: allItems.length,
          tbcCount: tbcItems.length,
          needsSyncCount: needsSyncItems.length,
          deletedCount: deletedItems.length,
          tbcItems: tbcItems.map((item: any) => ({
            id: item.id,
            code: item.code,
            _needs_sync: item._needs_sync,
            _synced_at: item._synced_at,
          })),
          needsSyncItems: needsSyncItems.map((item: any) => ({
            id: item.id,
            code: (item as any).code || 'N/A',
            _needs_sync: item._needs_sync,
            _synced_at: item._synced_at,
            _deleted: item._deleted,
          })),
        };
      }
    } catch (error) {
      console.error(`❌ 檢查 ${tableName} 失敗:`, error);
    }
  }

  // 檢查 syncQueue
  try {
    const syncQueueItems = await localDB.getAll('syncQueue');
    if (syncQueueItems.length > 0) {
      results['syncQueue'] = {
        total: syncQueueItems.length,
        items: syncQueueItems.map((item: any) => ({
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

  console.log('📊 診斷結果：\n');
  console.log(`總待同步項目數：${totalPending}\n`);

  if (totalPending === 0) {
    console.log('✅ 沒有發現待同步項目！同步狀態應該顯示「已同步」');
    console.log('   → 如果仍顯示「等待同步」，可能是前端狀態更新問題');
  } else {
    console.log('⚠️ 發現待同步項目：\n');
    console.table(
      Object.entries(results).map(([table, data]) => ({
        表格: table,
        總數: data.total || data.items?.length || 0,
        TBC編號: data.tbcCount || 0,
        待同步: data.needsSyncCount || 0,
        待刪除: data.deletedCount || (table === 'syncQueue' ? data.items.length : 0),
      }))
    );

    console.log('\n📝 詳細資訊：');
    console.log(JSON.stringify(results, null, 2));
  }

  return results;
}

// 自動執行
diagnoseSyncStatus();

export { diagnoseSyncStatus };
