/**
 * Orders 資料存取層 (Data Access Layer)
 *
 * 將所有 Orders 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Order } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedOrdersParams {
  page?: number
  limit?: number
  status?: string
  tourId?: string
}

export interface PaginatedOrdersResult {
  orders: Order[]
  count: number
}

// ============================================
// 查詢函式
// ============================================

/**
 * 取得分頁訂單列表
 */
export async function getPaginatedOrders({
  page = 1,
  limit = 15,
  status,
  tourId,
}: GetPaginatedOrdersParams = {}): Promise<PaginatedOrdersResult> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 可選篩選條件
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (tourId) {
    query = query.eq('tour_id', tourId)
  }

  // 分頁
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) {
    logger.error('Error fetching orders:', error)
    return { orders: [], count: 0 }
  }

  return {
    orders: (data as Order[]) || [],
    count: count || 0,
  }
}

/**
 * 根據 ID 取得單一訂單
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error fetching order:', error)
    return null
  }

  return data as Order
}

/**
 * 根據 Tour ID 取得所有訂單
 */
export async function getOrdersByTourId(tourId: string): Promise<Order[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('tour_id', tourId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching orders by tour:', error)
    return []
  }

  return (data as Order[]) || []
}
