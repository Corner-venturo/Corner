/**
 * 資料合併策略
 * 處理本地和遠端資料的合併邏輯
 */

import type { BaseEntity } from '@/types';
import { logger } from '@/lib/utils/logger';

/**
 * 可同步實體（包含同步欄位）
 */
interface SyncableEntity extends BaseEntity {
  _needs_sync?: boolean;
  _synced_at?: string | null;
  _deleted?: boolean;
}

export class MergeStrategy<T extends BaseEntity> {
  /**
   * 合併本地和遠端資料
   *
   * 策略：
   * 1. 保留所有遠端資料（權威來源）
   * 2. 加入本地待同步的資料（_needs_sync: true）
   * 3. 過濾軟刪除的項目
   */
  merge(
    localItems: T[],
    remoteItems: T[],
    tableName: string
  ): T[] {
    // 過濾軟刪除項目
    const filteredLocal = this.filterDeleted(localItems);
    const filteredRemote = this.filterDeleted(remoteItems);

    // 找出本地待同步的資料
    const localPending = filteredLocal.filter((localItem) => {
      const syncable = localItem as unknown as SyncableEntity;

      // 保留標記為待同步的資料
      if (syncable._needs_sync === true) {
        return true;
      }

      // 保留遠端不存在的資料（可能是新增但尚未同步）
      return !filteredRemote.find((remoteItem) => remoteItem.id === localItem.id);
    });

    // 合併：遠端資料 + 本地待同步資料
    const merged = [...filteredRemote, ...localPending];

    logger.log(
      `🔄 [${tableName}] 資料合併完成 (遠端: ${filteredRemote.length} + 本地: ${localPending.length} = ${merged.length})`
    );

    return merged;
  }

  /**
   * 解決單筆衝突（簡化版 - Last Write Wins）
   *
   * TODO: 未來可實作更複雜的衝突解決策略
   * - 版本號比較
   * - 時間戳比較
   * - 使用者手動選擇
   */
  resolveConflict(local: T, remote: T): T {
    const localSyncable = local as unknown as SyncableEntity;
    const remoteSyncable = remote as unknown as SyncableEntity;

    // 如果本地有待同步標記，優先使用本地（避免覆蓋未上傳的修改）
    if (localSyncable._needs_sync === true) {
      logger.log(`⚠️ 衝突解決：使用本地版本 (待同步)`);
      return local;
    }

    // 比較 updated_at 時間戳
    const localTime = new Date(local.updated_at || 0).getTime();
    const remoteTime = new Date(remote.updated_at || 0).getTime();

    if (localTime > remoteTime) {
      logger.log(`⚠️ 衝突解決：使用本地版本 (較新)`);
      return local;
    } else {
      logger.log(`⚠️ 衝突解決：使用遠端版本 (較新或相同)`);
      return remote;
    }
  }

  /**
   * 過濾軟刪除的項目
   */
  filterDeleted(items: T[]): T[] {
    return items.filter((item) => {
      const syncable = item as unknown as SyncableEntity;
      return !syncable._deleted;
    });
  }

  /**
   * 檢查是否有待同步資料
   */
  hasPendingSync(items: T[]): boolean {
    return items.some((item) => {
      const syncable = item as unknown as SyncableEntity;
      return syncable._needs_sync === true;
    });
  }

  /**
   * 取得待同步資料數量
   */
  getPendingCount(items: T[]): number {
    return items.filter((item) => {
      const syncable = item as unknown as SyncableEntity;
      return syncable._needs_sync === true;
    }).length;
  }
}
