/**
 * useAirports - 統一機場資料來源
 * 
 * 從 ref_airports 讀取，取代舊的 useTourDestinations
 * - is_favorite = true 的機場排在最前面
 * - 按國家篩選
 * - 支援搜尋
 */

import { useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

export interface Airport {
  iata_code: string
  icao_code: string | null
  english_name: string | null
  name_zh: string | null
  city_name_en: string | null
  city_name_zh: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  is_favorite: boolean
  usage_count: number
}

// 國家代碼對應中文名稱
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  TW: '台灣',
  JP: '日本',
  KR: '韓國',
  CN: '中國',
  HK: '香港',
  MO: '澳門',
  TH: '泰國',
  SG: '新加坡',
  MY: '馬來西亞',
  VN: '越南',
  PH: '菲律賓',
  ID: '印尼',
  KH: '柬埔寨',
  MM: '緬甸',
  US: '美國',
  CA: '加拿大',
  GB: '英國',
  FR: '法國',
  DE: '德國',
  IT: '義大利',
  ES: '西班牙',
  NL: '荷蘭',
  CH: '瑞士',
  AT: '奧地利',
  CZ: '捷克',
  TR: '土耳其',
  AE: '阿聯酋',
  AU: '澳洲',
  NZ: '紐西蘭',
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODE_TO_NAME).map(([code, name]) => [name, code])
)

// SWR 快取 key
const AIRPORTS_CACHE_KEY = 'entity:ref_airports:list'
const COUNTRIES_CACHE_KEY = 'entity:countries:list'

// SWR 配置
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,
}

// Fetcher（按使用次數排序）
async function fetchAirports(): Promise<Airport[]> {
  const { data, error } = await supabase
    .from('ref_airports')
    .select('*')
    .order('usage_count', { ascending: false, nullsFirst: true })
    .order('city_name_zh', { ascending: true })

  if (error) {
    logger.error('載入機場資料失敗:', error)
    throw error
  }
  
  return (data || []) as Airport[]
}

// 從 countries 表讀取國家
async function fetchCountries(): Promise<string[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('name')
    .eq('is_active', true)
    .order('usage_count', { ascending: false, nullsFirst: false })
    .order('display_order', { ascending: true })

  if (error) {
    logger.error('載入國家列表失敗:', error)
    throw error
  }
  
  return (data || []).map(c => c.name)
}

interface UseAirportsOptions {
  enabled?: boolean
}

export function useAirports(options: UseAirportsOptions = {}) {
  const { enabled = true } = options

  // 載入所有機場
  const { 
    data: airports = [], 
    isLoading: airportsLoading,
    error: airportsError 
  } = useSWR<Airport[]>(
    enabled ? AIRPORTS_CACHE_KEY : null,
    fetchAirports,
    SWR_CONFIG
  )

  // 載入國家列表
  const {
    data: countries = [],
    isLoading: countriesLoading,
  } = useSWR<string[]>(
    enabled ? COUNTRIES_CACHE_KEY : null,
    fetchCountries,
    SWR_CONFIG
  )

  const loading = airportsLoading || countriesLoading
  const error = airportsError

  // 根據國家名稱取得機場列表（按使用次數排序）
  const getAirportsByCountry = useCallback(
    (countryName: string): Airport[] => {
      const countryCode = COUNTRY_NAME_TO_CODE[countryName]
      if (!countryCode) return []
      
      return airports
        .filter(a => a.country_code === countryCode)
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    },
    [airports]
  )

  // 取得機場詳細資訊
  const getAirport = useCallback(
    (iataCode: string): Airport | null => {
      return airports.find(a => a.iata_code === iataCode) || null
    },
    [airports]
  )

  // 取得機場顯示名稱
  const getAirportDisplayName = useCallback(
    (iataCode: string): string => {
      const airport = airports.find(a => a.iata_code === iataCode)
      if (!airport) return iataCode
      return airport.city_name_zh || airport.city_name_en || iataCode
    },
    [airports]
  )

  // 標記機場為常用（增加 usage_count）
  const markAsUsed = useCallback(
    async (iataCode: string) => {
      // 先取得目前的 usage_count
      const airport = airports.find(a => a.iata_code === iataCode)
      const currentCount = airport?.usage_count || 0
      
      const { error } = await supabase
        .from('ref_airports')
        .update({ usage_count: currentCount + 1 })
        .eq('iata_code', iataCode)
      
      if (error) {
        logger.error('更新 usage_count 失敗:', error)
        return
      }
      
      // 重新載入
      mutate(AIRPORTS_CACHE_KEY)
    },
    [airports]
  )

  // 轉換格式：相容舊的 TourDestination 格式（用過的機場）
  const destinations = useMemo(() => {
    return airports
      .filter(a => (a.usage_count || 0) > 0)
      .map(a => ({
        id: a.iata_code,
        country: COUNTRY_CODE_TO_NAME[a.country_code || ''] || a.country_code || '',
        city: a.city_name_zh || a.city_name_en || '',
        airport_code: a.iata_code,
        created_at: null,
      }))
  }, [airports])

  return {
    airports,
    countries,
    destinations, // 相容舊格式
    loading,
    error,
    getAirportsByCountry,
    getAirport,
    getAirportDisplayName,
    markAsUsed,
    refresh: () => mutate(AIRPORTS_CACHE_KEY),
  }
}
