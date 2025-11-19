/**
 * Sync Helper
 * 統一的 Supabase + IndexedDB 同步工具
 * 避免在各 store 重複相同的同步邏輯
 */

import { supabase } from '@/lib/supabase/client'
import { localDB } from '@/lib/db'
import { logger } from '@/lib/utils/logger'

export interface SyncOptions<T> {
  tableName: string
  filter?: {
    field: string
    value: unknown
  }
  orderBy?: {
    field: string
    ascending?: boolean
  }
  select?: string
}

export interface SyncResult<T> {
  cached: T[]
  fresh: T[] | null
  error: Error | null
}

/**
 * 載入資料並同步
 * 1. 先從 IndexedDB 快速載入（快取優先）
 * 2. 背景從 Supabase 同步最新資料
 */
export async function loadWithSync<T extends { id: string }>(
  options: SyncOptions<T>
): Promise<SyncResult<T>> {
  const { tableName, filter, orderBy, select = '*' } = options
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  try {
    // 1. 從 IndexedDB 載入 (快速)
    let cached = (await localDB.getAll(tableName as any)) as T[]

    // 套用過濾條件
    if (filter) {
      cached = cached.filter(item => {
        const value = item[filter.field as keyof T]
        return value === filter.value
      })
    }

    // 2. 背景同步 (如果在線上且啟用 Supabase)
    if (isOnline && supabaseEnabled) {
      try {
        // Dynamic table name - using TableName type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = supabase.from(tableName as any).select(select)

        // 套用過濾
        if (filter) {
          query = query.eq(filter.field, filter.value)
        }

        // 套用排序
        if (orderBy) {
          query = query.order(orderBy.field, {
            ascending: orderBy.ascending ?? true,
          })
        }

        const { data, error } = await query

        if (error) {
          logger.warn(`Supabase sync failed for ${tableName}:`, error)
          return { cached, fresh: null, error }
        }

        // 更新 IndexedDB
        if (data) {
          await Promise.all(data.map((item: T) => localDB.put(tableName as any, item)))
        }

        return { cached, fresh: (data as T[]) || [], error: null }
      } catch (syncError) {
        logger.error(`Sync error for ${tableName}:`, syncError)
        return {
          cached,
          fresh: null,
          error: syncError instanceof Error ? syncError : new Error(String(syncError)),
        }
      }
    }

    // 離線或未啟用 Supabase - 只返回快取
    return { cached, fresh: null, error: null }
  } catch (error) {
    logger.error(`Load error for ${tableName}:`, error)
    return {
      cached: [],
      fresh: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * 建立資料 (雙向同步)
 */
export async function createWithSync<T extends { id: string }>(
  tableName: string,
  data: T
): Promise<{ data: T | null; error: Error | null }> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  try {
    // 1. 先寫入 IndexedDB (本地優先)
    await localDB.put(tableName as any, data)

    // 2. 同步到 Supabase (如果在線上)
    if (isOnline && supabaseEnabled) {
      // Dynamic table name - using TableName type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).insert(data)

      if (error) {
        logger.warn(`Supabase create failed for ${tableName}:`, error)
        // 本地已寫入，標記為待同步
        return { data, error }
      }
    }

    return { data, error: null }
  } catch (error) {
    logger.error(`Create error for ${tableName}:`, error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * 更新資料 (雙向同步)
 */
export async function updateWithSync<T extends { id: string }>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<{ data: T | null; error: Error | null }> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  try {
    // 1. 從 IndexedDB 取得當前資料
    const items = (await localDB.getAll(tableName as any)) as T[]
    const current = items.find((item) => item.id === id)
    if (!current) {
      return { data: null, error: new Error('Item not found') }
    }

    const updated = { ...current, ...updates } as T

    // 2. 更新 IndexedDB
    await localDB.put(tableName as any, updated)

    // 3. 同步到 Supabase (如果在線上)
    if (isOnline && supabaseEnabled) {
      // Dynamic table name - using TableName type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).update(updates).eq('id', id)

      if (error) {
        logger.warn(`Supabase update failed for ${tableName}:`, error)
        return { data: updated, error }
      }
    }

    return { data: updated, error: null }
  } catch (error) {
    logger.error(`Update error for ${tableName}:`, error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * 刪除資料 (雙向同步)
 */
export async function deleteWithSync(
  tableName: string,
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  try {
    // 1. 從 IndexedDB 刪除
    await localDB.delete(tableName as any, id)

    // 2. 從 Supabase 刪除 (如果在線上)
    if (isOnline && supabaseEnabled) {
      // Dynamic table name - using TableName type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName as any).delete().eq('id', id)

      if (error) {
        logger.warn(`Supabase delete failed for ${tableName}:`, error)
        return { success: true, error } // 本地已刪除
      }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error(`Delete error for ${tableName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

/**
 * 批次更新 (優化版本)
 */
export async function batchUpdateWithSync<T extends { id: string }>(
  tableName: string,
  updates: Array<{ id: string; data: Partial<T> }>
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // 1. 批次更新 IndexedDB
    await Promise.all(
      updates.map(async ({ id, data }) => {
        const items = (await localDB.getAll(tableName as any)) as T[]
        const current = items.find((item) => item.id === id)
        if (current) {
          await localDB.put(tableName as any, { ...current, ...data })
        }
      })
    )

    // 2. 批次更新 Supabase (如果需要)
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine
    const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

    if (isOnline && supabaseEnabled) {
      // Supabase 不支援真正的批次更新，但可以用 Promise.all
      // Dynamic table name - using TableName type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.all(
        updates.map(({ id, data }) => supabase.from(tableName as any).update(data).eq('id', id))
      )
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error(`Batch update error for ${tableName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}
