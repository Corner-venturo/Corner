/**
 * 刪除操作模組
 */

import { logger } from '@/lib/utils/logger'
import type { TableName } from '../schemas'
import { clearAllTables } from '../migrations'

/**
 * 刪除單筆資料
 */
export async function deleteRecord(
  db: IDBDatabase,
  tableName: TableName,
  id: string
): Promise<void> {
  try {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite')
      const objectStore = transaction.objectStore(tableName)
      const request = objectStore.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        const error = new Error(`刪除資料失敗 (${tableName}): ${request.error?.message}`)
        logger.error('[LocalDB]', error)
        reject(error)
      }

      transaction.onerror = () => {
        logger.error('transaction 錯誤:', transaction.error)
      }
    })
  } catch (error) {
    logger.error('delete 方法異常:', error)
    throw error
  }
}

/**
 * 批次刪除資料
 */
export async function deleteMany(
  db: IDBDatabase,
  tableName: TableName,
  ids: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)

    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      const error = new Error(`批次刪除失敗 (${tableName}): ${transaction.error?.message}`)
      logger.error('[LocalDB]', error)
      reject(error)
    }

    ids.forEach(id => {
      objectStore.delete(id)
    })
  })
}

/**
 * 清空資料表
 */
export async function clear(db: IDBDatabase, tableName: TableName): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)
    const request = objectStore.clear()

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      const error = new Error(`清空失敗 (${tableName}): ${request.error?.message}`)
      logger.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 清空所有資料表
 */
export async function clearAll(db: IDBDatabase): Promise<void> {
  await clearAllTables(db)
}
