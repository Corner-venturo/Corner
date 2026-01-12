'use client'

/**
 * useGlobalData - 統一資料載入層
 *
 * 解決問題：
 * 1. 重複 fetchAll() - 改用 SWR 全域快取
 * 2. 瀑布式請求 - 改用 parallel 載入
 * 3. Dialog 重複載入 - 共享快取
 *
 * 使用方式：
 * const { tours, orders, loading } = useGlobalData(['tours', 'orders'])
 */

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Tour, Order, Member, Quote, Itinerary } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// ============================================
// 資料類型定義
// ============================================

type DataKey = 'tours' | 'orders' | 'members' | 'quotes' | 'itineraries' | 'toursSlim' | 'ordersSlim'

interface GlobalDataConfig {
  table: string
  select: string
  orderBy?: { column: string; ascending: boolean }
}

// 資料配置：定義每種資料的查詢方式
const DATA_CONFIG: Record<DataKey, GlobalDataConfig> = {
  tours: {
    table: 'tours',
    select: '*',
    orderBy: { column: 'departure_date', ascending: false },
  },
  toursSlim: {
    table: 'tours',
    select: 'id,code,name,departure_date,status',
    orderBy: { column: 'departure_date', ascending: false },
  },
  orders: {
    table: 'orders',
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  ordersSlim: {
    table: 'orders',
    select: 'id,order_number,tour_id,tour_name,contact_person,payment_status,member_count',
    orderBy: { column: 'created_at', ascending: false },
  },
  members: {
    table: 'order_members',
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  quotes: {
    table: 'quotes',
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
  itineraries: {
    table: 'itineraries',
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
  },
}

// SWR 配置：統一快取策略
const SWR_CONFIG = {
  revalidateOnFocus: false,      // 切換 tab 不重新載入
  revalidateOnReconnect: true,   // 斷線重連時重新載入
  dedupingInterval: 30000,       // 30 秒內不重複請求
  errorRetryCount: 2,            // 錯誤重試 2 次
}

// ============================================
// 通用 fetcher
// ============================================

async function fetchData<T>(config: GlobalDataConfig): Promise<T[]> {
  // Type assertion needed for dynamic table names
  const query = supabase
    .from(config.table as 'tours')
    .select(config.select)
    .order(config.orderBy?.column || 'created_at', {
      ascending: config.orderBy?.ascending ?? false
    })

  const { data, error } = await query

  if (error) {
    logger.error(`❌ Error fetching ${config.table}:`, error.message)
    throw new Error(error.message)
  }

  return (data || []) as unknown as T[]
}

// ============================================
// 單一資料 Hook（使用全域快取）
// ============================================

/**
 * useTours - 全域快取的 Tours
 * 任何地方呼叫都共享同一份快取
 */
export function useToursGlobal() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const swrKey = hasHydrated && isAuthenticated && user?.id ? 'global-tours' : null

  const { data, error, isLoading, mutate } = useSWR<Tour[]>(
    swrKey,
    () => fetchData<Tour>(DATA_CONFIG.tours),
    SWR_CONFIG
  )

  return {
    tours: data || [],
    loading: !hasHydrated || isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}

/**
 * useToursSlim - 精簡版 Tours（列表顯示用）
 */
export function useToursSlimGlobal() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const swrKey = hasHydrated && isAuthenticated && user?.id ? 'global-tours-slim' : null

  const { data, error, isLoading, mutate } = useSWR<Partial<Tour>[]>(
    swrKey,
    () => fetchData<Partial<Tour>>(DATA_CONFIG.toursSlim),
    SWR_CONFIG
  )

  return {
    tours: data || [],
    loading: !hasHydrated || isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}

/**
 * useOrdersGlobal - 全域快取的 Orders
 */
export function useOrdersGlobal() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const swrKey = hasHydrated && isAuthenticated && user?.id ? 'global-orders' : null

  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    swrKey,
    () => fetchData<Order>(DATA_CONFIG.orders),
    SWR_CONFIG
  )

  return {
    orders: data || [],
    loading: !hasHydrated || isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}

/**
 * useOrdersSlimGlobal - 精簡版 Orders
 */
export function useOrdersSlimGlobal() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const swrKey = hasHydrated && isAuthenticated && user?.id ? 'global-orders-slim' : null

  const { data, error, isLoading, mutate } = useSWR<Partial<Order>[]>(
    swrKey,
    () => fetchData<Partial<Order>>(DATA_CONFIG.ordersSlim),
    SWR_CONFIG
  )

  return {
    orders: data || [],
    loading: !hasHydrated || isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  }
}

// ============================================
// 組合 Hook：一次載入多種資料（平行）
// ============================================

interface UseGlobalDataOptions {
  tours?: boolean
  toursSlim?: boolean
  orders?: boolean
  ordersSlim?: boolean
  members?: boolean
  quotes?: boolean
  itineraries?: boolean
}

interface UseGlobalDataResult {
  tours: Tour[]
  orders: Order[]
  members: Member[]
  quotes: Quote[]
  itineraries: Itinerary[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * useGlobalData - 一次載入多種資料（平行請求）
 *
 * @example
 * // 載入 tours 和 orders
 * const { tours, orders, loading } = useGlobalData({ tours: true, orders: true })
 *
 * // 只載入精簡版（列表顯示用）
 * const { tours, loading } = useGlobalData({ toursSlim: true })
 */
export function useGlobalData(options: UseGlobalDataOptions): UseGlobalDataResult {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const isReady = hasHydrated && isAuthenticated && user?.id

  // 根據 options 決定要載入哪些資料
  const keysToLoad = Object.entries(options)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as DataKey)

  // 建立 SWR key（包含所有要載入的資料類型）
  const swrKey = isReady ? `global-data-${keysToLoad.sort().join('-')}` : null

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      // 平行載入所有需要的資料
      const results = await Promise.all(
        keysToLoad.map(async key => {
          const config = DATA_CONFIG[key]
          const data = await fetchData(config)
          return { key, data }
        })
      )

      // 整理成物件
      return results.reduce((acc, { key, data }) => {
        // toursSlim 和 ordersSlim 合併到 tours 和 orders
        if (key === 'toursSlim') {
          acc.tours = data as Tour[]
        } else if (key === 'ordersSlim') {
          acc.orders = data as Order[]
        } else {
          acc[key] = data
        }
        return acc
      }, {} as Record<string, unknown[]>)
    },
    SWR_CONFIG
  )

  return {
    tours: (data?.tours as Tour[]) || [],
    orders: (data?.orders as Order[]) || [],
    members: (data?.members as Member[]) || [],
    quotes: (data?.quotes as Quote[]) || [],
    itineraries: (data?.itineraries as Itinerary[]) || [],
    loading: !hasHydrated || isLoading,
    error: error?.message || null,
    refresh: async () => { await mutate() },
  }
}

// ============================================
// 預載入 Hook（登入後自動載入常用資料）
// ============================================

/**
 * usePreloadCommonData - 預載入常用資料
 * 放在 layout 層級，登入後自動載入
 */
export function usePreloadCommonData() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const isReady = hasHydrated && isAuthenticated && user?.id

  // 預載入精簡版資料（背景執行，不阻塞 UI）
  useSWR(
    isReady ? 'preload-tours-slim' : null,
    () => fetchData<Partial<Tour>>(DATA_CONFIG.toursSlim),
    { ...SWR_CONFIG, revalidateOnMount: true }
  )

  useSWR(
    isReady ? 'preload-orders-slim' : null,
    () => fetchData<Partial<Order>>(DATA_CONFIG.ordersSlim),
    { ...SWR_CONFIG, revalidateOnMount: true }
  )
}

// ============================================
// Dictionary Hooks（O(1) 查詢）
// ============================================

/**
 * useTourDictionary - Tour ID → Name 快速查詢
 */
export function useTourDictionary() {
  const { tours, loading } = useToursSlimGlobal()

  const dictionary = tours.reduce((acc, tour) => {
    if (tour.id) {
      acc[tour.id] = tour
    }
    return acc
  }, {} as Record<string, Partial<Tour>>)

  return {
    dictionary,
    loading,
    getTour: (id: string) => dictionary[id],
    getTourName: (id: string) => dictionary[id]?.name || '',
    getTourCode: (id: string) => dictionary[id]?.code || '',
  }
}

/**
 * useOrderDictionary - Order ID → Data 快速查詢
 */
export function useOrderDictionary() {
  const { orders, loading } = useOrdersSlimGlobal()

  const dictionary = orders.reduce((acc, order) => {
    if (order.id) {
      acc[order.id] = order
    }
    return acc
  }, {} as Record<string, Partial<Order>>)

  return {
    dictionary,
    loading,
    getOrder: (id: string) => dictionary[id],
    getOrderNumber: (id: string) => dictionary[id]?.order_number || '',
  }
}
