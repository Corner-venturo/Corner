/**
 * Fetch 操作
 * 負責從 Supabase 讀取資料，並使用 IndexedDB 作為快取層加速載入
 *
 * 架構原則：
 * - Supabase = 唯一的 Source of Truth（資料權威來源）
 * - IndexedDB = 快取層（Cache，可隨時清空）
 * - 無離線編輯功能（斷網時無法新增/修改資料）
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { MergeStrategy } from '../sync/merge-strategy'
import { logger } from '@/lib/utils/logger'
import { getWorkspaceFilterForQuery } from '@/lib/workspace-filter'

/**
 * 取得所有資料（快取優先顯示，Supabase 為權威來源）
 *
 * 流程：
 * 1. 先從 IndexedDB 讀取快取 → 快速顯示（避免空白畫面）
 * 2. 從 Supabase 拉取最新資料 → 確保資料正確性
 * 3. 清空 IndexedDB 舊快取 → 寫入最新資料
 * 4. 如果 Supabase 失敗 → 顯示快取（唯讀模式）
 */
export async function fetchAll<T extends BaseEntity>(
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>,
  controller?: AbortController
): Promise<T[]> {
  const { tableName, enableSupabase } = config

  // 取得 workspace 篩選設定
  const workspaceId = getWorkspaceFilterForQuery(tableName)

  // 篩選函數（用於 IndexedDB 快取資料）
  const applyWorkspaceFilter = (items: T[]): T[] => {
    if (!workspaceId) return items
    return items.filter((item: any) => item.workspace_id === workspaceId)
  }

  try {
    if (enableSupabase && typeof window !== 'undefined') {
      // Step 1: 先從 IndexedDB 讀取快取（快速顯示 UI）
      let cachedItems: T[] = []
      try {
        const allCached = await indexedDB.getAll(3000) // 3 秒超時
        cachedItems = applyWorkspaceFilter(allCached) // 套用篩選
      } catch (error) {
        cachedItems = []
      }

      // Step 2: 從 Supabase 拉取最新資料（權威來源）
      // 注意：Supabase 已經在 adapter 層套用篩選了
      try {
        const latestItems = await supabase.fetchAll(controller?.signal)

        // Step 3: 合併本地待同步資料與雲端資料
        // 說明：保留 _needs_sync: true 的本地資料，避免重新整理時丟失
        const allCachedItems = await indexedDB.getAll()
        const pendingSyncItems = allCachedItems.filter(
          (item: any) => item._needs_sync === true
        )

        // 建立已同步資料的 ID 集合（用於快速查找）
        const syncedIds = new Set(latestItems.map(item => item.id))

        // 合併策略：
        // 1. Supabase 的資料（已同步）
        // 2. 本地待同步的資料（不在 Supabase 中的）
        const mergedItems = [
          ...latestItems,
          ...pendingSyncItems.filter(item => !syncedIds.has(item.id))
        ]

        // Step 4: 更新快取
        await indexedDB.clear()
        await indexedDB.batchPut(mergedItems)

        logger.log(`✅ [${tableName}] 同步完成：Supabase ${latestItems.length} 筆 + 待同步 ${pendingSyncItems.length} 筆`)

        return applyWorkspaceFilter(mergedItems) // ✅ 套用 workspace 篩選後返回
      } catch (supabaseError) {
        // Step 4: Supabase 失敗時，使用快取（唯讀降級模式）
        logger.warn(
          `⚠️ [${tableName}] Supabase 連線失敗，使用快取資料 (${cachedItems.length} 筆)`,
          supabaseError
        )
        return cachedItems
      }
    } else {
      // 從 IndexedDB 讀取（離線模式或未啟用 Supabase）
      const allItems = await indexedDB.getAll()
      return applyWorkspaceFilter(allItems) // 套用篩選
    }
  } catch (error) {
    // 任何錯誤：靜默切換到本地模式
    try {
      const allItems = await indexedDB.getAll()
      return applyWorkspaceFilter(allItems) // 套用篩選
    } catch (localError) {
      logger.error(`❌ [${tableName}] 無法載入資料:`, localError)
      throw new Error('無法載入資料')
    }
  }
}

/**
 * 根據 ID 取得單筆資料
 */
export async function fetchById<T extends BaseEntity>(
  id: string,
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>
): Promise<T | null> {
  const { tableName, enableSupabase } = config

  try {
    // 嘗試從 Supabase 讀取
    if (enableSupabase && typeof window !== 'undefined') {
      try {
        const data = await supabase.getById(id)
        logger.log(`☁️ [${tableName}] Supabase getById:`, id)
        return data
      } catch (supabaseError) {
        // Supabase 失敗（找不到資料或連線錯誤），靜默降級到 IndexedDB
        logger.log(`⚠️ [${tableName}] Supabase 查詢失敗，切換到本地模式`, supabaseError)
      }
    }

    // 從 IndexedDB 讀取（無論是 Supabase 關閉或失敗）
    const item = await indexedDB.getById(id)
    logger.log(`💾 [${tableName}] IndexedDB getById:`, id, item ? '找到' : '未找到')
    return item
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '讀取失敗'
    logger.error(`❌ [${tableName}] fetchById 失敗:`, error)
    throw new Error(errorMessage)
  }
}
