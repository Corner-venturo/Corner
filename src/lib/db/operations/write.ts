/**
 * 寫入操作模組
 */

import type { TableName } from '../schemas'
import type { WithTimestamps } from '../types'

/**
 * Put 資料（更新或新增）
 * 如果 ID 存在則更新，不存在則新增
 */
export async function put<T extends { id: string }>(
  db: IDBDatabase,
  tableName: TableName,
  data: T
): Promise<T> {
  try {
    // 檢查 tableName 是否有效
    if (!db.objectStoreNames.contains(tableName)) {
      throw new Error(`資料表不存在: ${tableName}`)
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(tableName, 'readwrite')
      const objectStore = transaction.objectStore(tableName)

      // 加入時間戳
      const now = new Date().toISOString()
      const dataWithTimestamps = data as T & WithTimestamps
      const recordWithTimestamp = {
        ...data,
        created_at: dataWithTimestamps.created_at || now,
        updated_at: now,
      } as T

      const request = objectStore.put(recordWithTimestamp)

      request.onsuccess = () => {
        resolve(recordWithTimestamp)
      }

      request.onerror = () => {
        const errorMsg = request.error?.message || request.error?.name || '未知錯誤'
        const error = new Error(`Put 資料失敗 (${tableName}): ${errorMsg}`)
        console.error('[LocalDB] Put 失敗詳情:', {
          tableName,
          error: request.error,
          data: data,
        })
        reject(error)
      }
    })
  } catch (error) {
    console.error('[LocalDB] put 方法錯誤:', error)
    throw error
  }
}

/**
 * 建立單筆資料
 */
export async function create<T extends { id: string }>(
  db: IDBDatabase,
  tableName: TableName,
  data: T
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)

    // 加入時間戳
    const now = new Date().toISOString()
    const dataWithTimestamps = data as T & WithTimestamps
    const recordWithTimestamp = {
      ...data,
      created_at: dataWithTimestamps.created_at || now,
      updated_at: now,
    } as T

    const request = objectStore.add(recordWithTimestamp)

    request.onsuccess = () => {
      resolve(recordWithTimestamp)
    }

    request.onerror = () => {
      const error = new Error(`新增資料失敗 (${tableName}): ${request.error?.message}`)
      console.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 更新單筆資料
 */
export async function update<T extends { id: string }>(
  db: IDBDatabase,
  tableName: TableName,
  id: string,
  data: Partial<T>,
  readFn: (db: IDBDatabase, tableName: TableName, id: string) => Promise<T | null>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // 先讀取現有資料
    const existing = await readFn(db, tableName, id)
    if (!existing) {
      reject(new Error(`資料不存在 (${tableName}): ${id}`))
      return
    }

    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)

    // 合併資料並更新時間戳
    const updated = {
      ...existing,
      ...data,
      id, // 確保 ID 不被覆蓋
      updated_at: new Date().toISOString(),
    }

    const request = objectStore.put(updated)

    request.onsuccess = () => {
      resolve(updated)
    }

    request.onerror = () => {
      const error = new Error(`更新資料失敗 (${tableName}): ${request.error?.message}`)
      console.error('[LocalDB]', error)
      reject(error)
    }
  })
}

/**
 * 批次建立資料
 */
export async function createMany<T extends { id: string }>(
  db: IDBDatabase,
  tableName: TableName,
  dataArray: T[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)
    const now = new Date().toISOString()
    const results: T[] = []

    transaction.oncomplete = () => {
      resolve(results)
    }

    transaction.onerror = () => {
      const error = new Error(`批次新增失敗 (${tableName}): ${transaction.error?.message}`)
      console.error('[LocalDB]', error)
      reject(error)
    }

    dataArray.forEach(data => {
      const dataWithTimestamps = data as T & WithTimestamps
      const recordWithTimestamp = {
        ...data,
        created_at: dataWithTimestamps.created_at || now,
        updated_at: now,
      } as T
      objectStore.add(recordWithTimestamp)
      results.push(recordWithTimestamp)
    })
  })
}

/**
 * 批次更新資料
 */
export async function updateMany<T extends { id: string }>(
  db: IDBDatabase,
  tableName: TableName,
  updates: Array<{ id: string; data: Partial<T> }>,
  updateFn: (
    db: IDBDatabase,
    tableName: TableName,
    id: string,
    data: Partial<T>
  ) => Promise<T>
): Promise<T[]> {
  const results: T[] = []

  for (const { id, data } of updates) {
    const updated = await updateFn(db, tableName, id, data)
    results.push(updated)
  }

  return results
}
