/**
 * useTemplates - 從資料庫載入模板定義
 * 提供封面、航班、每日行程模板的資料
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { Database } from '@/lib/supabase/types'

// 類型定義
export type CoverTemplate = Database['public']['Tables']['cover_templates']['Row']
export type DailyTemplate = Database['public']['Tables']['daily_templates']['Row']
export type FlightTemplate = Database['public']['Tables']['flight_templates']['Row']
export type LeaderTemplate = Database['public']['Tables']['leader_templates']['Row']
export type HotelTemplate = Database['public']['Tables']['hotel_templates']['Row']
export type PricingTemplate = Database['public']['Tables']['pricing_templates']['Row']
export type FeaturesTemplate = Database['public']['Tables']['features_templates']['Row']

interface UseTemplatesResult {
  coverTemplates: CoverTemplate[]
  dailyTemplates: DailyTemplate[]
  flightTemplates: FlightTemplate[]
  leaderTemplates: LeaderTemplate[]
  hotelTemplates: HotelTemplate[]
  pricingTemplates: PricingTemplate[]
  featuresTemplates: FeaturesTemplate[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 快取模板資料（避免重複請求）
let cachedCoverTemplates: CoverTemplate[] | null = null
let cachedDailyTemplates: DailyTemplate[] | null = null
let cachedFlightTemplates: FlightTemplate[] | null = null
let cachedLeaderTemplates: LeaderTemplate[] | null = null
let cachedHotelTemplates: HotelTemplate[] | null = null
let cachedPricingTemplates: PricingTemplate[] | null = null
let cachedFeaturesTemplates: FeaturesTemplate[] | null = null

export function useTemplates(): UseTemplatesResult {
  const [coverTemplates, setCoverTemplates] = useState<CoverTemplate[]>(cachedCoverTemplates || [])
  const [dailyTemplates, setDailyTemplates] = useState<DailyTemplate[]>(cachedDailyTemplates || [])
  const [flightTemplates, setFlightTemplates] = useState<FlightTemplate[]>(cachedFlightTemplates || [])
  const [leaderTemplates, setLeaderTemplates] = useState<LeaderTemplate[]>(cachedLeaderTemplates || [])
  const [hotelTemplates, setHotelTemplates] = useState<HotelTemplate[]>(cachedHotelTemplates || [])
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>(cachedPricingTemplates || [])
  const [featuresTemplates, setFeaturesTemplates] = useState<FeaturesTemplate[]>(cachedFeaturesTemplates || [])
  const [loading, setLoading] = useState(!cachedCoverTemplates)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    // 如果已有快取，直接使用
    if (cachedCoverTemplates && cachedDailyTemplates && cachedFlightTemplates &&
        cachedLeaderTemplates && cachedHotelTemplates && cachedPricingTemplates && cachedFeaturesTemplates) {
      setCoverTemplates(cachedCoverTemplates)
      setDailyTemplates(cachedDailyTemplates)
      setFlightTemplates(cachedFlightTemplates)
      setLeaderTemplates(cachedLeaderTemplates)
      setHotelTemplates(cachedHotelTemplates)
      setPricingTemplates(cachedPricingTemplates)
      setFeaturesTemplates(cachedFeaturesTemplates)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 並行請求所有模板
      const [coverRes, dailyRes, flightRes, leaderRes, hotelRes, pricingRes, featuresRes] = await Promise.all([
        supabase.from('cover_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('daily_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('flight_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('leader_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('hotel_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('pricing_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('features_templates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])

      if (coverRes.error) throw coverRes.error
      if (dailyRes.error) throw dailyRes.error
      if (flightRes.error) throw flightRes.error
      if (leaderRes.error) throw leaderRes.error
      if (hotelRes.error) throw hotelRes.error
      if (pricingRes.error) throw pricingRes.error
      if (featuresRes.error) throw featuresRes.error

      // 更新快取
      cachedCoverTemplates = coverRes.data || []
      cachedDailyTemplates = dailyRes.data || []
      cachedFlightTemplates = flightRes.data || []
      cachedLeaderTemplates = leaderRes.data || []
      cachedHotelTemplates = hotelRes.data || []
      cachedPricingTemplates = pricingRes.data || []
      cachedFeaturesTemplates = featuresRes.data || []

      setCoverTemplates(cachedCoverTemplates)
      setDailyTemplates(cachedDailyTemplates)
      setFlightTemplates(cachedFlightTemplates)
      setLeaderTemplates(cachedLeaderTemplates)
      setHotelTemplates(cachedHotelTemplates)
      setPricingTemplates(cachedPricingTemplates)
      setFeaturesTemplates(cachedFeaturesTemplates)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入模板失敗'
      setError(message)
      logger.error('載入模板失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 強制重新載入（清除快取）
  const refetch = useCallback(async () => {
    cachedCoverTemplates = null
    cachedDailyTemplates = null
    cachedFlightTemplates = null
    cachedLeaderTemplates = null
    cachedHotelTemplates = null
    cachedPricingTemplates = null
    cachedFeaturesTemplates = null
    await fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    coverTemplates,
    dailyTemplates,
    flightTemplates,
    leaderTemplates,
    hotelTemplates,
    pricingTemplates,
    featuresTemplates,
    loading,
    error,
    refetch,
  }
}

// 取得單一模板的 helper
export function useCoverTemplate(templateId: string | null | undefined): CoverTemplate | null {
  const { coverTemplates } = useTemplates()
  if (!templateId) return null
  return coverTemplates.find(t => t.id === templateId) || null
}

export function useDailyTemplate(templateId: string | null | undefined): DailyTemplate | null {
  const { dailyTemplates } = useTemplates()
  if (!templateId) return null
  return dailyTemplates.find(t => t.id === templateId) || null
}

export function useFlightTemplate(templateId: string | null | undefined): FlightTemplate | null {
  const { flightTemplates } = useTemplates()
  if (!templateId) return null
  return flightTemplates.find(t => t.id === templateId) || null
}

// 模板 ID 對應的顏色（用於 UI 顯示）
export const templateColors: Record<string, string> = {
  // 通用模板
  original: '#f59e0b',   // amber
  gemini: '#c9aa7c',     // morandi gold
  nature: '#30abe8',     // japan blue
  serene: '#4a6fa5',     // serene blue
  luxury: '#2C5F4D',     // luxury green
  art: '#E63946',        // art red
  dreamscape: '#9370db', // dreamscape purple
  collage: '#FF0080',    // collage pink (pop art)
  // 航班模板
  chinese: '#8B4513',    // chinese brown
  japanese: '#30abe8',   // japanese blue
  none: '#9CA3AF',       // gray
  // 其他模板
  minimal: '#6B7280',    // minimal gray
  gallery: '#8B5CF6',    // gallery purple
  tiers: '#EC4899',      // tiers pink
  icons: '#14B8A6',      // icons teal
}

// 取得領隊模板 helper
export function useLeaderTemplate(templateId: string | null | undefined): LeaderTemplate | null {
  const { leaderTemplates } = useTemplates()
  if (!templateId) return null
  return leaderTemplates.find(t => t.id === templateId) || null
}

// 取得飯店模板 helper
export function useHotelTemplate(templateId: string | null | undefined): HotelTemplate | null {
  const { hotelTemplates } = useTemplates()
  if (!templateId) return null
  return hotelTemplates.find(t => t.id === templateId) || null
}

// 取得價格模板 helper
export function usePricingTemplate(templateId: string | null | undefined): PricingTemplate | null {
  const { pricingTemplates } = useTemplates()
  if (!templateId) return null
  return pricingTemplates.find(t => t.id === templateId) || null
}

// 取得特色模板 helper
export function useFeaturesTemplate(templateId: string | null | undefined): FeaturesTemplate | null {
  const { featuresTemplates } = useTemplates()
  if (!templateId) return null
  return featuresTemplates.find(t => t.id === templateId) || null
}

// 取得模板顏色
export function getTemplateColor(templateId: string | null | undefined): string {
  if (!templateId) return '#f59e0b'
  return templateColors[templateId] || '#f59e0b'
}
