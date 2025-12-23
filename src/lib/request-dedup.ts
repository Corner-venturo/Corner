/**
 * 請求去重工具
 * 防止同時發送多個相同的請求，共用第一個請求的結果
 */

type PendingRequest<T> = {
  promise: Promise<T>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest<unknown>>()

// 請求過期時間（毫秒）
const REQUEST_TIMEOUT = 30000 // 30 秒

/**
 * 去重執行函數
 * 如果有相同 key 的請求正在進行，返回該請求的 Promise
 * 否則執行新請求
 */
export async function dedup<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now()

  // 清理過期的請求
  for (const [k, v] of pendingRequests.entries()) {
    if (now - v.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(k)
    }
  }

  // 檢查是否有進行中的請求
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending.promise as Promise<T>
  }

  // 建立新請求
  const promise = fn().finally(() => {
    // 請求完成後移除
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, { promise, timestamp: now })

  return promise
}

/**
 * 快取管理器
 * 提供 SWR (stale-while-revalidate) 模式的快取
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

interface SWROptions {
  /** 資料被視為新鮮的時間（毫秒） */
  staleTime?: number
  /** 快取完全過期的時間（毫秒） */
  cacheTime?: number
}

const DEFAULT_STALE_TIME = 60 * 1000 // 1 分鐘
const DEFAULT_CACHE_TIME = 5 * 60 * 1000 // 5 分鐘

/**
 * SWR 模式的資料獲取
 * - 如果資料是新鮮的，直接返回快取
 * - 如果資料過期但在快取時間內，返回快取並背景刷新
 * - 如果完全過期，等待新資料
 */
export async function swrFetch<T>(
  key: string,
  fn: () => Promise<T>,
  options: SWROptions = {}
): Promise<T> {
  const {
    staleTime = DEFAULT_STALE_TIME,
    cacheTime = DEFAULT_CACHE_TIME,
  } = options

  const now = Date.now()
  const cached = cache.get(key) as CacheEntry<T> | undefined

  // 清理過期快取
  for (const [k, v] of cache.entries()) {
    if (now - v.timestamp > cacheTime) {
      cache.delete(k)
    }
  }

  // 如果有快取且在新鮮時間內，直接返回
  if (cached && now - cached.timestamp < staleTime) {
    return cached.data
  }

  // 如果有快取但已過期（但在快取時間內），返回舊資料並背景刷新
  if (cached && now - cached.timestamp < cacheTime) {
    // 背景刷新（不 await）
    dedup(key, async () => {
      const data = await fn()
      cache.set(key, { data, timestamp: Date.now() })
      return data
    }).catch(console.error)

    return cached.data
  }

  // 沒有快取或完全過期，等待新資料
  const data = await dedup(key, fn)
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

/**
 * 清除特定 key 的快取
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
  pendingRequests.delete(key)
}

/**
 * 清除所有以特定前綴開頭的快取
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
  for (const key of pendingRequests.keys()) {
    if (key.startsWith(prefix)) {
      pendingRequests.delete(key)
    }
  }
}

/**
 * 清除所有快取
 */
export function clearAllCache(): void {
  cache.clear()
  pendingRequests.clear()
}
