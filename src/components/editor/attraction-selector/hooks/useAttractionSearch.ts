'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Attraction } from '@/features/attractions/types'

interface AttractionWithCity extends Attraction {
  city_name?: string
  region_name?: string
}

// 使用 module-level 變數保存篩選狀態（半永久記憶）
let savedCountryId = ''
let savedCityId = ''

// 解析行程標題，取得可能的景點名稱
function parseDayTitleForAttractions(title: string): string[] {
  if (!title) return []

  // 分割符號：→、⇀、·、|、、、-、/
  const separators = /[→⇀·|、\-/]/g
  const parts = title.split(separators)

  // 過濾掉常見的非景點關鍵字
  const excludePatterns = [
    /機場/,
    /飯店/,
    /酒店/,
    /入住/,
    /check.?in/i,
    /check.?out/i,
    /自由活動/,
    /午餐/,
    /晚餐/,
    /早餐/,
    /用餐/,
    /休息/,
    /^台北$/,
    /^桃園$/,
    /^國際$/,
    /^\s*$/,
    /✈/,
    /⭐/,
  ]

  return parts
    .map(p => p.trim())
    .filter(p => p.length >= 2) // 至少 2 個字
    .filter(p => !excludePatterns.some(pattern => pattern.test(p)))
}

interface UseAttractionSearchProps {
  isOpen: boolean
  tourCountryName?: string
  dayTitle?: string
}

interface City {
  id: string
  name: string
}

interface Country {
  id: string
  name: string
}

export function useAttractionSearch({
  isOpen,
  tourCountryName = '',
  dayTitle = '',
}: UseAttractionSearchProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<string>(savedCountryId)
  const [selectedCityId, setSelectedCityId] = useState<string>(savedCityId)
  const [searchQuery, setSearchQuery] = useState('')
  const [attractions, setAttractions] = useState<AttractionWithCity[]>([])
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [countries, setCountries] = useState<Country[]>([])

  // 載入所有國家
  useEffect(() => {
    if (!isOpen) return

    const loadCountries = async () => {
      const { data } = await supabase
        .from('countries')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      setCountries(data || [])
    }
    loadCountries()
  }, [isOpen])

  // 打開對話框時自動選擇行程的國家
  useEffect(() => {
    if (isOpen && countries.length > 0 && tourCountryName) {
      const matchedCountry = countries.find(c => c.name === tourCountryName)
      if (matchedCountry && matchedCountry.id !== savedCountryId) {
        setSelectedCountryId(matchedCountry.id)
        savedCountryId = matchedCountry.id
        setSelectedCityId('')
        savedCityId = ''
      }
    }
  }, [isOpen, tourCountryName, countries])

  // 更新國家時同步保存
  const handleCountryChange = (countryId: string) => {
    const value = countryId === '__all__' ? '' : countryId
    setSelectedCountryId(value)
    setSelectedCityId('')
    savedCountryId = value
    savedCityId = ''
  }

  // 更新城市時同步保存
  const handleCityChange = (cityId: string) => {
    const value = cityId === '__all__' ? '' : cityId
    setSelectedCityId(value)
    savedCityId = value
  }

  // 載入城市列表（根據選擇的國家）
  useEffect(() => {
    if (!isOpen || !selectedCountryId) {
      setCities([])
      return
    }

    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name')
          .eq('country_id', selectedCountryId)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setCities(data || [])
      } catch (error) {
        setCities([])
      }
    }

    loadCities()
  }, [isOpen, selectedCountryId])

  // 載入景點資料（包含經緯度）
  useEffect(() => {
    if (!isOpen) return

    const loadAttractions = async () => {
      // 必須選擇國家才載入，否則資料太多（1600+筆）
      if (!selectedCountryId) {
        setAttractions([])
        return
      }

      setLoading(true)
      try {
        let query = supabase
          .from('attractions')
          .select(
            `
            id,
            name,
            name_en,
            category,
            description,
            thumbnail,
            images,
            country_id,
            region_id,
            city_id,
            latitude,
            longitude,
            address,
            cities (
              name
            )
          `
          )
          .eq('is_active', true)
          .eq('country_id', selectedCountryId)
          .order('name')

        // 如果有選擇城市，進一步篩選
        if (selectedCityId) {
          query = query.eq('city_id', selectedCityId)
        }

        const { data, error } = await query

        if (error) throw error

        const formatted = (data || []).map((item: {
          id: string
          name: string
          name_en: string | null
          category: string | null
          description: string | null
          thumbnail: string | null
          images: string[] | null
          country_id: string
          region_id: string | null
          city_id: string | null
          latitude: number | null
          longitude: number | null
          address: string | null
          cities: { name: string } | null
        }): AttractionWithCity => ({
          id: item.id,
          name: item.name,
          name_en: item.name_en ?? undefined,
          category: item.category ?? undefined,
          description: item.description ?? undefined,
          thumbnail: item.thumbnail ?? undefined,
          images: item.images ?? undefined,
          country_id: item.country_id,
          region_id: item.region_id ?? undefined,
          city_id: item.city_id ?? undefined,
          latitude: item.latitude ?? undefined,
          longitude: item.longitude ?? undefined,
          address: item.address ?? undefined,
          city_name: item.cities?.name || '',
          is_active: true,
          display_order: 0,
          created_at: '',
          updated_at: '',
        }))

        setAttractions(formatted)
      } catch (error) {
        // 靜默失敗，使用空陣列
      } finally {
        setLoading(false)
      }
    }

    loadAttractions()
  }, [isOpen, selectedCountryId, selectedCityId])

  // 解析行程標題，找出可能的景點關鍵字
  const titleKeywords = useMemo(() => parseDayTitleForAttractions(dayTitle), [dayTitle])

  // 根據標題關鍵字匹配建議景點
  const suggestedAttractions = useMemo(() => {
    if (titleKeywords.length === 0 || attractions.length === 0) return []

    const suggestions: AttractionWithCity[] = []

    for (const keyword of titleKeywords) {
      const keywordLower = keyword.toLowerCase()
      // 找完全匹配或包含關鍵字的景點
      const matches = attractions.filter(a => {
        const nameLower = a.name.toLowerCase()
        // 完全匹配優先，其次包含
        return nameLower === keywordLower ||
               nameLower.includes(keywordLower) ||
               keywordLower.includes(nameLower)
      })

      for (const match of matches) {
        if (!suggestions.some(s => s.id === match.id)) {
          suggestions.push(match)
        }
      }
    }

    return suggestions
  }, [titleKeywords, attractions])

  // 搜尋過濾 + 建議景點優先排序
  const filteredAttractions = useMemo(() => {
    let results = attractions

    // 如果有搜尋，先過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        a =>
          a.name.toLowerCase().includes(query) ||
          a.name_en?.toLowerCase().includes(query) ||
          a.city_name?.toLowerCase().includes(query) ||
          a.category?.toLowerCase().includes(query)
      )
    }

    // 沒有搜尋時，把建議的景點排在最前面
    if (!searchQuery && suggestedAttractions.length > 0) {
      const suggestedIds = new Set(suggestedAttractions.map(s => s.id))
      const suggested = results.filter(a => suggestedIds.has(a.id))
      const others = results.filter(a => !suggestedIds.has(a.id))
      return [...suggested, ...others]
    }

    return results
  }, [attractions, searchQuery, suggestedAttractions])

  return {
    // 狀態
    selectedCountryId,
    selectedCityId,
    searchQuery,
    attractions: filteredAttractions,
    suggestedAttractions,
    loading,
    cities,
    countries,

    // 處理函數
    handleCountryChange,
    handleCityChange,
    setSearchQuery,
  }
}
