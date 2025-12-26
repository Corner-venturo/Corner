/**
 * useTourDestinations - 管理開團目的地
 * 簡化版：國家 + 城市 + 機場代碼
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface TourDestination {
  id: string
  country: string
  city: string
  airport_code: string
  created_at: string | null
}

export function useTourDestinations() {
  const [destinations, setDestinations] = useState<TourDestination[]>([])
  const [loading, setLoading] = useState(true)

  // 載入所有目的地
  const fetchDestinations = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tour_destinations')
        .select('*')
        .order('country', { ascending: true })
        .order('city', { ascending: true })

      if (error) throw error
      setDestinations(data || [])
    } catch (error) {
      logger.error('載入目的地失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDestinations()
  }, [fetchDestinations])

  // 取得不重複的國家列表
  const countries = Array.from(new Set(destinations.map(d => d.country))).sort()

  // 根據國家取得城市列表
  const getCitiesByCountry = useCallback(
    (country: string) => {
      return destinations
        .filter(d => d.country === country)
        .map(d => ({ city: d.city, airport_code: d.airport_code }))
    },
    [destinations]
  )

  // 檢查城市是否有機場代碼
  const getAirportCode = useCallback(
    (country: string, city: string): string | null => {
      const dest = destinations.find(
        d => d.country === country && d.city === city
      )
      return dest?.airport_code || null
    },
    [destinations]
  )

  // 新增目的地
  const addDestination = useCallback(
    async (country: string, city: string, airportCode: string) => {
      try {
        const { data, error } = await supabase
          .from('tour_destinations')
          .insert({
            country: country.trim(),
            city: city.trim(),
            airport_code: airportCode.trim().toUpperCase(),
          })
          .select()
          .single()

        if (error) throw error

        setDestinations(prev => [...prev, data])
        return { success: true, data }
      } catch (error: any) {
        logger.error('新增目的地失敗:', error)
        return { success: false, error: error.message }
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
      } catch (error: any) {
        logger.error('更新目的地失敗:', error)
        return { success: false, error: error.message }
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
      } catch (error: any) {
        logger.error('刪除目的地失敗:', error)
        return { success: false, error: error.message }
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
