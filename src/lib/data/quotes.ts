/**
 * Quotes 資料存取層 (Data Access Layer)
 *
 * 將所有 Quotes 相關的 Supabase 查詢封裝在此，
 * 實現 UI 與資料邏輯的徹底分離。
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Quote, Tour } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 型別定義
// ============================================

export interface GetPaginatedQuotesParams {
  page?: number
  limit?: number
  status?: string
}

export interface PaginatedQuotesResult {
  quotes: Quote[]
  count: number
}

export interface QuotesPageData {
  quotes: Quote[]
  tours: Tour[]
  count: number
}

// ============================================
// 查詢函式
// ============================================

/**
 * 取得分頁報價單列表
 */
export async function getPaginatedQuotes({
  page = 1,
  limit = 20,
  status,
}: GetPaginatedQuotesParams = {}): Promise<PaginatedQuotesResult> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('quotes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 狀態篩選
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // 分頁
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) {
    logger.error('Error fetching quotes:', error)
    return { quotes: [], count: 0 }
  }

  return {
    quotes: (data as Quote[]) || [],
    count: count || 0,
  }
}

/**
 * 取得報價單頁面所需的所有資料（包含關聯的 Tours）
 */
export async function getQuotesPageData({
  page = 1,
  limit = 20,
  status,
}: GetPaginatedQuotesParams = {}): Promise<QuotesPageData> {
  const supabase = await createSupabaseServerClient()

  // 並行查詢報價單和旅遊團
  const [quotesResult, toursResult] = await Promise.all([
    // 報價單查詢
    (async () => {
      let query = supabase
        .from('quotes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      query = query.range((page - 1) * limit, page * limit - 1)

      return query
    })(),

    // 旅遊團查詢（限制 100 筆未結案的）
    supabase
      .from('tours')
      .select('*')
      .neq('closing_status', 'closed')
      .order('departure_date', { ascending: false })
      .limit(100),
  ])

  if (quotesResult.error) {
    logger.error('Error fetching quotes:', quotesResult.error)
  }

  if (toursResult.error) {
    logger.error('Error fetching tours:', toursResult.error)
  }

  return {
    quotes: (quotesResult.data as Quote[]) || [],
    tours: (toursResult.data as Tour[]) || [],
    count: quotesResult.count || 0,
  }
}

/**
 * 根據 ID 取得單一報價單
 */
export async function getQuoteById(id: string): Promise<Quote | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Error fetching quote:', error)
    return null
  }

  return data as Quote
}
