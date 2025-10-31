/**
 * IndexedDB 適配器
 * 封裝所有 IndexedDB 操作
 */

import type { BaseEntity } from '@/types'
import type { TableName } from '@/lib/db/schemas'
import type { StorageAdapter } from '../core/types'
import { localDB } from '@/lib/db'
import { logger } from '@/lib/utils/logger'

export class IndexedDBAdapter<T extends BaseEntity> implements StorageAdapter<T> {
  constructor(private tableName: TableName) {}

  /**
   * 取得所有資料（帶超時保護）
   */
  async getAll(timeout = 3000): Promise<T[]> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('IndexedDB_TIMEOUT')), timeout)
      )

      const data = (await Promise.race([localDB.getAll(this.tableName), timeoutPromise])) as T[]

      // 過濾軟刪除的項目
      return data.filter(item => !('_deleted' in item && item._deleted))
    } catch (error) {
      if (error instanceof Error && error.message === 'IndexedDB_TIMEOUT') {
        logger.warn(`⏱️ [${this.tableName}] IndexedDB 初始化超時`)
        return []
      }
      throw error
    }
  }

  /**
   * 根據 ID 取得單筆資料
   */
  async getById(id: string): Promise<T | null> {
    const items = await this.getAll()
    return items.find(item => item.id === id) || null
  }

  /**
   * 新增或更新資料
   */
  async put(item: T): Promise<void> {
    await localDB.put(this.tableName, item)
    logger.log(`💾 [${this.tableName}] IndexedDB put:`, item.id)
  }

  /**
   * 更新資料
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    await localDB.update(this.tableName, id, data)
    logger.log(`💾 [${this.tableName}] IndexedDB update:`, id)
  }

  /**
   * 刪除資料
   */
  async delete(id: string): Promise<void> {
    await localDB.delete(this.tableName, id)
    logger.log(`💾 [${this.tableName}] IndexedDB delete:`, id)
  }

  /**
   * 清空所有資料
   */
  async clear(): Promise<void> {
    // IndexedDB 沒有提供 clear 方法，需要逐一刪除
    const items = await this.getAll()
    for (const item of items) {
      await this.delete(item.id)
    }
    logger.log(`💾 [${this.tableName}] IndexedDB cleared`)
  }

  /**
   * 批次寫入（帶超時保護和錯誤重試）
   */
  async batchPut(items: T[], timeout = 5000): Promise<void> {
    if (items.length === 0) {
      logger.log(`💾 [${this.tableName}] 無資料需要寫入`)
      return
    }

    const batchSize = 10
    let successCount = 0
    let failCount = 0
    const failedItems: T[] = []

    logger.log(`💾 [${this.tableName}] 開始批次寫入 ${items.length} 筆資料...`)

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      try {
        await Promise.all(
          batch.map(async item => {
            try {
              await Promise.race([
                this.put(item),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('INDEXEDDB_WRITE_TIMEOUT')), timeout)
                ),
              ])
              successCount++
            } catch (err) {
              failCount++
              failedItems.push(item)
              logger.error(`❌ [${this.tableName}] 寫入失敗 (${item.id}):`, err)
              throw err
            }
          })
        )
      } catch (batchError) {
        // 批次中有錯誤，記錄但繼續處理下一批
        logger.error(
          `❌ [${this.tableName}] 批次 ${i / batchSize + 1} 寫入失敗 (${batch.length} 筆中有錯誤)`
        )
      }
    }

    // 最終報告
    if (failCount > 0) {
      const errorMsg = `IndexedDB 批次寫入部分失敗: 成功 ${successCount} 筆，失敗 ${failCount} 筆`
      logger.error(`❌ [${this.tableName}] ${errorMsg}`)

      // 拋出錯誤，讓外層知道寫入失敗
      const error = new Error(errorMsg)
      ;(error as any).failedItems = failedItems
      ;(error as any).successCount = successCount
      ;(error as any).failCount = failCount
      throw error
    }

    logger.log(`✅ [${this.tableName}] IndexedDB 批次寫入完成 (${successCount} 筆)`)
  }
}
