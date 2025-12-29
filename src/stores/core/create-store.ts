/**
 * Zustand Store 工廠函數（簡化版）
 * 純雲端架構：直接使用 Supabase，不再使用 IndexedDB 快取
 *
 * 架構：
 * - Supabase: 雲端資料庫（唯一的 Source of Truth）
 * - Zustand: UI 狀態管理
 *
 * 注意：此 Store 已改為向後相容用途，新功能請使用 cloud-hooks
 */

import { create } from 'zustand'
import { BaseEntity } from '@/types'
import { TableName } from '@/lib/db/schemas'
import { memoryCache } from '@/lib/cache/memory-cache'
import { supabase } from '@/lib/supabase/client'
import { dynamicFrom, castRows, castRow } from '@/lib/supabase/typed-client'
import { canCrossWorkspace, type UserRole } from '@/lib/rbac-config'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 型別定義
import type { StoreState, StoreConfig, CreateInput, UpdateInput } from './types'

// 工具
import { AbortManager } from '../utils/abort-manager'
import { logger } from '@/lib/utils/logger'

/**
 * 生成 UUID（相容不支援 crypto.randomUUID 的瀏覽器）
 */
function generateUUID(): string {
  // 優先使用原生 crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: 使用 crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    )
  }
  // 最後手段：Math.random（不推薦，但能用）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 取得當前使用者的 workspace_id 和 role
 * 從 localStorage 讀取 auth-store 的值，避免循環依賴
 */
function getCurrentUserContext(): { workspaceId: string | null; userRole: UserRole | null } {
  if (typeof window === 'undefined') return { workspaceId: null, userRole: null }
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      const user = parsed?.state?.user
      // 🔧 修正：User 類型存的是 roles（陣列），不是 role
      // 優先檢查 roles 陣列中是否有 super_admin
      const roles = user?.roles as UserRole[] | undefined
      const userRole = roles?.includes('super_admin')
        ? 'super_admin'
        : (roles?.[0] as UserRole) || null
      return {
        workspaceId: user?.workspace_id || null,
        userRole,
      }
    }
  } catch {
    // 忽略解析錯誤
  }
  return { workspaceId: null, userRole: null }
}

/**
 * 取得當前使用者的 workspace_id（向後相容）
 */
function getCurrentWorkspaceId(): string | null {
  return getCurrentUserContext().workspaceId
}

/**
 * 建立 Store 工廠函數
 *
 * @example
 * // 基本使用
 * const useTourStore = createStore({ tableName: 'tours', codePrefix: 'T' });
 *
 * // 舊版向後相容
 * const useOrderStore = createStore('orders', 'O');
 */
export function createStore<T extends BaseEntity>(
  tableNameOrConfig: TableName | StoreConfig,
  codePrefixParam?: string,
  _enableSupabaseParam = true
) {
  // 支援兩種調用方式：1. 舊版參數 2. 配置物件
  let config: StoreConfig
  if (typeof tableNameOrConfig === 'string') {
    // 舊版調用方式（向後相容）
    config = {
      tableName: tableNameOrConfig,
      codePrefix: codePrefixParam,
      enableSupabase: true,
      fastInsert: true,
    }
  } else {
    // 新版配置物件
    config = {
      ...tableNameOrConfig,
      enableSupabase: true,
      fastInsert: tableNameOrConfig.fastInsert ?? true,
    }
  }

  const { tableName, codePrefix } = config

  // 建立 AbortController 管理器
  const abortManager = new AbortManager()
  let subscription: RealtimeChannel | null = null

  // 建立 Zustand Store
  const store = create<StoreState<T>>()((set, get) => ({
    // 初始狀態
    items: [],
    loading: false,
    error: null,

    // 設定載入狀態
    setLoading: (loading: boolean) => set({ loading }),

    // 設定錯誤
    setError: (error: string | null) => set({ error }),

    // 取得所有資料（直接從 Supabase，含重試機制）
    fetchAll: async () => {
      const MAX_RETRIES = 3
      const RETRY_DELAY = 1000 // 1 秒

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // 取消前一個請求
          abortManager.abort()

          set({ loading: true, error: null })

          // 建立基礎查詢（使用 dynamicFrom 處理動態表名）
          let query = dynamicFrom(tableName)
            .select('*')
            .order('created_at', { ascending: false })

          // 🔒 Workspace 隔離：若啟用 workspaceScoped，自動過濾 workspace_id
          if (config.workspaceScoped) {
            const { workspaceId, userRole } = getCurrentUserContext()

            // Super Admin 可以跨 workspace 查詢，不加過濾
            if (!canCrossWorkspace(userRole) && workspaceId) {
              // 向後相容：同時查詢符合當前 workspace 或 workspace_id 為 NULL 的舊資料
              query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
              logger.log(`🔒 [${tableName}] Workspace 隔離：查詢 workspace_id=${workspaceId} 或 NULL（舊資料）`)
            } else if (canCrossWorkspace(userRole)) {
              logger.log(`🌐 [${tableName}] Super Admin：跨 workspace 查詢`)
            }
          }

          const { data, error } = await query

          if (error) throw error

          const items = castRows<T>(data)
          set({ items, loading: false })
          return items
        } catch (error) {
          const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch'
          const isLastAttempt = attempt === MAX_RETRIES

          // 如果是網路錯誤且還有重試機會，等待後重試
          if (isNetworkError && !isLastAttempt) {
            logger.warn(`[${tableName}] 網路錯誤，${RETRY_DELAY}ms 後重試 (${attempt}/${MAX_RETRIES})`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
            continue
          }

          // 處理各種錯誤格式
          let errorMessage = '無法載入資料'
          if (error instanceof Error) {
            errorMessage = error.message
          } else if (error && typeof error === 'object') {
            const err = error as Record<string, unknown>
            errorMessage = (err.message as string) || (err.error as string) || JSON.stringify(error)
          }
          logger.error(`[${tableName}] fetchAll 失敗:`, errorMessage)
          set({ error: errorMessage, loading: false })
          return []
        }
      }
      return []
    },

    // 根據 ID 取得單筆
    fetchById: async (id: string) => {
      try {
        set({ loading: true, error: null })

        const { data, error } = await dynamicFrom(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        set({ loading: false })
        return castRow<T>(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '讀取失敗'
        set({ error: errorMessage, loading: false })
        return null
      }
    },

    // 建立資料
    create: async (data: CreateInput<T>) => {
      try {
        set({ loading: true, error: null })

        // 生成 UUID（如果未提供）
        const id = (data as Record<string, unknown>).id || generateUUID()

        // 生成 code（如果有 prefix）
        const insertData: Record<string, unknown> = {
          ...data,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // 只有啟用 workspaceScoped 的表才自動注入 workspace_id
        if (config.workspaceScoped) {
          const workspace_id = (data as Record<string, unknown>).workspace_id || getCurrentWorkspaceId()
          if (workspace_id) {
            insertData.workspace_id = workspace_id
          }
        }

        if (codePrefix && !(data as Record<string, unknown>).code) {
          // 生成唯一編號（帶重試機制避免競爭條件）
          const generateUniqueCode = async (): Promise<string> => {
            const maxRetries = 5
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              // 從資料庫查詢最大 code
              const { data: maxCodeResults } = await dynamicFrom(tableName)
                .select('code')
                .like('code', `${codePrefix}%`)
                .order('code', { ascending: false })
                .limit(1)

              let nextNumber = 1
              const codeResults = maxCodeResults as Array<{ code?: string }> | null
              if (codeResults && codeResults.length > 0 && codeResults[0]?.code) {
                const numericPart = codeResults[0].code.replace(codePrefix, '')
                const currentMax = parseInt(numericPart, 10)
                if (!isNaN(currentMax)) {
                  nextNumber = currentMax + 1 + attempt // 加上 attempt 避免重複
                }
              }

              const candidateCode = `${codePrefix}${String(nextNumber).padStart(6, '0')}`

              // 檢查這個 code 是否已存在
              const { data: existing } = await dynamicFrom(tableName)
                .select('id')
                .eq('code', candidateCode)
                .limit(1)

              if (!existing || existing.length === 0) {
                return candidateCode
              }

              // 如果存在，繼續下一次嘗試
              logger.warn(`[${tableName}] Code ${candidateCode} 已存在，重試第 ${attempt + 1} 次`)
            }

            // 最後手段：使用時間戳確保唯一
            const timestamp = Date.now().toString(36).toUpperCase()
            return `${codePrefix}${timestamp}`
          }

          ;(insertData as Record<string, unknown>).code = await generateUniqueCode()
        }

        const { data: newItem, error } = await dynamicFrom(tableName)
          .insert(insertData as Record<string, unknown>)
          .select()
          .single()

        if (error) throw error

        const createdItem = castRow<T>(newItem) as T
        // 樂觀更新 UI
        set(state => ({
          items: [createdItem, ...state.items],
          loading: false,
        }))

        return createdItem
      } catch (error) {
        // 解析錯誤訊息
        let errorMessage = '建立失敗'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (error && typeof error === 'object') {
          const err = error as { message?: string; error?: string; details?: string; code?: string; hint?: string }
          if (err.message) {
            errorMessage = err.message
          } else if (err.details) {
            errorMessage = err.details
          } else if (err.error) {
            errorMessage = err.error
          } else if (err.code) {
            errorMessage = `資料庫錯誤 (${err.code})`
          } else if (Object.keys(error).length === 0) {
            errorMessage = '資料庫操作失敗，請檢查必填欄位或權限設定'
          }
        }

        logger.error(`[${tableName}] create 失敗:`, error)
        set({ error: errorMessage, loading: false })

        // 拋出帶有訊息的 Error，方便上層處理
        throw new Error(errorMessage)
      }
    },

    update: async (id: string, data: UpdateInput<T>) => {
      try {
        set({ loading: true, error: null })

        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        }

        const { data: updatedItem, error } = await dynamicFrom(tableName)
          .update(updateData as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const result = castRow<T>(updatedItem) as T
        // 樂觀更新 UI
        set(state => ({
          items: state.items.map(item => (item.id === id ? result : item)),
          loading: false,
        }))

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新失敗'
        set({ error: errorMessage, loading: false })
        throw error
      }
    },

    // 刪除資料
    delete: async (id: string) => {
      try {
        set({ loading: true, error: null })

        const { error } = await dynamicFrom(tableName)
          .delete()
          .eq('id', id)

        if (error) throw error

        // 樂觀更新 UI
        set(state => ({
          items: state.items.filter(item => item.id !== id),
          loading: false,
        }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '刪除失敗'
        set({ error: errorMessage, loading: false })
        throw error
      }
    },

    // 批次建立
    createMany: async (dataArray: CreateInput<T>[]) => {
      const results: T[] = []

      for (const data of dataArray) {
        const newItem = await get().create(data)
        results.push(newItem)
      }

      return results
    },

    // 批次刪除
    deleteMany: async (ids: string[]) => {
      const { error } = await dynamicFrom(tableName)
        .delete()
        .in('id', ids)

      if (error) throw error

      // 樂觀更新 UI
      set(state => ({
        items: state.items.filter(item => !ids.includes(item.id)),
      }))
    },

    // 根據欄位查詢
    findByField: (field: keyof T, value: unknown) => {
      return get().items.filter(item => item[field] === value)
    },

    // 自訂過濾
    filter: (predicate: (item: T) => boolean) => {
      return get().items.filter(predicate)
    },

    // 計數
    count: () => {
      return get().items.length
    },

    // 清空資料
    clear: async () => {
      set({ items: [], error: null })
      memoryCache.invalidatePattern(`${tableName}:`)
    },

    // 同步待處理資料（純雲端架構，此方法已無作用）
    syncPending: async () => {
      logger.log(`⏭️ [${tableName}] 純雲端模式，無需同步`)
    },

    // 取消進行中的請求
    cancelRequests: () => {
      abortManager.abort()
      set({ loading: false })
      logger.log(`🛑 [${tableName}] 已取消進行中的請求`)
    },

    // ============================================
    // Realtime Subscription
    // ============================================
    subscribe: () => {
      if (subscription) {
        logger.log(`[${tableName}] 已有訂閱，無需重複訂閱`)
        return
      }

      logger.log(`[${tableName}] 建立 Realtime 訂閱...`)
      subscription = supabase
        .channel(`public:${tableName}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            logger.log(`[${tableName}] Realtime event:`, payload)
            const { eventType, new: newRecord, old: oldRecord } = payload

            const { workspaceId: currentWorkspaceId } = getCurrentUserContext()

            switch (eventType) {
              case 'INSERT': {
                const inserted = newRecord as T
                // 🔒 Workspace 隔離
                if (config.workspaceScoped && inserted.workspace_id !== currentWorkspaceId) return
                set(state => ({ items: [inserted, ...state.items] }))
                break
              }
              case 'UPDATE': {
                const updated = newRecord as T
                // 🔒 Workspace 隔離
                if (config.workspaceScoped && updated.workspace_id !== currentWorkspaceId) return
                set(state => ({
                  items: state.items.map(item => (item.id === updated.id ? updated : item)),
                }))
                break
              }
              case 'DELETE': {
                const deleted = oldRecord as Partial<T>
                // 刪除操作，我們只需要 id
                if (!deleted.id) return
                set(state => ({
                  items: state.items.filter(item => item.id !== deleted.id),
                }))
                break
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            logger.log(`✅ [${tableName}] Realtime 訂閱成功！`)
          }
          if (status === 'CHANNEL_ERROR') {
            logger.error(`[${tableName}] Realtime 訂閱錯誤:`, err)
            set({ error: `Realtime 訂閱錯誤: ${err?.message}` })
          }
          if (status === 'TIMED_OUT') {
            logger.warn(`[${tableName}] Realtime 訂閱超時`)
            set({ error: 'Realtime 訂閱超時' })
          }
        })
    },

    unsubscribe: () => {
      if (subscription) {
        logger.log(`[${tableName}] 取消 Realtime 訂閱...`)
        supabase.removeChannel(subscription)
        subscription = null
      }
    },
  }))

  return store
}