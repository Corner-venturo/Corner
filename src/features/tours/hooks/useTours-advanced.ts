'use client'

import { formatDate } from '@/lib/utils/format-date'

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { Tour } from '@/stores/types'
import { PageRequest, UseEntityResult } from '@/core/types/common'
import { BaseEntity } from '@/core/types/common'
import { generateTourCode as generateTourCodeUtil } from '@/stores/utils/code-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { generateUUID } from '@/lib/utils/uuid'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/utils/logger'

const TOURS_KEY = 'tours'

// Supabase fetcher
// 注意：此函數只在 SWR key 有效時才會被調用（已通過 auth 檢查）
// 不要在這裡調用 getSession()，它會導致掛起
async function fetchTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .order('departure_date', { ascending: false })

  if (error) {
    logger.error('❌ Error fetching tours:', error.message)
    throw new Error(error.message)
  }

  return (data || []) as Tour[]
}

export function useTours(params?: PageRequest): UseEntityResult<Tour> {
  // ✅ 優化：讀取不等 auth hydration，讓 SWR 立即從快取顯示
  const swrKey = TOURS_KEY

  const { data: allTours = [], error, isLoading } = useSWR<Tour[]>(
    swrKey,
    fetchTours,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  // 根據 params 進行過濾、排序、分頁
  const processedTours = (() => {
    let result = [...allTours]

    // 搜尋過濾
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      result = result.filter(tour =>
        tour.name.toLowerCase().includes(searchLower) ||
        tour.code.toLowerCase().includes(searchLower) ||
        (tour.location || '').toLowerCase().includes(searchLower)
      )
    }

    // 排序
    if (params?.sortBy) {
      const sortField = params.sortBy as keyof Tour
      const sortOrder = params.sortOrder === 'asc' ? 1 : -1
      result.sort((a, b) => {
        const aVal = a[sortField] ?? ''
        const bVal = b[sortField] ?? ''
        if (aVal < bVal) return -1 * sortOrder
        if (aVal > bVal) return 1 * sortOrder
        return 0
      })
    }

    return result
  })()

  // 分頁
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
  const start = (page - 1) * pageSize
  const paginatedTours = processedTours.slice(start, start + pageSize)

  // 新增
  const createTour = async (tourData: Omit<Tour, keyof BaseEntity>): Promise<Tour> => {
    const now = new Date().toISOString()
    const newTour = {
      ...tourData,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    } as Tour

    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(TOURS_KEY, (currentTours: Tour[] | undefined) => [newTour, ...(currentTours || [])], false)

    try {
      // Type assertion needed due to Tour type vs Database Insert type mismatch
      const { error } = await supabase.from('tours').insert(newTour as unknown as Database['public']['Tables']['tours']['Insert'])
      if (error) throw error

      mutate(TOURS_KEY)
      return newTour
    } catch (err) {
      mutate(TOURS_KEY)
      throw err
    }
  }

  // 更新
  const updateTour = async (id: string, updates: Partial<Tour>): Promise<Tour> => {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(TOURS_KEY, (currentTours: Tour[] | undefined) =>
      (currentTours || []).map(tour => tour.id === id ? { ...tour, ...updatedData } : tour),
      false
    )

    try {
      const { data, error } = await supabase
        .from('tours')
        .update(updatedData as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      mutate(TOURS_KEY)
      return data as Tour
    } catch (err) {
      mutate(TOURS_KEY)
      throw err
    }
  }

  // 刪除
  const deleteTour = async (id: string): Promise<boolean> => {
    // 檢查是否有已付款訂單
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('tour_id', id)
      .neq('payment_status', 'unpaid')

    if (paidOrders && paidOrders.length > 0) {
      throw new Error(`此團有 ${paidOrders.length} 筆已付款訂單，無法刪除`)
    }

    // 樂觀更新：使用 functional update 避免 stale closure 問題
    mutate(
      TOURS_KEY,
      (currentTours: Tour[] | undefined) => (currentTours || []).filter(tour => tour.id !== id),
      false
    )

    try {
      const { error } = await supabase.from('tours').delete().eq('id', id)
      if (error) throw error

      mutate(TOURS_KEY)
      return true
    } catch (err) {
      mutate(TOURS_KEY)
      throw err
    }
  }

  // 重新載入
  const refresh = async () => {
    await mutate(TOURS_KEY)
  }

  // Loading state - 簡化
  const effectiveLoading = isLoading

  return {
    data: paginatedTours,
    totalCount: processedTours.length,
    loading: effectiveLoading,
    error: error?.message || null,
    actions: {
      create: createTour,
      update: updateTour,
      delete: deleteTour,
      refresh,
    },
  }
}

// 專門用於單個旅遊團詳情的 hook
export function useTourDetails(tour_id: string) {
  const { data: tour, error, isLoading: loading, mutate: mutateTour } = useSWR<Tour | null>(
    tour_id ? `tour-${tour_id}` : null,
    async () => {
      if (!tour_id) return null
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tour_id)
        .single()

      if (error) throw error
      return data as Tour
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  // 計算財務摘要
  const financials = tour ? {
    total_revenue: (tour.price || 0) * (tour.current_participants || 0),
    total_cost: (tour.price || 0) * (tour.current_participants || 0) * 0.7,
    profit: (tour.price || 0) * (tour.current_participants || 0) * 0.3,
    profitMargin: 30,
  } : null

  const updateTourStatus = async (newStatus: Tour['status']) => {
    if (!tour_id) return null

    // 狀態轉換驗證
    const VALID_TOUR_TRANSITIONS: Record<string, string[]> = {
      'draft': ['published', 'cancelled'],
      'proposed': ['draft', 'cancelled'],
      '提案': ['draft', 'cancelled'],
      'published': ['departed', 'cancelled', 'draft'],
      'departed': ['completed'],
      'completed': ['archived'],
      'cancelled': ['draft'],
      'archived': [],
    }

    const { data: current, error: fetchError } = await supabase
      .from('tours')
      .select('status')
      .eq('id', tour_id)
      .single()

    if (fetchError || !current) throw new Error('無法取得目前狀態')

    if (!current.status || !VALID_TOUR_TRANSITIONS[current.status]?.includes(newStatus)) {
      throw new Error(`無法從「${current.status ?? '未知'}」轉為「${newStatus}」`)
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('tours')
      .update({ status: newStatus, updated_at: now })
      .eq('id', tour_id)
      .select()
      .single()

    if (error) throw error

    mutateTour(data as Tour)
    mutate(TOURS_KEY)
    return data as Tour
  }

  const generateTourCode = async (cityCode: string, date: Date, isSpecial?: boolean) => {
    const workspaceCode = getCurrentWorkspaceCode()
    if (!workspaceCode) {
      throw new Error('無法取得 workspace code，請重新登入')
    }

    // 獲取現有 tours 來避免重複
    const { data: existingTours } = await supabase
      .from('tours')
      .select('code')

    const code = generateTourCodeUtil(
      workspaceCode,
      cityCode.toUpperCase(),
      date.toISOString(),
      existingTours || []
    )

    // 檢查是否重複，嘗試下一個字母
    const exists = (existingTours || []).some(t => t.code === code)
    if (exists) {
      const dateStr = formatDate(date).replace(/-/g, '').slice(2)
      const lastChar = code.slice(-1)
      const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1)
      return `${cityCode}${dateStr}${nextChar}`
    }

    return code
  }

  return {
    tour: tour || null,
    financials,
    loading,
    error: error?.message || null,
    actions: {
      updateStatus: updateTourStatus,
      generateCode: generateTourCode,
      refresh: () => mutateTour(),
    },
  }
}
