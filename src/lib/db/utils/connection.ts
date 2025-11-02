/**
 * 資料庫連線管理
 */

import { handleUpgrade } from '../migrations'
import { DB_NAME, DB_VERSION } from '../schemas'
import { checkAndHandleVersion } from '../version-manager'

/**
 * 初始化資料庫
 */
export async function initDatabase(
  db: IDBDatabase | null,
  initPromise: Promise<IDBDatabase> | null,
  setDb: (db: IDBDatabase) => void,
  setInitPromise: (promise: Promise<IDBDatabase> | null) => void
): Promise<IDBDatabase> {
  // 🔒 檢查是否在瀏覽器環境
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    const error = new Error('IndexedDB 不可用（非瀏覽器環境）')
    console.warn('[LocalDB]', error.message)
    throw error
  }

  // 如果已經初始化，直接返回
  if (db) {
    return db
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    return initPromise
  }

  // ✨ 檢查版本並處理升級（如有需要）
  try {
    await checkAndHandleVersion()
  } catch (error) {
    console.error('[LocalDB] 版本檢查失敗:', error)
    // 不阻擋初始化，繼續執行
  }

  // 開始初始化
  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    // ✅ 直接執行，不延遲（延遲可能導致競態條件）
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = event => {
        const error = new Error(`無法開啟資料庫: ${request.error?.message || '未知錯誤'}`)
        console.error('[LocalDB] request.onerror 觸發:', error, event)
        setInitPromise(null) // 清除失敗的 Promise
        reject(error)
      }

      request.onsuccess = () => {
        const database = request.result
        setDb(database)
        resolve(database)
      }

      request.onupgradeneeded = event => {
        const database = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        const newVersion = event.newVersion

        try {
          handleUpgrade(database, oldVersion, newVersion)
        } catch (error) {
          console.error('[LocalDB] 升級失敗:', error)
          setInitPromise(null) // 清除失敗的 Promise
          // 注意: 在 onupgradeneeded 中 reject 可能無效
          // 因為還會觸發 onsuccess 或 onerror
          throw error
        }
      }

      request.onblocked = event => {
        console.warn('資料庫被其他連線阻擋', event)
      }
    } catch (error) {
      console.error('[LocalDB] Promise 內部錯誤:', error)
      setInitPromise(null)
      reject(error)
    }
  })

  setInitPromise(promise)
  return promise
}

/**
 * 確保資料庫已初始化
 */
export async function ensureInitialized(
  db: IDBDatabase | null,
  init: () => Promise<IDBDatabase>
): Promise<IDBDatabase> {
  if (!db) {
    await init()
  }

  if (!db) {
    throw new Error('資料庫初始化失敗')
  }

  return db
}
