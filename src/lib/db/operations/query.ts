/**
 * 查詢操作模組
 */

import { logger } from '@/lib/utils/logger'
import type { TableName } from '../schemas'
import type { FilterCondition } from '../types'
import { compareValues } from '../utils/helpers'
import { getAll } from './read'

/**
 * 過濾查詢
 */
export async function filter<T>(
  db: IDBDatabase,
  tableName: TableName,
  conditions: FilterCondition[]
): Promise<T[]> {
  const allRecords = await getAll<T>(db, tableName)

  return allRecords.filter(record => {
    return conditions.every(condition => {
      const fieldValue = (record as Record<string, unknown>)[condition.field]

      switch (condition.operator) {
        case 'eq':
          return fieldValue === condition.value
        case 'ne':
          return fieldValue !== condition.value
        case 'gt':
          return compareValues(fieldValue, condition.value, 'gt')
        case 'gte':
          return compareValues(fieldValue, condition.value, 'gte')
        case 'lt':
          return compareValues(fieldValue, condition.value, 'lt')
        case 'lte':
          return compareValues(fieldValue, condition.value, 'lte')
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
        default:
          return true
      }
    })
  })
}

/**
 * 計算資料筆數
 */
export async function count(db: IDBDatabase, tableName: TableName): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readonly')
    const objectStore = transaction.objectStore(tableName)
    const request = objectStore.count()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      const error = new Error(`計數失敗 (${tableName}): ${request.error?.message}`)
      logger.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 檢查資料是否存在
 */
export async function exists(
  db: IDBDatabase,
  tableName: TableName,
  id: string,
  readFn: (db: IDBDatabase, tableName: TableName, id: string) => Promise<unknown>
): Promise<boolean> {
  const result = await readFn(db, tableName, id)
  return result !== null
}
