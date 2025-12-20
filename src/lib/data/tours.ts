/**
 * Tours 資料存取層 (Data Access Layer)
 *
 * 將所有 Tours 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Tour } from '@/stores/types'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedToursParams {
  page?: number
  limit?: number
  status?: string // 'all' | 'archived' | 'draft' | 'active' | 'pending_close' | etc.
}

export interface PaginatedToursResult {
  tours: Tour[]
  count: number
}

// ============================================
// 查詢函式
// ============================================

/**
 * 取得分頁旅遊團列表
 *
 * 狀態篩選邏輯：
 * - 'all': 所有未結案的旅遊團
 * - 'archived': 已結案的旅遊團
 * - 其他狀態: 未結案且符合指定狀態的旅遊團
 */
export async function getPaginatedTours({
  page = 1,
  limit = 20,
  status = 'all',
}: GetPaginatedToursParams = {}): Promise<PaginatedToursResult> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('tours')
    .select('*', { count: 'exact' })
    .order('departure_date', { ascending: false })

  // 狀態篩選
  if (status === 'archived') {
    // 已封存（已結案）
    query = query.eq('closing_status', 'closed')
  } else if (status !== 'all') {
    // 特定狀態（排除已結案）
    query = query.neq('closing_status', 'closed').eq('status', status)
  } else {
    // 全部（排除已結案）
    query = query.neq('closing_status', 'closed')
  }

  // 分頁
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching tours:', error)
    return { tours: [], count: 0 }
  }

  return {
    tours: (data as Tour[]) || [],
    count: count || 0,
  }
}

/**
 * 根據 ID 取得單一旅遊團
 */
export async function getTourById(id: string): Promise<Tour | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching tour:', error)
    return null
  }

  return data as Tour
}

/**
 * 取得未結案的旅遊團列表（用於下拉選單）
 */
export async function getActiveToursForSelect(limit = 100): Promise<Tour[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .neq('closing_status', 'closed')
    .order('departure_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching active tours:', error)
    return []
  }

  return (data as Tour[]) || []
}
