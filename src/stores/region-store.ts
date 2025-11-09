/**
 * 地區管理 Store (新版 - 重構)
 * 支援三層架構：Countries > Regions > Cities
 * 使用 createStore 工廠函數統一架構
 * 整合統計資訊
 */

import { createStore } from './core/create-store'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { seedRegions } from '@/lib/db/seed-regions'

// ============================================
// 型別定義
// ============================================

export interface Country {
  id: string
  name: string
  name_en: string
  emoji?: string
  code?: string
  has_regions: boolean
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Region {
  id: string
  country_id: string
  name: string
  name_en?: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface City {
  id: string
  country_id: string
  region_id?: string
  name: string
  name_en?: string
  airport_code?: string
  description?: string
  timezone?: string
  background_image_url?: string
  background_image_url_2?: string
  primary_image?: number // 1 or 2, indicates which image is primary
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RegionStats {
  city_id: string
  attractions_count: number
  cost_templates_count: number
  quotes_count: number
  tours_count: number
  updated_at: string
}

// ============================================
// 內部 Stores（使用 createStore 工廠）
// ============================================

const useCountryStoreInternal = createStore<Country>('countries')
const useRegionStoreInternal = createStore<Region>('regions')
const useCityStoreInternal = createStore<City>('cities')

// ============================================
// 統計資料 Store (簡單的 Zustand store，不需要離線支援)
// ============================================

import { create } from 'zustand'

interface StatsState {
  stats: Record<string, RegionStats>
  loading: boolean
  error: string | null
  fetchStats: () => Promise<void>
}

const useStatsStore = create<StatsState>(set => ({
  stats: {},
  loading: false,
  error: null,

  fetchStats: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase.from('region_stats').select('*')

      if (error) throw error

      // 轉換為 Record
      const statsMap: Record<string, RegionStats> = {}
      data?.forEach(stat => {
        statsMap[stat.city_id] = stat
      })

      set({ stats: statsMap, loading: false })
      logger.info('✅ 地區統計資料載入完成', { count: data?.length })
    } catch (error) {
      logger.error('❌ 載入統計資料失敗', error)
      set({ error: (error as Error).message, loading: false })
    }
  },
}))

// ============================================
// 對外整合 Hook
// ============================================

import { useMemo, useCallback } from 'react'

export const useRegionsStore = () => {
  const countryStore = useCountryStoreInternal()
  const regionStore = useRegionStoreInternal()
  const cityStore = useCityStoreInternal()
  const statsStore = useStatsStore()

  // 使用 useCallback 穩定所有方法引用
  // ============================================
  // 只載入國家資料（按需載入優化）
  // ============================================
  const fetchCountries = useCallback(async () => {
    await countryStore.fetchAll()

    // 如果 countries 是空的，自動初始化預設資料
    if (countryStore.items.length === 0) {
      logger.info('📦 [RegionStore] 偵測到空資料，開始初始化預設地區資料...')
      try {
        await seedRegions()
        // 重新載入資料
        await countryStore.fetchAll()
        logger.info('✅ [RegionStore] 預設地區資料初始化完成')
      } catch (error) {
        logger.error('❌ [RegionStore] 初始化失敗:', error)
      }
    }
  }, [countryStore])

  // ============================================
  // 根據國家載入城市（按需載入）
  // ============================================
  const fetchCitiesByCountry = useCallback(
    async (countryId: string) => {
      // 只載入特定國家的城市（如果已經有全部資料就不重新載入）
      if (cityStore.items.length === 0) {
        await cityStore.fetchAll()
      }
    },
    [cityStore]
  )

  // ============================================
  // 載入所有資料（保留向後相容）
  // ============================================
  const fetchAll = useCallback(async () => {
    // 先載入現有資料
    await Promise.all([countryStore.fetchAll(), regionStore.fetchAll(), cityStore.fetchAll()])

    // 如果 countries 是空的，自動初始化預設資料
    if (countryStore.items.length === 0) {
      logger.info('📦 [RegionStore] 偵測到空資料，開始初始化預設地區資料...')
      try {
        await seedRegions()

        // 重新載入資料
        await Promise.all([countryStore.fetchAll(), regionStore.fetchAll(), cityStore.fetchAll()])

        logger.info('✅ [RegionStore] 預設地區資料初始化完成')
      } catch (error) {
        logger.error('❌ [RegionStore] 初始化失敗:', error)
      }
    }

    logger.info('✅ 地區資料載入完成', {
      countries: countryStore.items.length,
      regions: regionStore.items.length,
      cities: cityStore.items.length,
    })
  }, [countryStore, regionStore, cityStore])

  // ============================================
  // 載入統計資訊
  // ============================================
  const fetchStats = useCallback(async () => {
    await statsStore.fetchStats()
  }, [statsStore.fetchStats])

  // ============================================
  // Countries CRUD
  // ============================================
  const createCountry = useCallback((data: any) => countryStore.create(data), [countryStore.create])
  const updateCountry = useCallback(
    (id: string, data: any) => countryStore.update(id, data),
    [countryStore.update]
  )
  const deleteCountry = useCallback((id: string) => countryStore.delete(id), [countryStore.delete])

  // ============================================
  // Regions CRUD
  // ============================================
  const createRegion = useCallback((data: any) => regionStore.create(data), [regionStore.create])
  const updateRegion = useCallback(
    (id: string, data: any) => regionStore.update(id, data),
    [regionStore.update]
  )
  const deleteRegion = useCallback((id: string) => regionStore.delete(id), [regionStore.delete])

  // ============================================
  // Cities CRUD
  // ============================================
  const createCity = useCallback((data: any) => cityStore.create(data), [cityStore.create])
  const updateCity = useCallback(
    (id: string, data: any) => cityStore.update(id, data),
    [cityStore.update]
  )
  const deleteCity = useCallback((id: string) => cityStore.delete(id), [cityStore.delete])

  // ============================================
  // 查詢方法（使用 useCallback 穩定引用）
  // ============================================
  const getCountry = useCallback(
    (id: string) => {
      return countryStore.items.find(c => c.id === id)
    },
    [countryStore.items]
  )

  const getRegionsByCountry = useCallback(
    (countryId: string) => {
      return regionStore.items.filter(r => r.country_id === countryId)
    },
    [regionStore.items]
  )

  const getCitiesByCountry = useCallback(
    (countryId: string) => {
      return cityStore.items.filter(c => c.country_id === countryId)
    },
    [cityStore.items]
  )

  const getCitiesByRegion = useCallback(
    (regionId: string) => {
      return cityStore.items.filter(c => c.region_id === regionId)
    },
    [cityStore.items]
  )

  const getCityStats = useCallback(
    (cityId: string) => {
      return statsStore.stats[cityId]
    },
    [statsStore.stats]
  )

  // 使用 useMemo 確保回傳的物件引用穩定
  return useMemo(
    () => ({
      // 資料
      countries: countryStore.items,
      regions: regionStore.items,
      cities: cityStore.items,
      stats: statsStore.stats,

      // 狀態
      loading:
        countryStore.loading || regionStore.loading || cityStore.loading || statsStore.loading,
      error: countryStore.error || regionStore.error || cityStore.error || statsStore.error,

      // 方法（已穩定）
      fetchAll,
      fetchCountries,
      fetchCitiesByCountry,
      fetchStats,
      createCountry,
      updateCountry,
      deleteCountry,
      createRegion,
      updateRegion,
      deleteRegion,
      createCity,
      updateCity,
      deleteCity,
      getCountry,
      getRegionsByCountry,
      getCitiesByCountry,
      getCitiesByRegion,
      getCityStats,
    }),
    [
      // 資料依賴
      countryStore.items,
      regionStore.items,
      cityStore.items,
      statsStore.stats,
      // 狀態依賴
      countryStore.loading,
      regionStore.loading,
      cityStore.loading,
      statsStore.loading,
      countryStore.error,
      regionStore.error,
      cityStore.error,
      statsStore.error,
      // 方法依賴
      fetchAll,
      fetchCountries,
      fetchCitiesByCountry,
      fetchStats,
      createCountry,
      updateCountry,
      deleteCountry,
      createRegion,
      updateRegion,
      deleteRegion,
      createCity,
      updateCity,
      deleteCity,
      getCountry,
      getRegionsByCountry,
      getCitiesByCountry,
      getCitiesByRegion,
      getCityStats,
    ]
  )
}
