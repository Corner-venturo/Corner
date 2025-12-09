// src/hooks/createCloudHook.ts
// 通用 SWR Hook 工廠函數 - 純雲端架構

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import { canCrossWorkspace, type UserRole } from '@/lib/rbac-config'

// 基礎實體型別（與 @/types/base.types.ts 的 BaseEntity 一致）
interface BaseEntity {
  id: string
  created_at: string | null
  updated_at: string | null
}

/**
 * 取得當前使用者的 workspace_id 和 role
 * 從 localStorage 讀取 auth-store 的值
 */
function getCurrentUserContext(): { workspaceId: string | null; userRole: UserRole | null } {
  if (typeof window === 'undefined') return { workspaceId: null, userRole: null }
  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      const user = parsed?.state?.user
      return {
        workspaceId: user?.workspace_id || null,
        userRole: (user?.role as UserRole) || null,
      }
    }
  } catch {
    // 忽略解析錯誤
  }
  return { workspaceId: null, userRole: null }
}

// Hook 回傳型別
interface CloudHookReturn<T extends BaseEntity> {
  items: T[]
  isLoading: boolean
  isValidating: boolean
  error: Error | undefined
  create: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>
  update: (id: string, updates: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
  fetchAll: () => void
  getById: (id: string) => T | undefined
}

// 需要 workspace 隔離的表格列表
const WORKSPACE_SCOPED_TABLES = [
  'tours',
  'orders',
  'customers',
  'quotes',
  'quote_items',
  'itineraries',
  'payment_requests',
  'payment_request_items',
  'disbursement_orders',
  'receipt_orders',
  'todos',
  'visas',
  'calendar_events',
  'tour_addons',
]

// 建立雲端 Hook 的工廠函數
export function createCloudHook<T extends BaseEntity>(
  tableName: string,
  options?: {
    orderBy?: { column: string; ascending?: boolean }
    select?: string
    workspaceScoped?: boolean // 是否啟用 workspace 隔離（預設根據表格名稱自動判斷）
  }
) {
  // 自動判斷是否需要 workspace 過濾
  const isWorkspaceScoped = options?.workspaceScoped ?? WORKSPACE_SCOPED_TABLES.includes(tableName)

  const SWR_KEY = tableName

  // Supabase fetcher
  async function fetcher(): Promise<T[]> {
    // 使用類型斷言處理動態表格名稱
    let query = supabase.from(tableName as any).select(
      options?.select || '*'
    )

    // 🔒 Workspace 隔離：根據當前使用者過濾資料
    if (isWorkspaceScoped) {
      const { workspaceId, userRole } = getCurrentUserContext()
      console.log(`📊 [${tableName}] 用戶上下文: workspaceId=${workspaceId}, userRole=${userRole}`)

      // Super Admin 可以跨 workspace 查詢，不加過濾
      if (!canCrossWorkspace(userRole) && workspaceId) {
        // 向後相容：同時查詢符合當前 workspace 或 workspace_id 為 NULL 的舊資料
        query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
        console.log(`🔒 [${tableName}] Workspace 隔離：查詢 workspace_id=${workspaceId} 或 NULL（舊資料）`)
      } else if (canCrossWorkspace(userRole)) {
        console.log(`🌐 [${tableName}] Super Admin：跨 workspace 查詢`)
      } else {
        // 沒有 workspace_id 的情況，不加過濾（預設查所有）
        console.log(`⚠️ [${tableName}] 無 workspace_id，不加過濾（查所有資料）`)
      }
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      const errorMessage = typeof error === 'object' && error !== null
        ? (error as { message?: string }).message || JSON.stringify(error)
        : String(error)
      console.error(`[${tableName}] Supabase error:`, error)
      throw new Error(errorMessage)
    }

    console.log(`✅ [${tableName}] 查詢成功，取得 ${data?.length || 0} 筆資料`)
    return (data || []) as unknown as T[]
  }

  // 回傳 Hook 函數
  return function useCloudData(): CloudHookReturn<T> {
    const { data: items = [], error, isLoading, isValidating } = useSWR<T[]>(
      SWR_KEY,
      fetcher,
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
      }
    )

    // 新增
    const create = async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
      const now = new Date().toISOString()

      // 自動注入 workspace_id（如果該表格需要隔離且未提供）
      const dataRecord = data as Record<string, unknown>
      let workspace_id = dataRecord.workspace_id
      if (isWorkspaceScoped && !workspace_id) {
        const { workspaceId } = getCurrentUserContext()
        workspace_id = workspaceId
      }

      const newItem = {
        ...data,
        id: generateUUID(),
        created_at: now,
        updated_at: now,
        ...(isWorkspaceScoped && workspace_id ? { workspace_id } : {}),
      } as T

      // 樂觀更新
      mutate(SWR_KEY, [...items, newItem], false)

      try {
        const { error } = await supabase.from(tableName as any).insert(
          newItem as Record<string, unknown>
        )
        if (error) throw error

        mutate(SWR_KEY)
        return newItem
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 更新
    const update = async (id: string, updates: Partial<T>): Promise<void> => {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // 樂觀更新
      mutate(
        SWR_KEY,
        items.map(item => (item.id === id ? { ...item, ...updatedData } : item)),
        false
      )

      try {
        const { error } = await supabase.from(tableName as any)
          .update(updatedData as Record<string, unknown>)
          .eq('id', id)
        if (error) throw error

        mutate(SWR_KEY)
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 刪除
    const remove = async (id: string): Promise<void> => {
      // 樂觀更新
      mutate(
        SWR_KEY,
        items.filter(item => item.id !== id),
        false
      )

      try {
        const { error } = await supabase.from(tableName as any)
          .delete()
          .eq('id', id)
        if (error) throw error

        mutate(SWR_KEY)
      } catch (err) {
        mutate(SWR_KEY)
        throw err
      }
    }

    // 重新載入
    const fetchAll = () => mutate(SWR_KEY)

    // 依 ID 取得
    const getById = (id: string) => items.find(item => item.id === id)

    return {
      items,
      isLoading,
      isValidating,
      error,
      create,
      update,
      delete: remove,
      fetchAll,
      getById,
    }
  }
}

export default createCloudHook
