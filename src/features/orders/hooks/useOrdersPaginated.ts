'use client'

/**
 * useOrdersPaginated - Server-side pagination and filtering for orders
 *
 * Key improvements over useOrdersListSlim:
 * - Server-side pagination using Supabase .range()
 * - Server-side filtering using Supabase query
 * - Server-side search using .ilike()
 * - Reduces data transfer by 90%+
 */

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { Order } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// Fields needed for order list display
const ORDERS_LIST_FIELDS = [
  'id',
  'order_number',
  'tour_id',
  'tour_name',
  'contact_person',
  'sales_person',
  'assistant',
  'payment_status',
  'paid_amount',
  'remaining_amount',
  'member_count',
  'code',
  'created_at',
].join(',')

export interface UseOrdersPaginatedParams {
  page: number
  pageSize: number
  status?: string // 'all' | 'unpaid' | 'partial' | 'paid' | 'visa-only' | 'sim-only'
  tourId?: string // Filter by specific tour
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UseOrdersPaginatedResult {
  orders: Order[]
  totalCount: number
  loading: boolean
  error: string | null
  actions: {
    refresh: () => Promise<void>
  }
}

// Build SWR key from params
function buildSwrKey(params: UseOrdersPaginatedParams): string {
  return `orders-paginated-${JSON.stringify(params)}`
}

export function useOrdersPaginated(params: UseOrdersPaginatedParams): UseOrdersPaginatedResult {
  const { page, pageSize, status, tourId, search, sortBy = 'created_at', sortOrder = 'desc' } = params

  // ✅ 優化：讀取不等 auth hydration，讓 SWR 立即從快取顯示
  const swrKey = buildSwrKey(params)

  const { data, error, isLoading, mutate: mutateSelf } = useSWR(
    swrKey,
    async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // Start building query
      let query = supabase
        .from('orders')
        .select(ORDERS_LIST_FIELDS, { count: 'exact' })
        .range(from, to) // ✅ Server-side pagination
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // ✅ Server-side status filtering
      if (status && status !== 'all') {
        if (status === 'visa-only') {
          // Filter for visa-related orders
          query = query.ilike('tour_name', '%簽證專用團%')
        } else if (status === 'sim-only') {
          // Filter for SIM card related orders
          query = query.ilike('tour_name', '%網卡專用團%')
        } else {
          // Filter by payment status (exclude special tours)
          query = query
            .eq('payment_status', status)
            .not('tour_name', 'ilike', '%簽證專用團%')
            .not('tour_name', 'ilike', '%網卡專用團%')
        }
      } else {
        // 'all' tab: exclude special tours
        query = query
          .not('tour_name', 'ilike', '%簽證專用團%')
          .not('tour_name', 'ilike', '%網卡專用團%')
      }

      // ✅ Server-side tour filter
      if (tourId) {
        query = query.eq('tour_id', tourId)
      }

      // ✅ Server-side search
      if (search && search.trim()) {
        const searchTerm = search.trim()
        query = query.or(
          `order_number.ilike.%${searchTerm}%,tour_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,sales_person.ilike.%${searchTerm}%,assistant.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`
        )
      }

      const result = await query

      if (result.error) {
        logger.error('❌ Error fetching paginated orders:', result.error.message)
        throw new Error(result.error.message)
      }

      return {
        orders: (result.data || []) as unknown as Order[],
        count: result.count || 0,
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  // Refresh
  const refresh = async () => {
    await mutateSelf()
  }

  // Loading state - 簡化
  const effectiveLoading = isLoading

  return {
    orders: data?.orders || [],
    totalCount: data?.count || 0,
    loading: effectiveLoading,
    error: error?.message || null,
    actions: {
      refresh,
    },
  }
}

/**
 * useOrdersByTour - Server-side filtered orders for a specific tour
 * Uses skip pattern - only fetches when tourId is provided
 */
export function useOrdersByTour(tourId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    tourId ? `orders-by-tour-${tourId}` : null, // ✅ Skip pattern
    async () => {
      if (!tourId) return []

      const result = await supabase
        .from('orders')
        .select(ORDERS_LIST_FIELDS)
        .eq('tour_id', tourId)
        .order('created_at', { ascending: false })

      if (result.error) throw result.error
      return (result.data || []) as unknown as Order[]
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    orders: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}

/**
 * useOrderDetail - Single order detail with skip pattern
 */
export function useOrderDetail(orderId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? `order-detail-${orderId}` : null, // ✅ Skip pattern
    async () => {
      if (!orderId) return null

      const { data: order, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (queryError) throw queryError
      return order as Order
    }
  )

  return {
    order: data || null,
    loading: isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}
