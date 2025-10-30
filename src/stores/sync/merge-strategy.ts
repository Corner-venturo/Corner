/**
 * 資料合併策略（型別安全版本）
 * 處理本地和遠端資料的合併邏輯
 */

import type { BaseEntity, SyncableEntity } from '@/types'
import { logger } from '@/lib/utils/logger'
import { isSyncableEntity, needsSync, isDeleted } from '@/lib/sync/sync-types'

export class MergeStrategy<T extends BaseEntity> {
  /**
   * 合併本地和遠端資料
   *
   * 策略：
   * 1. 保留所有遠端資料（權威來源）
   * 2. 加入本地待同步的資料（_needs_sync: true）
   * 3. 過濾軟刪除的項目
   */
  merge(localItems: T[], remoteItems: T[], tableName: string): T[] {
    // 過濾軟刪除項目
    const filteredLocal = this.filterDeleted(localItems)
    const filteredRemote = this.filterDeleted(remoteItems)

    // 找出本地待同步的資料
    const localPending = filteredLocal.filter(localItem => {
      // 使用型別守衛檢查是否為可同步實體
      if (isSyncableEntity(localItem)) {
        // 保留標記為待同步的資料
        if (needsSync(localItem)) {
          return true
        }
      }

      // 保留遠端不存在的資料（可能是新增但尚未同步）
      return !filteredRemote.find(remoteItem => remoteItem.id === localItem.id)
    })

    // 合併：遠端資料 + 本地待同步資料
    const merged = [...filteredRemote, ...localPending]

    logger.log(
      `🔄 [${tableName}] 資料合併完成 (遠端: ${filteredRemote.length} + 本地: ${localPending.length} = ${merged.length})`
    )

    return merged
  }

  /**
   * 解決單筆衝突（簡化版 - Last Write Wins）
   *
   * 策略：
   * 1. 如果本地有待同步標記，優先使用本地（避免覆蓋未上傳的修改）
   * 2. 否則比較 updated_at 時間戳，使用較新的版本
   *
   * TODO: 未來可實作更複雜的衝突解決策略
   * - 版本號比較
   * - 欄位級別的合併
   * - 使用者手動選擇
   */
  resolveConflict(local: T, remote: T): T {
    // 檢查本地是否為可同步實體且有待同步標記
    if (isSyncableEntity(local) && needsSync(local)) {
      logger.log(`⚠️ 衝突解決：使用本地版本 (待同步)`)
      return local
    }

    // 比較 updated_at 時間戳
    const localTime = new Date(local.updated_at || 0).getTime()
    const remoteTime = new Date(remote.updated_at || 0).getTime()

    if (localTime > remoteTime) {
      logger.log(`⚠️ 衝突解決：使用本地版本 (較新)`)
      return local
    } else {
      logger.log(`⚠️ 衝突解決：使用遠端版本 (較新或相同)`)
      return remote
    }
  }

  /**
   * 過濾軟刪除的項目
   */
  filterDeleted(items: T[]): T[] {
    return items.filter(item => !isDeleted(item))
  }

  /**
   * 檢查是否有待同步資料
   */
  hasPendingSync(items: T[]): boolean {
    return items.some(item => isSyncableEntity(item) && needsSync(item))
  }

  /**
   * 取得待同步資料數量
   */
  getPendingCount(items: T[]): number {
    return items.filter(item => isSyncableEntity(item) && needsSync(item)).length
  }

  /**
   * 取得待同步的項目列表（型別安全）
   */
  getPendingItems(items: T[]): Array<T & SyncableEntity> {
    return items.filter((item): item is T & SyncableEntity => {
      return isSyncableEntity(item) && needsSync(item)
    })
  }

  /**
   * 檢查項目是否需要同步
   */
  itemNeedsSync(item: T): boolean {
    return isSyncableEntity(item) && needsSync(item)
  }

  /**
   * 標記項目為已同步
   */
  markAsSynced(item: T): T & SyncableEntity {
    if (!isSyncableEntity(item)) {
      throw new Error('Item is not syncable - missing sync fields')
    }

    return {
      ...item,
      _needs_sync: false,
      _synced_at: new Date().toISOString(),
    }
  }

  /**
   * 標記項目為待同步
   */
  markAsNeedsSync(item: T): T & SyncableEntity {
    // 如果已經是可同步實體，更新標記
    if (isSyncableEntity(item)) {
      return {
        ...item,
        _needs_sync: true,
        _synced_at: null,
      }
    }

    // 否則加上同步欄位
    return {
      ...item,
      _needs_sync: true,
      _synced_at: null,
    }
  }
}
