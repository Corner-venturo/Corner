'use client'

// src/hooks/createCloudHook.ts
// 通用 SWR Hook 工廠函數 - 純雲端架構

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'
import { canCrossWorkspace, type UserRole } from '@/lib/rbac-config'
import type { Database } from '@/lib/supabase/types'

// 從 Database 類型提取所有表格名稱
type TableName = keyof Database['public']['Tables']

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
      // roles 是陣列，優先檢查 super_admin
      const roles = user?.roles as UserRole[] | undefined
      const userRole = roles?.includes('super_admin') ? 'super_admin' : (roles?.[0] || null)
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
// ✅ 軍事級別修復：所有表格都已添加 workspace_id 支援
const WORKSPACE_SCOPED_TABLES = [
  'tours',
  'orders',
  'customers',
  'quotes',
  'quote_items',
  'itineraries', // ✅ 2025-12-10: workspace_id 已添加，RLS 已更新
  'payment_requests',
  'payment_request_items',
  'disbursement_orders',
  'receipt_orders',
  'todos',
  'visas',
  'calendar_events',
  'tour_addons',
  // ✅ 2025-12-29: PNR Enhancement 新增
  'pnr_records',
  'pnr_fare_history',
  'pnr_fare_alerts',
  'pnr_flight_status_history',
  'flight_status_subscriptions',
  'pnr_queue_items',
  'pnr_schedule_changes',
  'pnr_ai_queries',
  // ✅ 2025-12-31: 機場圖片庫
  'airport_images',
  // ✅ 2026-01-04: 客戶群組
  'customer_groups',
]

// 表格對應的 code prefix（用於自動生成編號）
const TABLE_CODE_PREFIX: Record<string, string> = {
  tours: 'T',
  itineraries: 'I',
  orders: 'O',
  customers: 'C',
  quotes: 'Q',
  payment_requests: 'PR',
  disbursement_orders: 'DO',
  receipt_orders: 'RO',
  visas: 'V',
}

// 建立雲端 Hook 的工廠函數
export function createCloudHook<T extends BaseEntity>(
  tableName: TableName,
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
    // tableName 已被限制為有效的表格名稱
    let query = supabase.from(tableName).select(
      options?.select || '*'
    )

    // 🔒 Workspace 隔離：根據當前使用者過濾資料
    if (isWorkspaceScoped) {
      const { workspaceId, userRole } = getCurrentUserContext()

      // Super Admin 可以跨 workspace 查詢，不加過濾
      if (!canCrossWorkspace(userRole) && workspaceId) {
        // 向後相容：同時查詢符合當前 workspace 或 workspace_id 為 NULL 的舊資料
        query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
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
      logger.error(`[${tableName}] Supabase error:`, error)
      throw new Error(errorMessage)
    }

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

      // 自動生成 code（如果該表格需要且未提供）
      const codePrefix = TABLE_CODE_PREFIX[tableName]
      const needsCodeGeneration = codePrefix && !dataRecord.code

      // 使用樂觀鎖重試機制處理 code 生成的競態條件
      // 當 unique constraint 失敗時，重新生成 code 並重試
      const maxInsertRetries = 3
      let lastError: unknown = null

      for (let insertAttempt = 0; insertAttempt < maxInsertRetries; insertAttempt++) {
        let generatedCode: string | undefined

        // 每次重試都重新查詢並生成 code
        if (needsCodeGeneration) {
          // 從資料庫查詢最大 code，確保唯一性
          const { data: maxCodeResults } = await supabase
            .from(tableName)
            .select('code')
            .like('code', `${codePrefix}%`)
            .order('code', { ascending: false })
            .limit(1)

          let nextNumber = 1
          const codeResults = maxCodeResults as Array<{ code?: string }> | null
          if (codeResults && codeResults.length > 0 && codeResults[0]?.code) {
            // 提取數字部分，例如 'C000032' -> 32
            const numericPart = codeResults[0].code.replace(codePrefix, '')
            const currentMax = parseInt(numericPart, 10)
            if (!isNaN(currentMax)) {
              nextNumber = currentMax + 1
            }
          }

          // 加入偏移量避免並發衝突（第二次重試開始）
          if (insertAttempt > 0) {
            nextNumber += insertAttempt
          }

          generatedCode = `${codePrefix}${String(nextNumber).padStart(6, '0')}`
        }

        const newItem = {
          ...data,
          id: generateUUID(),
          created_at: now,
          updated_at: now,
          ...(isWorkspaceScoped && workspace_id ? { workspace_id } : {}),
          ...(generatedCode ? { code: generatedCode } : {}),
        } as T

        // 樂觀更新：使用 functional update 避免 stale closure 問題
        mutate(SWR_KEY, (currentItems: T[] | undefined) => [...(currentItems || []), newItem], false)

        try {
          const { error } = await supabase.from(tableName).insert(newItem)

          if (!error) {
            // 插入成功
            mutate(SWR_KEY)
            return newItem
          }

          // 檢查是否為 unique constraint 錯誤（code 重複）
          const errorCode = (error as { code?: string })?.code
          const errorMessage = (error as { message?: string })?.message || ''
          const isUniqueViolation = errorCode === '23505' ||
            errorMessage.includes('duplicate key') ||
            errorMessage.includes('unique constraint') ||
            errorMessage.includes('violates unique constraint')

          if (isUniqueViolation && needsCodeGeneration && insertAttempt < maxInsertRetries - 1) {
            // unique constraint 錯誤且還有重試次數，回滾樂觀更新並繼續重試
            logger.warn(`[${tableName}] Code 重複，重試第 ${insertAttempt + 1} 次`)
            mutate(SWR_KEY) // 回滾樂觀更新
            lastError = error
            continue
          }

          // 非 unique constraint 錯誤或已用完重試次數，拋出錯誤
          mutate(SWR_KEY)
          throw error
        } catch (err) {
          mutate(SWR_KEY)
          throw err
        }
      }

      // 如果所有重試都失敗，拋出最後的錯誤
      throw lastError || new Error('建立失敗：已達最大重試次數')
    }

    // 更新
    const update = async (id: string, updates: Partial<T>): Promise<void> => {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // 樂觀更新：使用 functional update 避免 stale closure 問題
      mutate(
        SWR_KEY,
        (currentItems: T[] | undefined) => (currentItems || []).map(item => (item.id === id ? { ...item, ...updatedData } : item)),
        false
      )

      try {
        const { error } = await supabase.from(tableName)
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
      // 樂觀更新：使用 functional update 避免 stale closure 問題
      mutate(
        SWR_KEY,
        (currentItems: T[] | undefined) => (currentItems || []).filter(item => item.id !== id),
        false
      )

      try {
        const { error } = await supabase.from(tableName)
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
