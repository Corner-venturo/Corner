/**
 * Customers 資料存取層 (Data Access Layer)
 *
 * 將所有 Customers 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Customer } from '@/types/customer.types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedCustomersParams {
  page?: number
  limit?: number
  search?: string
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
 */
export async function getPaginatedCustomers({
  page = 1,
  limit = 20,
  search,
}: GetPaginatedCustomersParams = {}): Promise<PaginatedCustomersResult> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
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
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error fetching customer:', error)
    return null
  }

  return data as Customer
}

/**
 * 根據護照號碼檢查客戶是否存在
 */
export async function checkCustomerByPassport(passportNumber: string): Promise<Customer | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('passport_number', passportNumber)
    .maybeSingle()

  if (error) {
    logger.error('Error checking customer by passport:', error)
    return null
  }

  return data as Customer | null
}
