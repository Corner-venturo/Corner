/**
 * 快取同步管理器
 * 統一管理所有 Store 的離線/線上同步邏輯
 */

import { logger } from '@/lib/utils/logger'
import { localDB, TableName } from '@/lib/db'
import { supabase } from '@/lib/supabase/client'

export type SyncStrategy = 'server-authority' | 'last-write-wins' | 'local-first'

export interface SyncConfig<T> {
  tableName: TableName
  supabaseTable: string
  strategy: SyncStrategy
  select?: string
  filter?: (item: T) => boolean
  transform?: (item: unknown) => T
}

export interface SyncResult<T> {
  data: T[]
  fromCache: boolean
  synced: boolean
  conflicts: number
}

/**
 * 快取優先載入資料
 *
 * 流程：
 * 1. 立即從 IndexedDB 載入（快速顯示）
 * 2. 背景同步 Supabase（如果線上）
 * 3. 合併資料並解決衝突
 * 4. 更新本地快取和 UI
 */
export async function syncData<T extends { id: string; updated_at?: string }>(
  config: SyncConfig<T>
): Promise<SyncResult<T>> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  // 📍 步驟 1：立即從本地載入
  let cachedData: T[] = []
  try {
    const raw = await localDB.getAll<T>(config.tableName)
    cachedData = config.filter ? raw.filter(config.filter) : raw
  } catch (error) {
    logger.warn(`[SyncManager] 本地載入失敗 (${config.tableName}):`, error)
  }

  // 如果離線，直接返回快取
  if (!isOnline || !supabaseEnabled) {
    return {
      data: cachedData,
      fromCache: true,
      synced: false,
      conflicts: 0,
    }
  }

  // 📍 步驟 2：背景同步遠端資料
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = (supabase as any).from(config.supabaseTable).select(config.select || '*')

    const { data: remoteData, error } = await query

    if (error) throw error

    let transformed = remoteData || []
    if (config.transform) {
      transformed = transformed.map(config.transform)
    }

    // 📍 步驟 3：合併資料
    const { merged, conflicts } = mergeData(cachedData, transformed as T[], config.strategy)

    // 📍 步驟 4：更新本地快取
    for (const item of merged) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await localDB.put(config.tableName as any, item)
    }

    return {
      data: merged,
      fromCache: false,
      synced: true,
      conflicts,
    }
  } catch (error) {
    logger.error(`[SyncManager] 遠端同步失敗 (${config.tableName}):`, error)

    // 同步失敗，返回快取
    return {
      data: cachedData,
      fromCache: true,
      synced: false,
      conflicts: 0,
    }
  }
}

/**
 * 合併本地和遠端資料
 */
function mergeData<T extends { id: string; updated_at?: string }>(
  local: T[],
  remote: T[],
  strategy: SyncStrategy
): { merged: T[]; conflicts: number } {
  let conflicts = 0

  switch (strategy) {
    case 'server-authority':
      // 伺服器資料為準（適合多人協作）
      return { merged: remote, conflicts: 0 }

    case 'last-write-wins': {
      // 最後寫入勝出（根據 updated_at）
      const merged = new Map<string, T>()

      // 先加入遠端
      remote.forEach(item => merged.set(item.id, item))

      // 處理本地
      local.forEach(localItem => {
        const remoteItem = merged.get(localItem.id)

        if (!remoteItem) {
          // 本地新增的項目
          merged.set(localItem.id, localItem)
        } else if (localItem.updated_at && remoteItem.updated_at) {
          // 比較時間戳
          const localTime = new Date(localItem.updated_at).getTime()
          const remoteTime = new Date(remoteItem.updated_at).getTime()

          if (localTime > remoteTime) {
            merged.set(localItem.id, localItem)
            conflicts++
          }
        }
      })

      return { merged: Array.from(merged.values()), conflicts }
    }

    case 'local-first':
      // 本地優先（適合個人設定）
      const localIds = new Set(local.map(item => item.id))
      const remoteOnly = remote.filter(item => !localIds.has(item.id))
      return { merged: [...local, ...remoteOnly], conflicts: 0 }

    default:
      return { merged: remote, conflicts: 0 }
  }
}

/**
 * 快速本地載入（不同步遠端）
 */
export async function loadLocal<T>(
  tableName: TableName,
  filter?: (item: T) => boolean
): Promise<T[]> {
  try {
    const data = await localDB.getAll<T>(tableName)
    return filter ? data.filter(filter) : data
  } catch (error) {
    logger.error(`[SyncManager] 本地載入失敗 (${tableName}):`, error)
    return []
  }
}

/**
 * 僅上傳到遠端（不合併）
 */
export async function pushToRemote<T extends { id: string }>(
  supabaseTable: string,
  data: T
): Promise<{ success: boolean; error?: Error }> {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine
  const supabaseEnabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true'

  if (!isOnline || !supabaseEnabled) {
    return { success: false, error: new Error('離線或 Supabase 未啟用') }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(supabaseTable).upsert(data)

    if (error) throw error

    return { success: true }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
