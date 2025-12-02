'use client'

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { Tour } from '@/stores/types'
import { PageRequest, UseEntityResult } from '@/core/types/common'
import { BaseEntity } from '@/core/types/common'
import { generateTourCode as generateTourCodeUtil } from '@/stores/utils/code-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'

const TOURS_KEY = 'tours'

// Supabase fetcher
async function fetchTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .order('departure_date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as Tour[]
}

export function useTours(params?: PageRequest): UseEntityResult<Tour> {
  const { data: allTours = [], error, isLoading } = useSWR<Tour[]>(
    TOURS_KEY,
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
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    } as Tour

    // 樂觀更新
    mutate(TOURS_KEY, [newTour, ...allTours], false)

    try {
      const { error } = await supabase.from('tours').insert(newTour)
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

    // 樂觀更新
    const optimisticTours = allTours.map(tour =>
      tour.id === id ? { ...tour, ...updatedData } : tour
    )
    mutate(TOURS_KEY, optimisticTours, false)

    try {
      const { data, error } = await supabase
        .from('tours')
        .update(updatedData)
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
    // 樂觀更新
    mutate(
      TOURS_KEY,
      allTours.filter(tour => tour.id !== id),
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

  return {
    data: paginatedTours,
    totalCount: processedTours.length,
    loading: isLoading,
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
      throw new Error('無法取得 workspace code')
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

    // 檢查是否重複
    const exists = (existingTours || []).some(t => t.code === code)
    if (exists) {
      const timestamp = Date.now().toString().slice(-2)
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '').slice(2)
      return `${workspaceCode}-${cityCode}${dateStr}${timestamp}`
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
