/**
 * 背景同步服務（型別安全版本）
 *
 * 負責處理離線時的資料同步，包括：
 * 1. TBC 編號轉換（離線建立的項目）
 * 2. 待同步的新增/修改項目
 * 3. 待刪除的項目
 *
 * 架構：同步邏輯與資料讀取分離
 */

import { supabase } from '@/lib/supabase/client'
import { localDB } from '@/lib/db'
import { TABLES, TableName } from '@/lib/db/schemas'
import { logger } from '@/lib/utils/logger'
import type { BaseEntity, SyncableEntity } from '@/types'
import {
  isTbcEntity,
  isSyncableEntity,
  isSyncQueueItem,
  needsSync,
  type TbcEntity,
  type SyncQueueItem,
  type CodedEntity,
} from './sync-types'

export class BackgroundSyncService {
  private syncInProgress: Set<string> = new Set()

  /**
   * 同步單一表格的所有待處理項目
   */
  async syncTable(tableName: TableName): Promise<void> {
    // 防止重複同步
    if (this.syncInProgress.has(tableName)) {
      logger.log(`⏳ [${tableName}] 同步進行中，跳過`)
      return
    }

    try {
      this.syncInProgress.add(tableName)
      logger.log(`🔄 [${tableName}] 開始背景同步...`)

      // 1. 同步 TBC 編號轉換
      await this.syncTbcCodes(tableName)

      // 2. 同步待上傳項目
      await this.syncPendingUpserts(tableName)

      // 3. 同步待刪除項目
      await this.syncPendingDeletes(tableName)

      logger.log(`✅ [${tableName}] 背景同步完成`)
    } catch (error) {
      logger.error(`❌ [${tableName}] 背景同步失敗:`, error)
      // 不拋出錯誤，靜默失敗
    } finally {
      this.syncInProgress.delete(tableName)
    }
  }

  /**
   * 同步所有表格
   */
  async syncAllTables(): Promise<void> {
    const tables = Object.values(TABLES)

    logger.log('🌍 開始同步所有表格...')

    // 並行同步所有表格
    await Promise.allSettled(tables.map(tableName => this.syncTable(tableName)))

    logger.log('✅ 所有表格同步完成')
  }

  /**
   * 1. 同步 TBC 編號轉換
   *
   * 將離線建立的項目（TBC 編號）轉換為正式編號
   */
  private async syncTbcCodes(tableName: TableName): Promise<void> {
    try {
      const allLocalItems = await localDB.getAll(tableName)

      // 使用型別守衛過濾 TBC 項目
      const tbcItems = allLocalItems.filter(isTbcEntity)

      if (tbcItems.length === 0) return

      logger.log(`🔧 [${tableName}] 發現 ${tbcItems.length} 筆 TBC 編號，準備轉換...`)

      for (const item of tbcItems) {
        try {
          // 準備上傳資料（移除 TBC code 和同步欄位）
          const { code, _needs_sync, _synced_at, _deleted, ...itemData } = item

          // 上傳到 Supabase（會自動生成正式編號）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: supabaseData, error } = await (supabase.from as any)(tableName)
            .insert([itemData])
            .select()
            .single()

          if (error) throw error
          if (!supabaseData) throw new Error('No data returned from insert')

          // 更新 IndexedDB（用新的正式編號）
          await localDB.delete(tableName, item.id)

          // 將 Supabase 回傳的資料加上同步欄位
          const syncedData: SyncableEntity = {
            ...(supabaseData as BaseEntity),
            _needs_sync: false,
            _synced_at: new Date().toISOString(),
          }

          await localDB.put(tableName, syncedData)

          // 型別安全的 code 存取
          const newCode = (supabaseData as CodedEntity).code || 'unknown'
          logger.log(`✅ [${tableName}] TBC 編號已轉換: ${code} → ${newCode}`)
        } catch (error) {
          logger.error(`❌ [${tableName}] TBC 編號轉換失敗:`, item.code, error)
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncTbcCodes 失敗:`, error)
    }
  }

  /**
   * 2. 同步待上傳項目（新增/修改）
   *
   * 同步標記為 _needs_sync: true 的項目
   */
  private async syncPendingUpserts(tableName: TableName): Promise<void> {
    try {
      const allLocalItems = await localDB.getAll(tableName)

      // 使用型別守衛和純函數過濾
      const pendingUpserts = allLocalItems.filter((item): item is SyncableEntity => {
        if (!isSyncableEntity(item)) return false

        // 排除 TBC 編號和軟刪除的項目
        const isTbc = isTbcEntity(item)
        const isDeleted = item._deleted === true

        return needsSync(item) && !isTbc && !isDeleted
      })

      if (pendingUpserts.length === 0) return

      logger.log(`📤 [${tableName}] 發現 ${pendingUpserts.length} 筆待同步項目，開始上傳...`)

      for (const item of pendingUpserts) {
        try {
          // 移除同步標記欄位
          const { _needs_sync, _synced_at, _deleted, ...syncData } = item

          // 🔥 通用處理：將空字串的 timestamp/date 欄位轉為 null
          // PostgreSQL 不接受空字串作為 timestamp 值
          Object.keys(syncData).forEach(key => {
            const value = (syncData as Record<string, unknown>)[key]
            // 如果欄位名稱包含 _at、_date 或是 deadline，且值為空字串，轉為 null
            if (
              (key.endsWith('_at') || key.endsWith('_date') || key === 'deadline') &&
              value === ''
            ) {
              ;(syncData as Record<string, unknown>)[key] = null
            }
          })

          // 🔥 特殊處理：為 quotes 表補充必填欄位的預設值
          if (tableName === 'quotes') {
            const quoteData = syncData as Record<string, unknown>
            // 如果缺少 customer_name，提供預設值
            if (!quoteData.customer_name) {
              quoteData.customer_name = '待指定'
            }
            // 確保其他必填欄位也有值
            if (!quoteData.destination) {
              quoteData.destination = '待指定'
            }
            if (!quoteData.start_date) {
              quoteData.start_date = new Date().toISOString().split('T')[0]
            }
            if (!quoteData.end_date) {
              quoteData.end_date = new Date().toISOString().split('T')[0]
            }
            if (!quoteData.days) {
              quoteData.days = 1
            }
            if (!quoteData.nights) {
              quoteData.nights = 0
            }
            if (!quoteData.number_of_people) {
              quoteData.number_of_people = 1
            }
            if (!quoteData.total_amount) {
              quoteData.total_amount = 0
            }
          }

          // 🔥 先檢查 syncQueue 是否有此項目的刪除記錄
          const allQueueItems = await localDB.getAll(TABLES.SYNC_QUEUE as any)
          const hasDeleteRecord = allQueueItems.some(queueItem => {
            if (!isSyncQueueItem(queueItem)) return false
            return (
              queueItem.table_name === tableName &&
              queueItem.record_id === item.id &&
              queueItem.operation === 'delete'
            )
          })

          // 如果有刪除記錄，不要上傳，直接清理本地資料
          if (hasDeleteRecord) {
            logger.log(`⚠️ [${tableName}] 發現刪除記錄，跳過同步並清理本地資料: ${item.id}`)
            await localDB.delete(tableName, item.id)
            continue
          }

          // 檢查是否已存在（update）或新建（insert）
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existing } = await (supabase.from as any)(tableName)
            .select('id')
            .eq('id', item.id)
            .maybeSingle() // ✅ 使用 maybeSingle() 避免 406 錯誤

          if (existing) {
            // 更新
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from as any)(tableName).update(syncData).eq('id', item.id)

            if (error) throw error
            logger.log(`✅ [${tableName}] 更新成功: ${item.id}`)
          } else {
            // 新增（確保不是已被其他裝置刪除的資料）
            // 如果 Supabase 中找不到，有兩種可能：
            // 1. 真的是新資料
            // 2. 已被其他裝置刪除
            //
            // 保守做法：如果資料已經有 _synced_at（曾經同步過），則跳過
            if (item._synced_at) {
              logger.warn(
                `⚠️ [${tableName}] 資料在 Supabase 中不存在但曾同步過，可能已被其他裝置刪除，跳過插入: ${item.id}`
              )
              // 清理本地資料
              await localDB.delete(tableName, item.id)
              continue
            }

            // 真的是新資料，執行插入
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from as any)(tableName).insert([syncData])

            if (error) throw error
            logger.log(`✅ [${tableName}] 新增成功: ${item.id}`)
          }

          // 更新 IndexedDB（標記為已同步）
          const syncedItem: SyncableEntity = {
            ...item,
            _needs_sync: false,
            _synced_at: new Date().toISOString(),
          }

          await localDB.put(tableName, syncedItem)
        } catch (error) {
          logger.error(`❌ [${tableName}] 同步失敗:`, item.id)

          // 詳細記錄錯誤資訊
          if (error instanceof Error) {
            logger.error('錯誤訊息:', error.message)
            logger.error('錯誤堆疊:', error.stack)
          } else if (typeof error === 'object' && error !== null) {
            // Supabase 錯誤物件
            logger.error('Supabase 錯誤:', JSON.stringify(error, null, 2))
            // @ts-ignore - Supabase error 可能有 message, code, details
            if (error.message) logger.error('訊息:', error.message)
            // @ts-ignore
            if (error.code) logger.error('錯誤代碼:', error.code)
            // @ts-ignore
            if (error.details) logger.error('詳細資訊:', error.details)
            // @ts-ignore
            if (error.hint) logger.error('提示:', error.hint)
          } else {
            logger.error('錯誤內容:', String(error))
          }

          // 記錄嘗試同步的資料
          logger.error('嘗試同步的資料:', JSON.stringify(item, null, 2))
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncPendingUpserts 失敗:`, error)
    }
  }

  /**
   * 3. 同步待刪除項目
   *
   * 處理 syncQueue 表中的刪除操作
   */
  private async syncPendingDeletes(tableName: TableName): Promise<void> {
    try {
      // 從 syncQueue 表中取得該表的刪除操作
      const allQueueItems = await localDB.getAll(TABLES.SYNC_QUEUE as any)

      // 使用型別守衛過濾刪除操作
      const pendingDeletes = allQueueItems.filter((item): item is SyncQueueItem => {
        if (!isSyncQueueItem(item)) return false
        return item.table_name === tableName && item.operation === 'delete'
      })

      if (pendingDeletes.length === 0) return

      logger.log(`🗑️ [${tableName}] 發現 ${pendingDeletes.length} 筆待刪除項目，開始刪除...`)

      for (const queueItem of pendingDeletes) {
        try {
          // 從 Supabase 刪除
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase.from as any)(tableName).delete().eq('id', queueItem.record_id)

          // 刪除成功或資料已不存在，清除隊列記錄
          await localDB.delete(TABLES.SYNC_QUEUE as any, queueItem.id)

          if (error) {
            logger.warn(
              `⚠️ [${tableName}] Supabase 刪除失敗（已清除隊列）:`,
              queueItem.record_id,
              error
            )
          } else {
            logger.log(`✅ [${tableName}] 刪除成功: ${queueItem.record_id}`)
          }
        } catch (error) {
          logger.error(`❌ [${tableName}] 刪除失敗:`, queueItem.record_id, error)
        }
      }
    } catch (error) {
      logger.error(`❌ [${tableName}] syncPendingDeletes 失敗:`, error)
    }
  }

  /**
   * 檢查是否有待同步項目
   */
  async hasPendingSync(tableName: TableName): Promise<boolean> {
    try {
      const allLocalItems = await localDB.getAll(tableName)

      // 使用型別守衛檢查
      const hasLocalPending = allLocalItems.some(item => {
        if (isTbcEntity(item)) return true
        if (isSyncableEntity(item) && needsSync(item)) return true
        return false
      })

      // 檢查是否有刪除隊列
      const allQueueItems = await localDB.getAll(TABLES.SYNC_QUEUE as any)
      const hasDeletePending = allQueueItems.some(item => {
        if (!isSyncQueueItem(item)) return false
        return item.table_name === tableName && item.operation === 'delete'
      })

      return hasLocalPending || hasDeletePending
    } catch (error) {
      logger.error(`❌ [${tableName}] 檢查待同步項目失敗:`, error)
      return false
    }
  }

  /**
   * 取得待同步項目數量
   */
  async getPendingCount(tableName: TableName): Promise<number> {
    try {
      const allLocalItems = await localDB.getAll(tableName)

      // 使用型別守衛計數
      const localPendingCount = allLocalItems.filter(item => {
        if (isTbcEntity(item)) return true
        if (isSyncableEntity(item) && needsSync(item)) return true
        return false
      }).length

      // 計算刪除隊列數量
      const allQueueItems = await localDB.getAll(TABLES.SYNC_QUEUE as any)
      const deletePendingCount = allQueueItems.filter(item => {
        if (!isSyncQueueItem(item)) return false
        return item.table_name === tableName && item.operation === 'delete'
      }).length

      return localPendingCount + deletePendingCount
    } catch (error) {
      logger.error(`❌ [${tableName}] 取得待同步數量失敗:`, error)
      return 0
    }
  }
}

// 單例模式
export const backgroundSyncService = new BackgroundSyncService()
