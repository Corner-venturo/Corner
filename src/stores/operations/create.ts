/**
 * Create 操作（FastInsert 策略：立即更新 UI，背景同步 Supabase）
 *
 * 流程：
 * 1. 立即寫入 IndexedDB（快取）→ 樂觀更新
 * 2. 立即更新 UI（不等待 Supabase）
 * 3. 背景寫入 Supabase → 如果失敗則回滾
 */

import type { BaseEntity } from '@/types'
import type { StoreConfig, CreateInput } from '../core/types'
import { IndexedDBAdapter } from '../adapters/indexeddb-adapter'
import { SupabaseAdapter } from '../adapters/supabase-adapter'
import { SyncCoordinator } from '../sync/coordinator'
import { generateCode } from '../utils/code-generator'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'

/**
 * Lazy get workspace code to avoid circular dependency
 * 延遲取得 workspace code，避免在模組載入時觸發循環依賴
 */
async function getWorkspaceCodeLazy(): Promise<string | null> {
  try {
    // 方法 1：從 workspace-helpers 取得（如果 store 已載入）
    const { getCurrentWorkspaceCode } = require('@/lib/workspace-helpers')
    const codeFromStore = getCurrentWorkspaceCode()
    if (codeFromStore) {
      return codeFromStore
    }

    // 方法 2：直接從 IndexedDB 查詢（fallback）
    logger.log('📦 Workspace store 未載入，從 IndexedDB 查詢...')
    const { useAuthStore } = require('@/stores/auth-store')
    const user = useAuthStore.getState().user
    const workspaceId = user?.workspace_id

    if (!workspaceId) {
      logger.warn('⚠️ 無法取得 workspace_id')
      return null
    }

    const { openDB } = await import('idb')
    const db = await openDB('VenturoOfflineDB')
    const tx = db.transaction('workspaces', 'readonly')
    const store = tx.objectStore('workspaces')
    const workspace = await store.get(workspaceId)

    if (workspace?.code) {
      logger.log('✅ 從 IndexedDB 取得 workspace code:', workspace.code)
      return workspace.code
    }

    logger.warn('⚠️ IndexedDB 中找不到 workspace')
    return null
  } catch (error) {
    logger.warn('⚠️ 無法取得 workspace code，使用預設編號', error)
    return null
  }
}

/**
 * Lazy get workspace ID to avoid circular dependency
 * 延遲取得 workspace ID，避免在模組載入時觸發循環依賴
 */
function getWorkspaceIdLazy(): string | null {
  try {
    // 動態 require auth-store 避免頂層循環依賴
    const { useAuthStore } = require('@/stores/auth-store')
    const user = useAuthStore.getState().user
    const workspaceId = user?.workspace_id || null

    if (!workspaceId) {
      logger.warn('⚠️ 無法取得 workspace ID', {
        hasUser: !!user,
        userId: user?.id,
        userWorkspaceId: user?.workspace_id,
      })
    } else {
      logger.log('✅ 取得 workspace ID:', workspaceId)
    }

    return workspaceId
  } catch (error) {
    logger.warn('⚠️ 取得 workspace ID 時發生錯誤:', error)
    return null
  }
}

/**
 * 建立資料（簡化版：直接新增）
 */
export async function create<T extends BaseEntity>(
  data: CreateInput<T>,
  existingItems: T[],
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T> {
  const { tableName, codePrefix, enableSupabase } = config

  try {
    // 生成 ID 和時間戳記
    const id = generateUUID()
    const now = new Date().toISOString()

    // 取得 workspace_id（如果資料中沒有提供）
    const workspaceId = getWorkspaceIdLazy()

    // 某些表格不需要 workspace_id（例如：子項目表格，已透過外鍵關聯）
    const tablesWithoutWorkspaceId = [
      'quote_items',
      'order_members',
      'tour_participants',
      'itinerary_days',
      'itinerary_activities',
    ]
    const shouldAddWorkspaceId = !tablesWithoutWorkspaceId.includes(tableName)

    // 如果有 codePrefix，生成編號
    let recordData = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
      // 自動填入 workspace_id（如果資料中沒有提供且能取得且表格需要）
      ...(shouldAddWorkspaceId &&
      workspaceId &&
      !(data as Record<string, unknown>).workspace_id
        ? { workspace_id: workspaceId }
        : {}),
    } as T

    if (codePrefix) {
      const existingCode = (data as Record<string, unknown>).code
      if (!existingCode || (typeof existingCode === 'string' && existingCode.trim() === '')) {
        // 延遲取得 workspace code（避免循環依賴）
        const workspaceCode = await getWorkspaceCodeLazy()
        if (workspaceCode) {
          // 傳遞 quote_type 給 generateCode（用於區分快速報價單和標準報價單）
          const quoteType = (data as Record<string, unknown>).quote_type as string | undefined
          const code = generateCode(
            workspaceCode,
            { prefix: codePrefix, quoteType } as any,
            existingItems
          )
          recordData = { ...recordData, code } as T
        } else {
          // 沒有 workspace code，使用傳統編號（無前綴）
          const code = generateCode('', { prefix: codePrefix }, existingItems)
          recordData = { ...recordData, code } as T
        }
      }
    }

    // ✅ 步驟 1：寫入 IndexedDB（本地快取）⚡ FastIn
    await indexedDB.put(recordData)

    // ✅ 步驟 2：背景同步到 Supabase（不阻塞 UI）
    if (enableSupabase && typeof window !== 'undefined') {
      // 清理資料：將空字串的時間欄位轉為 null（PostgreSQL 不接受空字串）
      const cleanedData = { ...recordData } as Record<string, unknown>
      Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key]
        // 時間相關欄位：空字串轉 null
        if ((key.endsWith('_at') || key.endsWith('_date') || key === 'deadline') && value === '') {
          cleanedData[key] = null
        }
      })

      // 使用 put (upsert) 而非 insert，避免主鍵衝突
      supabase.put(cleanedData as T).catch(error => {
        logger.error(`❌ [${tableName}] Supabase 背景同步失敗（資料僅存於本地）:`, {
          error,
          data: cleanedData,
          message: '重新整理頁面後此資料可能消失！'
        })

        // 在開發環境顯示警告
        if (process.env.NODE_ENV === 'development') {
          console.error(`
🚨 Supabase 同步失敗警告 🚨
表格: ${tableName}
錯誤: ${error?.message || error}
資料 ID: ${cleanedData.id}

⚠️ 此資料僅儲存在本地 IndexedDB，重新整理頁面後可能消失！
          `)
        }
      })
    }

    return recordData
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '建立失敗'
    logger.error(`❌ [${tableName}] 新增失敗:`, error)
    throw new Error(errorMessage)
  }
}

/**
 * 批次建立資料
 */
export async function createMany<T extends BaseEntity>(
  dataArray: CreateInput<T>[],
  existingItems: T[],
  config: StoreConfig,
  indexedDB: IndexedDBAdapter<T>,
  supabase: SupabaseAdapter<T>,
  sync: SyncCoordinator<T>
): Promise<T[]> {
  const results: T[] = []

  for (const data of dataArray) {
    const created = await create(data, existingItems, config, indexedDB, supabase, sync)
    results.push(created)
  }

  logger.log(`✅ [${config.tableName}] createMany: 已建立 ${results.length} 筆`)

  return results
}
