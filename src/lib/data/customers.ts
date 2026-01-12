/**
 * Customers 資料存取層 (Data Access Layer)
 *
 * 將所有 Customers 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 *
 * 🔒 安全修復 2026-01-12：所有查詢都會自動過濾 workspace_id
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerAuth } from '@/lib/auth/server-auth'
import type { Customer } from '@/types/customer.types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedCustomersParams {
  page?: number
  limit?: number
  search?: string
  workspaceId?: string  // 可選，若未提供則從 session 取得
}

export interface PaginatedCustomersResult {
  customers: Customer[]
  count: number
}

// ============================================
// 查詢函式
// ============================================

/**
 * 取得分頁客戶列表
 * 🔒 自動過濾 workspace_id
 */
export async function getPaginatedCustomers({
  page = 1,
  limit = 20,
  search,
  workspaceId,
}: GetPaginatedCustomersParams = {}): Promise<PaginatedCustomersResult> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('getPaginatedCustomers: 未登入')
      return { customers: [], count: 0 }
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
    .order('created_at', { ascending: false })

  // 可選搜尋條件
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // 分頁
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) {
    logger.error('Error fetching customers:', error)
    return { customers: [], count: 0 }
  }

  return {
    customers: (data as Customer[]) || [],
    count: count || 0,
  }
}

/**
 * 根據 ID 取得單一客戶
 * 🔒 自動過濾 workspace_id
 */
export async function getCustomerById(id: string, workspaceId?: string): Promise<Customer | null> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('getCustomerById: 未登入')
      return null
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
    .single()

  if (error) {
    logger.error('Error fetching customer:', error)
    return null
  }

  return data as Customer
}

/**
 * 根據護照號碼檢查客戶是否存在
 * 🔒 自動過濾 workspace_id
 */
export async function checkCustomerByPassport(passportNumber: string, workspaceId?: string): Promise<Customer | null> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('checkCustomerByPassport: 未登入')
      return null
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('passport_number', passportNumber)
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
    .maybeSingle()

  if (error) {
    logger.error('Error checking customer by passport:', error)
    return null
  }

  return data as Customer | null
}
