/**
 * VENTURO 5.0 - 按需載入 Store 基礎架構
 *
 * 核心概念：
 * - 不預先載入所有資料
 * - 支援分頁載入
 * - 自動整合三層快取
 * - 提供載入狀態追蹤
 */

import { cacheStrategy, type CacheKey } from '@/lib/cache/cache-strategy'
import { localDB, type TableName } from '@/lib/db'
import { supabase } from '@/lib/supabase/client'

interface LazyLoadOptions {
  /** 資料表名稱 */
  table: TableName
  /** 快取 key 前綴 */
  cachePrefix: string
  /** 預設每頁筆數 */
  pageSize?: number
  /** 是否啟用快取 */
  enableCache?: boolean
}

interface LoadState {
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * 建立支援按需載入的 Store 基礎類別
 */
export class LazyStore<T extends { id: string }> {
  private options: Required<LazyLoadOptions>
  private loadStates = new Map<string, LoadState>()

  constructor(options: LazyLoadOptions) {
    this.options = {
      pageSize: 10,
      enableCache: true,
      ...options,
    }
  }

  /**
   * 分頁載入資料
   */
  async fetchPage(page: number = 1, pageSize?: number): Promise<PaginatedData<T>> {
    const actualPageSize = pageSize || this.options.pageSize
    const cacheKey = this.getCacheKey('page', `${page}-${actualPageSize}`)

    // 1. 嘗試從快取讀取
    if (this.options.enableCache) {
      const cached = await cacheStrategy.get<PaginatedData<T>>(cacheKey)
      if (cached) {
        return cached
      }
    }

    // 2. 從資料庫載入
    this.setLoadState(cacheKey, { isLoading: true, error: null, lastUpdated: null })

    try {
      // 優先從 IndexedDB 讀取
      const localData = await this.fetchFromIndexedDB(page, actualPageSize)

      if (localData.data.length > 0) {
        // 有本地資料，先返回
        const result = localData

        // 快取到熱快取（記憶體）
        if (this.options.enableCache) {
          await cacheStrategy.set(cacheKey, result, { level: 'hot' })
        }

        this.setLoadState(cacheKey, {
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        })

        // 背景同步 Supabase（不阻塞）
        this.syncFromSupabase(page, actualPageSize, cacheKey)

        return result
      }

      // 沒有本地資料，從 Supabase 載入
      const supabaseData = await this.fetchFromSupabase(page, actualPageSize)

      // 快取到溫快取（跨頁面）
      if (this.options.enableCache) {
        await cacheStrategy.set(cacheKey, supabaseData, { level: 'warm' })
      }

      this.setLoadState(cacheKey, {
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      })

      return supabaseData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入失敗'

      this.setLoadState(cacheKey, {
        isLoading: false,
        error: errorMessage,
        lastUpdated: null,
      })

      throw error
    }
  }

  /**
   * 載入單筆資料
   */
  async fetchById(id: string): Promise<T | null> {
    const cacheKey = this.getCacheKey('item', id)

    // 1. 嘗試從快取讀取
    if (this.options.enableCache) {
      const cached = await cacheStrategy.get<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    // 2. 從 IndexedDB 讀取
    try {
      const localItem = await localDB.read<T>(this.options.table, id)
      if (localItem) {
        // 快取到熱快取
        if (this.options.enableCache) {
          await cacheStrategy.set(cacheKey, localItem, { level: 'hot' })
        }
        return localItem
      }
    } catch (error) {}

    // 3. 從 Supabase 讀取
    try {
      const { data, error } = await supabase
        .from(this.options.table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // 快取到溫快取
      if (this.options.enableCache && data) {
        await cacheStrategy.set(cacheKey, data, { level: 'warm' })
      }

      return data as T
    } catch (error) {
      return null
    }
  }

  /**
   * 清除快取
   */
  async clearCache(key?: string): Promise<void> {
    if (key) {
      await cacheStrategy.delete(this.getCacheKey('custom', key))
    } else {
      // 清除所有相關快取
      const stats = cacheStrategy.getStats()
      const prefix = this.options.cachePrefix

      for (const key of [...stats.hot.keys, ...stats.warm.keys]) {
        if (key.startsWith(prefix)) {
          await cacheStrategy.delete(key)
        }
      }
    }
  }

  /**
   * 獲取載入狀態
   */
  getLoadState(key: string): LoadState {
    return (
      this.loadStates.get(key) || {
        isLoading: false,
        error: null,
        lastUpdated: null,
      }
    )
  }

  // ==================== 私有方法 ====================

  private getCacheKey(type: string, id: string): CacheKey {
    return `${this.options.cachePrefix}:${type}:${id}`
  }

  private setLoadState(key: string, state: LoadState): void {
    this.loadStates.set(key, state)
  }

  private async fetchFromIndexedDB(page: number, pageSize: number): Promise<PaginatedData<T>> {
    try {
      const allData = await localDB.getAll<T>(this.options.table)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const pageData = allData.slice(start, end)

      return {
        data: pageData,
        total: allData.length,
        page,
        pageSize,
        hasMore: end < allData.length,
      }
    } catch {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      }
    }
  }

  private async fetchFromSupabase(page: number, pageSize: number): Promise<PaginatedData<T>> {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const { data, error, count } = await supabase
      .from(this.options.table)
      .select('*', { count: 'exact' })
      .range(start, end)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      data: (data as T[]) || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > end + 1,
    }
  }

  private async syncFromSupabase(page: number, pageSize: number, cacheKey: string): Promise<void> {
    try {
      const supabaseData = await this.fetchFromSupabase(page, pageSize)

      // 更新快取
      if (this.options.enableCache) {
        await cacheStrategy.set(cacheKey, supabaseData, { level: 'warm' })
      }

      // 同步到 IndexedDB
      for (const item of supabaseData.data) {
        await localDB.create(this.options.table, item)
      }
    } catch (error) {}
  }
}

// 匯出類型
export type { LazyLoadOptions, LoadState, PaginatedData }
