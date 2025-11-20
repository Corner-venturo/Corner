/**
 * IndexedDB 資料庫升級與遷移邏輯
 */

import { logger } from '@/lib/utils/logger'
import { TABLE_SCHEMAS } from './schemas'
import { isSyncableTable as _isSyncableTable } from './sync-schema-helper'

/**
 * 資料庫升級處理器
 * @param db - IDBDatabase 實例
 * @param oldVersion - 舊版本號
 * @param newVersion - 新版本號
 */
export function handleUpgrade(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number | null
): void {
  try {
    // v0 -> v1: 建立所有資料表（包含 regions 和 workspace）
    if (oldVersion === 0) {
      createAllTables(db)
      return // 新資料庫，不需要後續升級
    }

    // v1 -> v2: 地區系統重構（Countries > Regions > Cities）
    if (oldVersion < 2 && (newVersion === null || newVersion >= 2)) {
      upgradeToV2(db)
    }

    // v2 -> v3: 新增供應商管理相關表格
    if (oldVersion < 3 && (newVersion === null || newVersion >= 3)) {
      upgradeToV3(db)
    }

    // v3 -> v4: 新增 receipts 和 linkpay_logs 表格
    if (oldVersion < 4 && (newVersion === null || newVersion >= 4)) {
      upgradeToV4(db)
    }

    // v4 -> v5: 修復缺失的表格
    if (oldVersion < 5 && (newVersion === null || newVersion >= 5)) {
      upgradeToV5(db)
    }

    // v5 -> v6: 緊急修復 - 確保所有表格都存在
    if (oldVersion < 6 && (newVersion === null || newVersion >= 6)) {
      upgradeToV6(db)
    }
  } catch (error) {
    throw error
  }
}

/**
 * 建立所有資料表（v1）
 * 包含：tours, orders, workspace 等所有表格
 */
function createAllTables(db: IDBDatabase): void {
  TABLE_SCHEMAS.forEach(schema => {
    // 如果資料表已存在，跳過（理論上不應該發生）
    if (db.objectStoreNames.contains(schema.name)) {
      return
    }

    // 建立資料表
    const objectStore = db.createObjectStore(schema.name, {
      keyPath: schema.keyPath,
      autoIncrement: schema.autoIncrement,
    })

    // 建立索引
    schema.indexes.forEach(index => {
      objectStore.createIndex(index.name, index.keyPath, {
        unique: index.unique,
      })
    })
  })
}

/**
 * 升級到 v2：新增地區系統表格
 * 只新增缺少的表格，不刪除任何現有資料
 */
function upgradeToV2(db: IDBDatabase): void {
  logger.log('🔄 [IndexedDB] 開始升級到 v2（新增 countries 和 cities 表）')

  // 找到三個表的 schema
  const countriesSchema = TABLE_SCHEMAS.find(s => s.name === 'countries')
  const citiesSchema = TABLE_SCHEMAS.find(s => s.name === 'cities')

  // 1. 建立 countries 表（如果不存在）
  if (countriesSchema && !db.objectStoreNames.contains('countries')) {
    logger.log('📦 建立 countries 表')
    const countriesStore = db.createObjectStore(countriesSchema.name, {
      keyPath: countriesSchema.keyPath,
      autoIncrement: countriesSchema.autoIncrement,
    })
    countriesSchema.indexes.forEach(index => {
      countriesStore.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  } else {
    logger.log('✓ countries 表已存在，跳過')
  }

  // 2. 建立 cities 表（如果不存在）
  if (citiesSchema && !db.objectStoreNames.contains('cities')) {
    logger.log('📦 建立 cities 表')
    const citiesStore = db.createObjectStore(citiesSchema.name, {
      keyPath: citiesSchema.keyPath,
      autoIncrement: citiesSchema.autoIncrement,
    })
    citiesSchema.indexes.forEach(index => {
      citiesStore.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  } else {
    logger.log('✓ cities 表已存在，跳過')
  }

  // 3. regions 表保持不變（不刪除任何資料）
  logger.log('✓ regions 表保持不變')

  logger.log('✅ [IndexedDB] v2 升級完成（所有現有資料保留）')
}

/**
 * 升級到 v3：新增供應商管理相關表格
 * 只新增缺少的表格，不刪除任何現有資料
 */
function upgradeToV3(db: IDBDatabase): void {
  logger.log('🔄 [IndexedDB] 開始升級到 v3（新增 cost_templates 和 supplier_categories 表）')

  // 找到兩個表的 schema
  const costTemplatesSchema = TABLE_SCHEMAS.find(s => s.name === 'cost_templates')
  const supplierCategoriesSchema = TABLE_SCHEMAS.find(s => s.name === 'supplier_categories')

  // 1. 建立 cost_templates 表（如果不存在）
  if (costTemplatesSchema && !db.objectStoreNames.contains('cost_templates')) {
    logger.log('📦 建立 cost_templates 表')
    const costTemplatesStore = db.createObjectStore(costTemplatesSchema.name, {
      keyPath: costTemplatesSchema.keyPath,
      autoIncrement: costTemplatesSchema.autoIncrement,
    })
    costTemplatesSchema.indexes.forEach(index => {
      costTemplatesStore.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  } else {
    logger.log('✓ cost_templates 表已存在，跳過')
  }

  // 2. 建立 supplier_categories 表（如果不存在）
  if (supplierCategoriesSchema && !db.objectStoreNames.contains('supplier_categories')) {
    logger.log('📦 建立 supplier_categories 表')
    const supplierCategoriesStore = db.createObjectStore(supplierCategoriesSchema.name, {
      keyPath: supplierCategoriesSchema.keyPath,
      autoIncrement: supplierCategoriesSchema.autoIncrement,
    })
    supplierCategoriesSchema.indexes.forEach(index => {
      supplierCategoriesStore.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  } else {
    logger.log('✓ supplier_categories 表已存在，跳過')
  }

  logger.log('✅ [IndexedDB] v3 升級完成（所有現有資料保留）')
}

/**
 * 升級到 v4：新增 receipts 和 linkpay_logs 表格
 */
function upgradeToV4(db: IDBDatabase): void {
  logger.log('🔄 [IndexedDB] 開始升級到 v4（新增 receipts 和 linkpay_logs 表）')

  const receiptsSchema = TABLE_SCHEMAS.find(s => s.name === 'receipts')
  const linkpayLogsSchema = TABLE_SCHEMAS.find(s => s.name === 'linkpay_logs')

  if (receiptsSchema && !db.objectStoreNames.contains('receipts')) {
    logger.log('📦 建立 receipts 表')
    const store = db.createObjectStore(receiptsSchema.name, {
      keyPath: receiptsSchema.keyPath,
      autoIncrement: receiptsSchema.autoIncrement,
    })
    receiptsSchema.indexes.forEach(index => {
      store.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  }

  if (linkpayLogsSchema && !db.objectStoreNames.contains('linkpay_logs')) {
    logger.log('📦 建立 linkpay_logs 表')
    const store = db.createObjectStore(linkpayLogsSchema.name, {
      keyPath: linkpayLogsSchema.keyPath,
      autoIncrement: linkpayLogsSchema.autoIncrement,
    })
    linkpayLogsSchema.indexes.forEach(index => {
      store.createIndex(index.name, index.keyPath, { unique: index.unique })
    })
  }

  logger.log('✅ [IndexedDB] v4 升級完成')
}

/**
 * 升級到 v5：修復缺失的表格
 */
function upgradeToV5(db: IDBDatabase): void {
  logger.log('🔄 [IndexedDB] 開始升級到 v5（修復缺失的表格）')

  const missingTables = [
    'channel_members',
    'personal_canvases',
    'rich_documents',
    'attractions',
    'todos', // ⭐ 重要！加入 todos 表
  ]

  missingTables.forEach(tableName => {
    if (!db.objectStoreNames.contains(tableName)) {
      const schema = TABLE_SCHEMAS.find(s => s.name === tableName)
      if (schema) {
        logger.log(`📦 建立 ${tableName} 表`)
        const store = db.createObjectStore(schema.name, {
          keyPath: schema.keyPath,
          autoIncrement: schema.autoIncrement,
        })
        schema.indexes.forEach(index => {
          store.createIndex(index.name, index.keyPath, { unique: index.unique })
        })
      }
    }
  })

  logger.log('✅ [IndexedDB] v5 升級完成')
}

/**
 * 升級到 v6：緊急修復 - 確保所有 schema 中的表格都存在
 */
function upgradeToV6(db: IDBDatabase): void {
  logger.log('🔄 [IndexedDB] 開始升級到 v6（緊急修復 - 確保所有表格存在）')

  let createdCount = 0

  TABLE_SCHEMAS.forEach(schema => {
    if (!db.objectStoreNames.contains(schema.name)) {
      logger.log(`📦 建立缺失的表格: ${schema.name}`)
      const store = db.createObjectStore(schema.name, {
        keyPath: schema.keyPath,
        autoIncrement: schema.autoIncrement,
      })
      schema.indexes.forEach(index => {
        store.createIndex(index.name, index.keyPath, { unique: index.unique })
      })
      createdCount++
    }
  })

  if (createdCount > 0) {
    logger.log(`✅ [IndexedDB] v6 升級完成（新增 ${createdCount} 個表格）`)
  } else {
    logger.log('✅ [IndexedDB] v6 升級完成（所有表格已存在）')
  }
}

/**
 * 清除所有資料表（危險操作，僅供開發測試）
 */
export function clearAllTables(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(Array.from(db.objectStoreNames), 'readwrite')

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => {
      resolve()
    }

    Array.from(db.objectStoreNames).forEach(tableName => {
      const objectStore = transaction.objectStore(tableName)
      objectStore.clear()
    })
  })
}

/**
 * 匯出資料（備份用）
 */
export async function exportData(db: IDBDatabase): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {}

  for (const tableName of Array.from(db.objectStoreNames)) {
    const transaction = db.transaction(tableName, 'readonly')
    const objectStore = transaction.objectStore(tableName)
    const request = objectStore.getAll()

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        data[tableName] = request.result
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  return data
}

/**
 * 匯入資料（還原用）
 */
export async function importData(db: IDBDatabase, data: Record<string, unknown[]>): Promise<void> {
  for (const [tableName, records] of Object.entries(data)) {
    if (!db.objectStoreNames.contains(tableName)) {
      continue
    }

    const transaction = db.transaction(tableName, 'readwrite')
    const objectStore = transaction.objectStore(tableName)

    for (const record of records) {
      objectStore.put(record)
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}
