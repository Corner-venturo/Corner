/**
 * 同步協調器
 * 協調 IndexedDB 和 Supabase 之間的資料同步
 */

import type { BaseEntity } from '@/types'
import type { TableName } from '@/lib/db/schemas'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { isSyncableTable } from '@/lib/db/sync-schema-helper'
import { backgroundSyncService } from '@/lib/sync/background-sync-service'
import { logger } from '@/lib/utils/logger'

export class SyncCoordinator<T extends BaseEntity> {
  constructor(
    private tableName: TableName,
    private indexedDB: IndexedDBAdapter<T>,
    private supabase: SupabaseAdapter<T>
  ) {}

  /**
   * 同步待處理的資料到 Supabase
   */
  async syncPending(): Promise<void> {
    if (!isSyncableTable(this.tableName)) {
      logger.log(`⏭️ [${this.tableName}] 不支援同步，跳過`)
      return
    }

    try {
      logger.log(`🔄 [${this.tableName}] 開始同步待處理資料...`)

      // 使用背景同步服務
      await backgroundSyncService.syncTable(this.tableName)

      logger.log(`✅ [${this.tableName}] 同步完成`)
    } catch (error) {
      logger.error(`❌ [${this.tableName}] 同步失敗:`, error)
      throw error
    }
  }

  /**
   * 上傳本地待同步資料
   */
  async uploadLocalChanges(): Promise<void> {
    if (!isSyncableTable(this.tableName)) {
      return
    }

    try {
      logger.log(`📤 [${this.tableName}] 上傳本地修改...`)

      await backgroundSyncService.syncTable(this.tableName)

      logger.log(`✅ [${this.tableName}] 本地修改已上傳`)
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] 上傳失敗:`, error)
      throw error
    }
  }

  /**
   * 下載遠端最新資料
   */
  async downloadRemoteChanges(signal?: AbortSignal): Promise<T[]> {
    try {
      logger.log(`📥 [${this.tableName}] 下載遠端資料...`)

      const items = await this.supabase.fetchAll(signal)

      logger.log(`✅ [${this.tableName}] 遠端資料已下載:`, items.length, '筆')

      return items
    } catch (error) {
      logger.warn(`⚠️ [${this.tableName}] 下載失敗:`, error)
      throw error
    }
  }

  /**
   * 完整同步流程（上傳 + 下載）
   */
  async syncTable(signal?: AbortSignal): Promise<T[]> {
    try {
      // 1. 上傳本地待同步資料
      await this.uploadLocalChanges()

      // 2. 下載遠端最新資料
      const remoteItems = await this.downloadRemoteChanges(signal)

      // 3. 合併資料（在 fetchAll 中處理）
      return remoteItems
    } catch (error) {
      logger.error(`❌ [${this.tableName}] 同步失敗:`, error)
      throw error
    }
  }
}
