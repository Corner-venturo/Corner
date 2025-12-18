'use client'

import React, { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, ImageIcon, Loader2, Sparkles, Plus, PenLine, Map, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { TourCountry } from './tour-form/types'
import { Attraction } from '@/features/attractions/types'

// 使用 Next.js dynamic import 並禁用 SSR
const AttractionsMap = dynamic(
  () => import('@/features/attractions/components/AttractionsMap').then((mod) => mod.AttractionsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    ),
  }
)

// 擴展型別（加入 join 查詢的欄位）
interface AttractionWithCity extends Attraction {
  city_name?: string
  region_name?: string
}

interface AttractionSelectorProps {
  isOpen: boolean
  onClose: () => void
  tourCountries?: TourCountry[] // 用於預設選擇第一個國家（舊版）
  tourCountryName?: string // 行程的國家名稱（新版，來自 CoverInfo）
  onSelect: (attractions: AttractionWithCity[]) => void
  dayTitle?: string // 當天的行程標題，用於智能建議
  existingIds?: string[] // 已選過的景點 ID（顯示鎖定狀態）
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

export function AttractionSelector({
  isOpen,
  onClose,
  tourCountries = [],
  tourCountryName = '',
  onSelect,
  dayTitle = '',
  existingIds = [],
}: AttractionSelectorProps) {
  // 已選過的景點 ID Set（用於快速查找）
  const existingIdsSet = useMemo(() => new Set(existingIds), [existingIds])

  // 從記憶中載入初始值
  const [selectedCountryId, setSelectedCountryId] = useState<string>(savedCountryId)
  const [selectedCityId, setSelectedCityId] = useState<string>(savedCityId)
  const [searchQuery, setSearchQuery] = useState('')
  const [attractions, setAttractions] = useState<AttractionWithCity[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const initialLoadDone = useRef(false)

  // 手動新增景點
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAttractionName, setManualAttractionName] = useState('')

  // 地圖相關狀態
  const [selectedMapAttraction, setSelectedMapAttraction] = useState<AttractionWithCity | null>(null)
  const [showMap, setShowMap] = useState(false)

  // 載入所有國家
  React.useEffect(() => {
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

  // 打開對話框時只清空勾選，並自動選擇行程的國家
  React.useEffect(() => {
    if (isOpen && countries.length > 0) {
      setSelectedIds(new Set())
      setSelectedMapAttraction(null)
      setShowMap(false)

      // 優先使用 tourCountryName（從 CoverInfo 來的國家名稱）
      if (tourCountryName) {
        const matchedCountry = countries.find(c => c.name === tourCountryName)
        if (matchedCountry && matchedCountry.id !== savedCountryId) {
          setSelectedCountryId(matchedCountry.id)
          savedCountryId = matchedCountry.id
          setSelectedCityId('')
          savedCityId = ''
          return
        }
      }

      // 其次使用 tourCountries（舊版，陣列格式）
      if (tourCountries.length > 0) {
        const firstCountryId = tourCountries[0].country_id
        if (!savedCountryId || !tourCountries.some(c => c.country_id === savedCountryId)) {
          setSelectedCountryId(firstCountryId)
          savedCountryId = firstCountryId
          setSelectedCityId('')
          savedCityId = ''
          return
        }
      }

      // 最後使用記憶的國家
      if (savedCountryId) {
        setSelectedCountryId(savedCountryId)
        setSelectedCityId(savedCityId)
      }
    }
  }, [isOpen, tourCountries, tourCountryName, countries])

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
  React.useEffect(() => {
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
  React.useEffect(() => {
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
            cities!inner (
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

  // 切換選擇
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  // 點擊景點查看地圖
  const handleViewOnMap = (attraction: AttractionWithCity) => {
    console.log('[景點選擇器] 點擊查看地圖:', attraction.name, '座標:', attraction.latitude, attraction.longitude)
    setSelectedMapAttraction(attraction)
    setShowMap(true)
  }

  // 確認選擇
  const handleConfirm = () => {
    const selected = attractions.filter(a => selectedIds.has(a.id))
    onSelect(selected)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  // 取消
  const handleCancel = () => {
    setSelectedIds(new Set())
    setSearchQuery('')
    setShowManualInput(false)
    setManualAttractionName('')
    setSelectedMapAttraction(null)
    setShowMap(false)
    onClose()
  }

  // 手動新增景點
  const handleManualAdd = () => {
    if (!manualAttractionName.trim()) return

    // 創建一個臨時的景點物件
    const manualAttraction: AttractionWithCity = {
      id: `manual_${Date.now()}`,
      name: manualAttractionName.trim(),
      name_en: undefined,
      category: undefined,
      description: undefined,
      thumbnail: undefined,
      images: undefined,
      country_id: selectedCountryId || '',
      region_id: undefined,
      city_id: selectedCityId || '',
      city_name: cities.find(c => c.id === selectedCityId)?.name || '',
      is_active: true,
      display_order: 0,
      created_at: '',
      updated_at: '',
    }

    onSelect([manualAttraction])
    setManualAttractionName('')
    setShowManualInput(false)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  // 取得景點圖片（優先 thumbnail，其次 images[0]）
  const getAttractionImage = (attraction: AttractionWithCity) => {
    return attraction.thumbnail || (attraction.images && attraction.images.length > 0 ? attraction.images[0] : null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="w-[1200px] h-[700px] max-w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-morandi-gold/10 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-morandi-gold" size={22} />
            選擇景點
          </DialogTitle>
        </DialogHeader>

        {/* 主要內容：左右分欄 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左側：景點列表 */}
          <div className="w-1/2 flex flex-col border-r border-border">
            <div className="p-4 space-y-3">
              {/* 篩選區 */}
              <div className="flex gap-2 flex-wrap">
                {/* 國家選擇 */}
                <Select value={selectedCountryId || '__all__'} onValueChange={handleCountryChange}>
                  <SelectTrigger className="h-9 px-3 border-morandi-container rounded-lg text-sm bg-white min-w-[120px]">
                    <SelectValue placeholder="全部國家" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部國家</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 城市選擇 */}
                {selectedCountryId && cities.length > 0 && (
                  <Select value={selectedCityId || '__all__'} onValueChange={handleCityChange}>
                    <SelectTrigger className="h-9 px-3 border-morandi-container rounded-lg text-sm bg-white min-w-[120px]">
                      <SelectValue placeholder="全部城市" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">全部城市</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* 手動新增按鈕 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className={`rounded-lg h-9 gap-1 ${showManualInput ? 'bg-morandi-gold/10 border-morandi-gold/30' : ''}`}
                >
                  <PenLine size={14} />
                  手動
                </Button>
              </div>

              {/* 搜尋框 */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜尋景點名稱..."
                  className="pl-9 h-9 rounded-lg border-morandi-container"
                />
              </div>

              {/* 手動輸入區 */}
              {showManualInput && (
                <div className="flex gap-2 p-2 bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg">
                  <Input
                    value={manualAttractionName}
                    onChange={e => setManualAttractionName(e.target.value)}
                    placeholder="輸入景點名稱..."
                    className="flex-1 h-8 rounded-md text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleManualAdd()
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleManualAdd}
                    disabled={!manualAttractionName.trim()}
                    size="sm"
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md h-8 px-3"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              )}
            </div>

            {/* 景點列表 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="h-full flex items-center justify-center text-morandi-secondary">
                  <Loader2 className="animate-spin mr-2" size={20} />
                  載入中...
                </div>
              ) : filteredAttractions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-morandi-secondary">
                  {!selectedCountryId ? '請先選擇國家' : searchQuery ? '找不到符合的景點' : '沒有可選擇的景點'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAttractions.map(attraction => {
                    const image = getAttractionImage(attraction)
                    const isSelected = selectedIds.has(attraction.id)
                    const isSuggested = suggestedAttractions.some(s => s.id === attraction.id)
                    const hasCoordinates = attraction.latitude && attraction.longitude
                    const isExisting = existingIdsSet.has(attraction.id) // 已在其他天選過

                    return (
                      <div
                        key={attraction.id}
                        className={`
                          relative flex gap-3 p-2.5 rounded-xl transition-all
                          border hover:shadow-sm
                          ${isExisting
                            ? 'border-slate-200 bg-slate-50 opacity-60'
                            : isSelected
                              ? 'border-morandi-gold bg-morandi-gold/5'
                              : isSuggested
                                ? 'border-amber-300 bg-amber-50/50'
                                : 'border-transparent bg-morandi-container/20 hover:bg-morandi-container/30'
                          }
                        `}
                      >
                        {/* 勾選框 */}
                        <label className={`flex items-center ${isExisting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected || isExisting}
                            onChange={() => !isExisting && toggleSelection(attraction.id)}
                            disabled={isExisting}
                            className={`w-4 h-4 rounded border-gray-300 focus:ring-morandi-gold ${isExisting ? 'text-slate-400' : 'text-morandi-gold'}`}
                          />
                        </label>

                        {/* 縮圖 */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-morandi-container/30">
                          {image ? (
                            <img
                              src={image}
                              alt={attraction.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-morandi-secondary/50">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>

                        {/* 資訊 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="font-medium text-morandi-primary text-sm leading-tight line-clamp-1 flex items-center gap-1">
                            {isSuggested && (
                              <Sparkles size={12} className="text-amber-500 flex-shrink-0" />
                            )}
                            {attraction.name}
                            {isExisting && (
                              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-500 rounded">
                                已選
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-morandi-secondary mt-0.5 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-morandi-container/50 rounded">
                              {attraction.city_name}
                            </span>
                            {attraction.category && (
                              <span className="text-morandi-secondary/70">
                                {attraction.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 查看地圖按鈕 */}
                        {hasCoordinates && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOnMap(attraction)}
                            className={`h-8 px-2 rounded-lg ${selectedMapAttraction?.id === attraction.id ? 'bg-blue-100 text-blue-600' : ''}`}
                            title="查看附近景點"
                          >
                            <Map size={16} />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 已選擇提示 */}
            {selectedIds.size > 0 && (
              <div className="px-4 pb-4">
                <div className="text-sm text-morandi-primary bg-morandi-gold/10 px-3 py-2 rounded-lg border border-morandi-gold/20 flex items-center gap-2">
                  <div className="w-5 h-5 bg-morandi-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {selectedIds.size}
                  </div>
                  已選擇 {selectedIds.size} 個景點
                </div>
              </div>
            )}
          </div>

          {/* 右側：地圖區域 */}
          <div className="w-1/2 flex flex-col bg-slate-50">
            {!showMap ? (
              // 初始提示畫面
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Map size={56} className="mb-4 opacity-30" />
                <p className="text-lg font-medium text-slate-500">查看附近景點</p>
                <p className="text-sm mt-2 text-center max-w-xs">
                  點擊景點右側的 <Map size={14} className="inline mx-1" /> 按鈕，即可在地圖上查看該景點周圍 5 公里內的其他景點
                </p>
              </div>
            ) : (
              // 地圖區域
              <>
                {/* 地圖標題 */}
                <div className="px-4 py-3 bg-white border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" />
                    <span className="font-medium text-morandi-primary">{selectedMapAttraction?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowMap(false)
                      setSelectedMapAttraction(null)
                    }}
                    className="h-7 px-2"
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* 地圖 */}
                <div className="flex-1 relative min-h-[400px]">
                  <AttractionsMap
                    attractions={attractions as Attraction[]}
                    selectedAttraction={selectedMapAttraction as Attraction}
                    radiusKm={5}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-gray-50/50">
          <Button variant="outline" onClick={handleCancel} className="rounded-xl">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-xl min-w-[120px]"
          >
            確認新增 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
