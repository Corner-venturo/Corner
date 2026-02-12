'use client'

/**
 * useToursPaginated - Server-side pagination and filtering for tours
 *
 * Key improvements over useTours-advanced:
 * - Server-side pagination using Supabase .range()
 * - Server-side filtering using Supabase query
 * - Server-side search using .ilike()
 * - Reduces data transfer by 90%+
 */

import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { Tour } from '@/stores/types'
import { generateTourCode as generateTourCodeUtil } from '@/stores/utils/code-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { generateUUID } from '@/lib/utils/uuid'
import type { Database } from '@/lib/supabase/types'
import { logger } from '@/lib/utils/logger'
import { deleteTour as deleteTourEntity } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate } from '@/lib/utils/format-date'

export interface UseToursPaginatedParams {
  page: number
  pageSize: number
  status?: string // 'all' | 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'archived' | '特殊團'
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UseToursPaginatedResult {
  tours: Tour[]
  totalCount: number
  loading: boolean
  error: string | null
  actions: {
    create: (tourData: Omit<Tour, 'id' | 'created_at' | 'updated_at'>) => Promise<Tour>
    update: (id: string, updates: Partial<Tour>) => Promise<Tour>
    delete: (id: string) => Promise<boolean>
    refresh: () => Promise<void>
    generateCode: (cityCode: string, date: Date) => Promise<string>
  }
}

// Build SWR key from params for proper cache invalidation
function buildSwrKey(params: UseToursPaginatedParams): string {
  return `tours-paginated-${JSON.stringify(params)}`
}

export function useToursPaginated(params: UseToursPaginatedParams): UseToursPaginatedResult {
  const { page, pageSize, status, search, sortBy = 'departure_date', sortOrder = 'desc' } = params

  // Auth check - 只用於寫入操作，讀取不需要等待 hydration
  const user = useAuthStore(state => state.user)

  // ✅ 優化：讀取操作不等待 auth hydration，讓 SWR 立即從快取顯示資料
  // RLS 已在資料庫層保護資料，前端不需要重複驗證
  const swrKey = buildSwrKey(params)

  const { data, error, isLoading, mutate: mutateSelf } = useSWR(
    swrKey,
    async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Start building query
      let query = supabase
        .from('tours')
        .select('*', { count: 'exact' })
        .range(from, to) // ✅ Server-side pagination
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // ✅ Server-side status filtering
      if (status && status !== 'all') {
        if (status === 'archived') {
          // Show archived tours
          query = query.eq('archived', true)
        } else if (status === '特殊團') {
          // Show special tours (not archived)
          query = query.eq('status', '特殊團').neq('archived', true)
        } else {
          // Show specific status (not archived, not special)
          query = query
            .eq('status', status)
            .neq('archived', true)
            .neq('status', '特殊團')
        }
      } else {
        // 'all' tab: exclude archived and special tours
        query = query.neq('archived', true).neq('status', '特殊團')
      }

      // ✅ Server-side search
      if (search && search.trim()) {
        const searchTerm = search.trim()
        query = query.or(
          `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }

      const { data: tours, count, error: queryError } = await query

      if (queryError) {
        logger.error('❌ Error fetching paginated tours:', queryError.message)
        throw new Error(queryError.message)
      }

      return {
        tours: (tours || []) as Tour[],
        count: count || 0,
      }
    },
    {
      revalidateOnFocus: false, // Don't refetch on focus (reduces unnecessary requests)
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      keepPreviousData: true, // Keep showing old data while loading new page
    }
  )

  // Invalidate all paginated queries (used after mutations)
  const invalidateAllPaginatedQueries = async () => {
    // Mutate the current query
    await mutateSelf()
    // Also mutate the legacy key for backwards compatibility
    await mutate('tours')
  }

  // Create tour
  const createTour = async (tourData: Omit<Tour, 'id' | 'created_at' | 'updated_at'>): Promise<Tour> => {
    const now = new Date().toISOString()
    const newTour = {
      ...tourData,
      id: generateUUID(),
      created_at: now,
      updated_at: now,
    } as Tour

    try {
      const { error: insertError } = await supabase
        .from('tours')
        .insert(newTour as unknown as Database['public']['Tables']['tours']['Insert'])

      if (insertError) throw insertError

      await invalidateAllPaginatedQueries()
      return newTour
    } catch (err) {
      await invalidateAllPaginatedQueries()
      throw err
    }
  }

  // Update tour
  const updateTour = async (id: string, updates: Partial<Tour>): Promise<Tour> => {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    try {
      const { data: updated, error: updateError } = await supabase
        .from('tours')
        .update(updatedData as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      await invalidateAllPaginatedQueries()
      return updated as Tour
    } catch (err) {
      await invalidateAllPaginatedQueries()
      throw err
    }
  }

  // Delete tour
  const deleteTour = async (id: string): Promise<boolean> => {
    try {
      await deleteTourEntity(id)
      await invalidateAllPaginatedQueries()
      return true
    } catch (err) {
      await invalidateAllPaginatedQueries()
      throw err
    }
  }

  // Refresh
  const refresh = async () => {
    await invalidateAllPaginatedQueries()
  }

  // Generate tour code
  const generateTourCode = async (cityCode: string, date: Date): Promise<string> => {
    const workspaceCode = getCurrentWorkspaceCode()
    if (!workspaceCode) {
      throw new Error('無法取得 workspace code，請重新登入')
    }

    // Get existing tour codes to avoid duplicates
    const { data: existingTours } = await supabase.from('tours').select('code')

    const code = generateTourCodeUtil(
      workspaceCode,
      cityCode.toUpperCase(),
      date.toISOString(),
      existingTours || []
    )

    // Check for duplicates and try next letter
    const exists = (existingTours || []).some(t => t.code === code)
    if (exists) {
      const dateStr = formatDate(date).replace(/-/g, '').slice(2)
      const lastChar = code.slice(-1)
      const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1)
      return `${cityCode}${dateStr}${nextChar}`
    }

    return code
  }

  // Loading state - 簡化：只看 SWR 的 isLoading
  const effectiveLoading = isLoading

  return {
    tours: data?.tours || [],
    totalCount: data?.count || 0,
    loading: effectiveLoading,
    error: error?.message || null,
    actions: {
      create: createTour,
      update: updateTour,
      delete: deleteTour,
      refresh,
      generateCode: generateTourCode,
    },
  }
}

/**
 * Hook for single tour details (with skip pattern)
 * Only fetches when tourId is provided
 */
export function useTourDetailsPaginated(tourId: string | null) {
  const { data: tour, error, isLoading, mutate: mutateTour } = useSWR<Tour | null>(
    tourId ? `tour-detail-${tourId}` : null, // ✅ Skip pattern: null key = no fetch
    async () => {
      if (!tourId) return null

      const { data, error: queryError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single()

      if (queryError) throw queryError
      return data as Tour
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const updateStatus = async (newStatus: Tour['status']) => {
    if (!tourId) return null

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
      .eq('id', tourId)
      .single()

    if (fetchError || !current) throw new Error('無法取得目前狀態')

    if (!VALID_TOUR_TRANSITIONS[current.status]?.includes(newStatus)) {
      throw new Error(`無法從「${current.status}」轉為「${newStatus}」`)
    }

    const { data, error: updateError } = await supabase
      .from('tours')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', tourId)
      .select()
      .single()

    if (updateError) throw updateError

    mutateTour(data as Tour)
    return data as Tour
  }

  return {
    tour: tour || null,
    loading: isLoading,
    error: error?.message || null,
    actions: {
      updateStatus,
      refresh: () => mutateTour(),
    },
  }
}
