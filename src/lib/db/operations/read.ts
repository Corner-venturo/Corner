/**
 * 讀取操作模組
 */

import type { TableName } from '../schemas'
import type { QueryOptions } from '../types'

/**
 * 讀取單筆資料
 */
export async function read<T>(
  db: IDBDatabase,
  tableName: TableName,
  id: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readonly')
    const objectStore = transaction.objectStore(tableName)
    const request = objectStore.get(id)

    request.onsuccess = () => {
      resolve(request.result || null)
    }

    request.onerror = () => {
      const error = new Error(`讀取資料失敗 (${tableName}): ${request.error?.message}`)
      console.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 取得所有資料
 */
export async function getAll<T>(
  db: IDBDatabase,
  tableName: TableName,
  options?: QueryOptions
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // 檢查資料表是否存在
    if (!db.objectStoreNames.contains(tableName)) {
      reject(new Error(`資料表不存在: ${tableName}`))
      return
    }

    const transaction = db.transaction(tableName, 'readonly')
    const objectStore = transaction.objectStore(tableName)
    const request = objectStore.getAll()

    request.onsuccess = () => {
      let results = request.result

      // 排序
      if (options?.orderBy) {
        results.sort((a, b) => {
          const aVal = a[options.orderBy!]
          const bVal = b[options.orderBy!]
          const order = options.direction === 'desc' ? -1 : 1
          return aVal > bVal ? order : aVal < bVal ? -order : 0
        })
      }

      // 分頁
      if (options?.offset !== undefined || options?.limit !== undefined) {
        const offset = options.offset || 0
        const limit = options.limit || results.length
        results = results.slice(offset, offset + limit)
      }

      resolve(results)
    }

    request.onerror = () => {
      const error = new Error(`查詢失敗 (${tableName}): ${request.error?.message}`)
      console.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 根據索引查詢
 */
export async function findByIndex<T>(
  db: IDBDatabase,
  tableName: TableName,
  indexName: string,
  value: unknown
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readonly')
    const objectStore = transaction.objectStore(tableName)
    const index = objectStore.index(indexName)
    const request = index.getAll(value as IDBValidKey)

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      const error = new Error(
        `索引查詢失敗 (${tableName}.${indexName}): ${request.error?.message}`
      )
      console.error('[LocalDB]', error)
      reject(error)
    }
  })
}
