'use client'

import React, { useState, useMemo, useRef } from 'react'
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
import { Search, MapPin, ImageIcon, Loader2, Sparkles, Plus, PenLine } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { TourCountry } from './tour-form/types'
import { Attraction } from '@/features/attractions/types'

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
}: AttractionSelectorProps) {
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
    setSelectedCountryId(countryId)
    setSelectedCityId('')
    savedCountryId = countryId
    savedCityId = ''
  }

  // 更新城市時同步保存
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId)
    savedCityId = cityId
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

  // 載入景點資料
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
      <DialogContent className="w-[700px] h-[600px] max-w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-morandi-gold/10 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-morandi-gold" size={22} />
            選擇景點
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          {/* 篩選區 */}
          <div className="flex gap-3 flex-wrap">
            {/* 國家選擇 */}
            <Select value={selectedCountryId} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold">
                <SelectValue placeholder="全部國家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部國家</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 城市選擇 */}
            {selectedCountryId && cities.length > 0 && (
              <Select value={selectedCityId} onValueChange={handleCityChange}>
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold">
                  <SelectValue placeholder="全部城市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部城市</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 搜尋框 */}
            <div className="flex-1 relative min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋景點名稱..."
                className="pl-10 h-11 rounded-xl border-morandi-container focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold"
              />
            </div>

            {/* 手動新增按鈕 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              className={`rounded-xl h-11 gap-1.5 ${showManualInput ? 'bg-morandi-gold/10 border-morandi-gold/30' : ''}`}
            >
              <PenLine size={16} />
              手動輸入
            </Button>
          </div>

          {/* 手動輸入區 */}
          {showManualInput && (
            <div className="flex gap-2 p-3 bg-morandi-gold/5 border border-morandi-gold/20 rounded-xl">
              <Input
                value={manualAttractionName}
                onChange={e => setManualAttractionName(e.target.value)}
                placeholder="輸入景點名稱..."
                className="flex-1 h-10 rounded-lg border-morandi-gold/20 focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold"
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
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg h-10 px-4 gap-1.5"
              >
                <Plus size={16} />
                新增
              </Button>
            </div>
          )}

          {/* 景點列表 */}
          <div className="flex-1 overflow-y-auto border border-morandi-container/50 rounded-xl bg-white">
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
              <div className="grid grid-cols-2 gap-3 p-3">
                {filteredAttractions.map(attraction => {
                  const image = getAttractionImage(attraction)
                  const isSelected = selectedIds.has(attraction.id)
                  const isSuggested = suggestedAttractions.some(s => s.id === attraction.id)

                  return (
                    <label
                      key={attraction.id}
                      className={`
                        relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all
                        border-2 hover:shadow-md
                        ${isSelected
                          ? 'border-morandi-gold bg-morandi-gold/5 shadow-sm'
                          : isSuggested
                            ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50'
                            : 'border-transparent bg-morandi-container/20 hover:bg-morandi-container/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(attraction.id)}
                        className="sr-only"
                      />

                      {/* 縮圖 */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-morandi-container/30">
                        {image ? (
                          <img
                            src={image}
                            alt={attraction.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-morandi-secondary/50">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>

                      {/* 資訊 */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="font-medium text-morandi-primary text-sm leading-tight line-clamp-2 flex items-center gap-1">
                          {isSuggested && (
                            <Sparkles size={12} className="text-amber-500 flex-shrink-0" />
                          )}
                          {attraction.name}
                        </div>
                        {attraction.name_en && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {attraction.name_en}
                          </div>
                        )}
                        <div className="text-xs text-morandi-secondary mt-1 flex items-center gap-1.5">
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

                      {/* 選中標記 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-morandi-gold rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* 已選擇提示 */}
          {selectedIds.size > 0 && (
            <div className="text-sm text-morandi-primary bg-morandi-gold/10 px-4 py-2.5 rounded-xl border border-morandi-gold/20 flex items-center gap-2">
              <div className="w-6 h-6 bg-morandi-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                {selectedIds.size}
              </div>
              已選擇 {selectedIds.size} 個景點
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
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
