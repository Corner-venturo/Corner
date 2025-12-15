/**
 * useTemplates - 從資料庫載入模板定義
 * 提供封面、航班、每日行程模板的資料
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

// 類型定義
export type CoverTemplate = Database['public']['Tables']['cover_templates']['Row']
export type DailyTemplate = Database['public']['Tables']['daily_templates']['Row']
export type FlightTemplate = Database['public']['Tables']['flight_templates']['Row']

interface UseTemplatesResult {
  coverTemplates: CoverTemplate[]
  dailyTemplates: DailyTemplate[]
  flightTemplates: FlightTemplate[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// 快取模板資料（避免重複請求）
let cachedCoverTemplates: CoverTemplate[] | null = null
let cachedDailyTemplates: DailyTemplate[] | null = null
let cachedFlightTemplates: FlightTemplate[] | null = null

export function useTemplates(): UseTemplatesResult {
  const [coverTemplates, setCoverTemplates] = useState<CoverTemplate[]>(cachedCoverTemplates || [])
  const [dailyTemplates, setDailyTemplates] = useState<DailyTemplate[]>(cachedDailyTemplates || [])
  const [flightTemplates, setFlightTemplates] = useState<FlightTemplate[]>(cachedFlightTemplates || [])
  const [loading, setLoading] = useState(!cachedCoverTemplates)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    // 如果已有快取，直接使用
    if (cachedCoverTemplates && cachedDailyTemplates && cachedFlightTemplates) {
      setCoverTemplates(cachedCoverTemplates)
      setDailyTemplates(cachedDailyTemplates)
      setFlightTemplates(cachedFlightTemplates)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 並行請求三種模板
      const [coverRes, dailyRes, flightRes] = await Promise.all([
        supabase
          .from('cover_templates')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('daily_templates')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('flight_templates')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ])

      if (coverRes.error) throw coverRes.error
      if (dailyRes.error) throw dailyRes.error
      if (flightRes.error) throw flightRes.error

      // 更新快取
      cachedCoverTemplates = coverRes.data || []
      cachedDailyTemplates = dailyRes.data || []
      cachedFlightTemplates = flightRes.data || []

      setCoverTemplates(cachedCoverTemplates)
      setDailyTemplates(cachedDailyTemplates)
      setFlightTemplates(cachedFlightTemplates)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入模板失敗'
      setError(message)
      console.error('載入模板失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 強制重新載入（清除快取）
  const refetch = useCallback(async () => {
    cachedCoverTemplates = null
    cachedDailyTemplates = null
    cachedFlightTemplates = null
    await fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    coverTemplates,
    dailyTemplates,
    flightTemplates,
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
  // 封面模板
  original: '#f59e0b',   // amber
  gemini: '#c9aa7c',     // morandi gold
  nature: '#30abe8',     // japan blue
  serene: '#4a6fa5',     // serene blue
  luxury: '#2C5F4D',     // luxury green
  art: '#E63946',        // art red
  // 航班模板
  chinese: '#8B4513',    // chinese brown
  japanese: '#30abe8',   // japanese blue
  none: '#9CA3AF',       // gray
}

// 取得模板顏色
export function getTemplateColor(templateId: string | null | undefined): string {
  if (!templateId) return '#f59e0b'
  return templateColors[templateId] || '#f59e0b'
}
