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

// 型別定義
import type { StoreState, StoreConfig } from './types'

// 工具
import { AbortManager } from '../utils/abort-manager'
import { logger } from '@/lib/utils/logger'

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

    // 取得所有資料（直接從 Supabase）
    fetchAll: async () => {
      try {
        // 取消前一個請求
        abortManager.abort()

        set({ loading: true, error: null })

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const items = (data || []) as T[]
        set({ items, loading: false })
        return items
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '無法載入資料'
        logger.error(`[${tableName}] fetchAll 失敗:`, error)
        set({ error: errorMessage, loading: false })
        return []
      }
    },

    // 根據 ID 取得單筆
    fetchById: async (id: string) => {
      try {
        set({ loading: true, error: null })

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        set({ loading: false })
        return data as T
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '讀取失敗'
        set({ error: errorMessage, loading: false })
        return null
      }
    },

    // 建立資料
    create: async data => {
      try {
        set({ loading: true, error: null })

        // 生成 code（如果有 prefix）
        const insertData = {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        if (codePrefix && !(data as Record<string, unknown>).code) {
          const count = get().items.length
          ;(insertData as Record<string, unknown>).code = `${codePrefix}${String(count + 1).padStart(6, '0')}`
        }

        const { data: newItem, error } = await supabase
          .from(tableName)
          .insert(insertData)
          .select()
          .single()

        if (error) throw error

        // 樂觀更新 UI
        set(state => ({
          items: [newItem as T, ...state.items],
          loading: false,
        }))

        return newItem as T
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '建立失敗'
        set({ error: errorMessage, loading: false })
        throw error
      }
    },

    update: async (id: string, data: Partial<Omit<T, 'id' | 'created_at'>>) => {
      try {
        set({ loading: true, error: null })

        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        }

        const { data: updatedItem, error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // 樂觀更新 UI
        set(state => ({
          items: state.items.map(item => (item.id === id ? updatedItem as T : item)),
          loading: false,
        }))

        return updatedItem as T
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

        const { error } = await supabase
          .from(tableName)
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
    createMany: async dataArray => {
      const results: T[] = []

      for (const data of dataArray) {
        const newItem = await get().create(data)
        results.push(newItem)
      }

      return results
    },

    // 批次刪除
    deleteMany: async (ids: string[]) => {
      const { error } = await supabase
        .from(tableName)
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
  }))

  // 監聽背景更新完成事件
  if (typeof window !== 'undefined') {
    const registeredKey = `__store_registered_${tableName}`
    if (!(window as unknown as Record<string, boolean>)[registeredKey]) {
      (window as unknown as Record<string, boolean>)[registeredKey] = true

      const handleUpdated = ((event: Event) => {
        const customEvent = event as CustomEvent
        const { items } = customEvent.detail
        store.setState({ items })
      }) as EventListener

      window.addEventListener(`${tableName}:updated`, handleUpdated)
    }
  }

  return store
}
