/**
 * 同步诊断工具
 * 用于检查待同步资料的详细信息
 */

import { localDB } from '@/lib/db';
import { TABLES } from '@/lib/db/schemas';
import { logger } from '@/lib/utils/logger';

// 可同步項目的基礎介面
interface SyncableItem {
  _needs_sync?: boolean;
  _synced_at?: string;
  _deleted?: boolean;
  code?: string;
  [key: string]: unknown;
}

export async function diagnosePendingSync() {
  logger.log('🔍 开始诊断待同步资料...');

  const results: Record<string, any[]> = {};
  let totalPending = 0;

  for (const tableName of Object.values(TABLES)) {
    try {
      const items = await localDB.getAll(tableName);

      const pending = items.filter((item: any) => {
        return (
          item._needs_sync === true ||
          (item.code && String(item.code).startsWith('TBC')) ||
          item._deleted === true
        );
      });

      if (pending.length > 0) {
        results[tableName] = pending;
        totalPending += pending.length;

        logger.log(`\n📦 表格: ${tableName}`);
        logger.log(`   待同步数量: ${pending.length}`);

        pending.forEach((item: any, index: number) => {
          logger.log(`\n   [${index + 1}] ID: ${item.id}`);
          logger.log(`       Code: ${item.code || 'N/A'}`);
          logger.log(`       _needs_sync: ${item._needs_sync}`);
          logger.log(`       _synced_at: ${item._synced_at || 'never'}`);
          logger.log(`       _deleted: ${item._deleted || false}`);

          // 显示部分资料内容（用于诊断）
          const preview: any = {};
          Object.keys(item).forEach(key => {
            if (!key.startsWith('_') && key !== 'id') {
              const value = item[key];
              if (typeof value === 'string' && value.length > 50) {
                preview[key] = value.substring(0, 50) + '...';
              } else if (typeof value === 'object' && value !== null) {
                preview[key] = '[Object/Array]';
              } else {
                preview[key] = value;
              }
            }
          });
          logger.log('       预览:', preview);
        });
      }
    } catch (error) {
      // 跳过不存在的表格
      continue;
    }
  }

  logger.log(`\n\n📊 诊断总结:`);
  logger.log(`   总计待同步: ${totalPending} 笔`);
  logger.log(`   涉及表格: ${Object.keys(results).length} 个`);

  return results;
}

// 手动触发同步并显示结果
export async function forceSyncAndDiagnose() {
  logger.log('🚀 强制触发同步...\n');

  const { backgroundSyncService } = await import('./background-sync-service');

  try {
    await backgroundSyncService.syncAllTables();
    logger.log('✅ 同步完成\n');
  } catch (error) {
    logger.error('❌ 同步失败:', error);
  }

  // 再次检查
  logger.log('\n🔍 同步后检查:');
  return await diagnosePendingSync();
}

// 清除指定表格的所有待同步标记（谨慎使用！）
export async function clearPendingSyncFlags(tableName: string) {
  logger.warn(`⚠️ 正在清除 ${tableName} 的所有待同步标记...`);

  const items = await localDB.getAll(tableName);

  for (const item of items) {
    const syncableItem = item as SyncableItem;
    if (syncableItem._needs_sync === true) {
      await localDB.put(tableName, {
        ...item,
        _needs_sync: false,
        _synced_at: new Date().toISOString(),
      });
    }
  }

  logger.log(`✅ 已清除 ${tableName} 的待同步标记`);
}
