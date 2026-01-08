/**
 * useTourDestinations - 管理開團目的地
 * 國家從 countries 表讀取，機場代碼從 tour_destinations 表讀取
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface TourDestination {
  id: string
  country: string
  city: string
  airport_code: string
  created_at: string | null
}

interface Country {
  id: string
  name: string
  name_en: string
  usage_count?: number | null
}

export function useTourDestinations() {
  const [countriesData, setCountriesData] = useState<Country[]>([])
  const [destinations, setDestinations] = useState<TourDestination[]>([])
  const [loading, setLoading] = useState(true)

  // 載入國家和目的地資料
  const fetchDestinations = useCallback(async () => {
    setLoading(true)
    try {
      // 平行載入國家和開團目的地
      const [countriesRes, destinationsRes] = await Promise.all([
        supabase
          .from('countries')
          .select('id, name, name_en, usage_count')
          .eq('is_active', true)
          .order('usage_count', { ascending: false, nullsFirst: false })
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('tour_destinations')
          .select('*')
          .order('country', { ascending: true })
          .order('city', { ascending: true }),
      ])

      if (countriesRes.error) throw countriesRes.error
      if (destinationsRes.error) throw destinationsRes.error

      setCountriesData(countriesRes.data || [])
      setDestinations(destinationsRes.data || [])
    } catch (error) {
      logger.error('載入目的地失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDestinations()
  }, [fetchDestinations])

  // 取得國家列表（從 countries 表，按使用次數排序）
  const countries = useMemo(() => {
    return countriesData.map(c => c.name)
  }, [countriesData])

  // 根據國家名稱取得城市列表（從 tour_destinations 表）
  const getCitiesByCountry = useCallback(
    (countryName: string) => {
      return destinations
        .filter(d => d.country === countryName)
        .map(d => ({
          city: d.city,
          airport_code: d.airport_code,
        }))
    },
    [destinations]
  )

  // 檢查城市是否有機場代碼
  const getAirportCode = useCallback(
    (countryName: string, cityName: string): string | null => {
      const dest = destinations.find(
        d => d.country === countryName && d.city === cityName
      )
      return dest?.airport_code || null
    },
    [destinations]
  )

  // 新增目的地（在 tour_destinations 表新增）
  const addDestination = useCallback(
    async (countryName: string, cityName: string, airportCode: string) => {
      try {
        const { data, error } = await supabase
          .from('tour_destinations')
          .insert({
            country: countryName.trim(),
            city: cityName.trim(),
            airport_code: airportCode.trim().toUpperCase(),
          })
          .select()
          .single()

        if (error) throw error

        setDestinations(prev => [...prev, data])
        return { success: true, data }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        logger.error('新增目的地失敗:', error)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  // 更新目的地
  const updateDestination = useCallback(
    async (id: string, updates: Partial<Pick<TourDestination, 'country' | 'city' | 'airport_code'>>) => {
      try {
        const updateData: Record<string, string> = {}
        if (updates.country) updateData.country = updates.country.trim()
        if (updates.city) updateData.city = updates.city.trim()
        if (updates.airport_code) updateData.airport_code = updates.airport_code.trim().toUpperCase()

        const { error } = await supabase
          .from('tour_destinations')
          .update(updateData)
          .eq('id', id)

        if (error) throw error

        await fetchDestinations()
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        logger.error('更新目的地失敗:', error)
        return { success: false, error: errorMessage }
      }
    },
    [fetchDestinations]
  )

  // 刪除目的地
  const deleteDestination = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('tour_destinations')
          .delete()
          .eq('id', id)

        if (error) throw error

        setDestinations(prev => prev.filter(d => d.id !== id))
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        logger.error('刪除目的地失敗:', error)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  return {
    destinations,
    countries,
    loading,
    fetchDestinations,
    getCitiesByCountry,
    getAirportCode,
    addDestination,
    updateDestination,
    deleteDestination,
  }
}
