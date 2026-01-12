/**
 * Tours 資料存取層 (Data Access Layer)
 *
 * 將所有 Tours 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 *
 * 🔒 安全修復 2026-01-12：所有查詢都會自動過濾 workspace_id
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getServerAuth } from '@/lib/auth/server-auth'
import type { Tour } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedToursParams {
  page?: number
  limit?: number
  status?: string // 'all' | 'archived' | 'draft' | 'active' | 'pending_close' | etc.
  workspaceId?: string  // 可選，若未提供則從 session 取得
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
 * 🔒 自動過濾 workspace_id
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
  workspaceId,
}: GetPaginatedToursParams = {}): Promise<PaginatedToursResult> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('getPaginatedTours: 未登入')
      return { tours: [], count: 0 }
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('tours')
    .select('*', { count: 'exact' })
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
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
    logger.error('Error fetching tours:', error)
    return { tours: [], count: 0 }
  }

  return {
    tours: (data as Tour[]) || [],
    count: count || 0,
  }
}

/**
 * 根據 ID 取得單一旅遊團
 * 🔒 自動過濾 workspace_id
 */
export async function getTourById(id: string, workspaceId?: string): Promise<Tour | null> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('getTourById: 未登入')
      return null
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
    .single()

  if (error) {
    logger.error('Error fetching tour:', error)
    return null
  }

  return data as Tour
}

/**
 * 取得未結案的旅遊團列表（用於下拉選單）
 * 🔒 自動過濾 workspace_id
 */
export async function getActiveToursForSelect(limit = 100, workspaceId?: string): Promise<Tour[]> {
  // 🔒 取得 workspace_id
  let wsId = workspaceId
  if (!wsId) {
    const auth = await getServerAuth()
    if (!auth.success) {
      logger.error('getActiveToursForSelect: 未登入')
      return []
    }
    wsId = auth.data.workspaceId
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('workspace_id', wsId)  // 🔒 Workspace 過濾
    .neq('closing_status', 'closed')
    .order('departure_date', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Error fetching active tours:', error)
    return []
  }

  return (data as Tour[]) || []
}
