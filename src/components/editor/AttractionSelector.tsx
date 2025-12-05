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
import { Search, MapPin, ImageIcon, Loader2 } from 'lucide-react'
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
  tourCountries?: TourCountry[] // 行程涵蓋的國家
  onSelect: (attractions: AttractionWithCity[]) => void
}

// 使用 module-level 變數保存篩選狀態（半永久記憶）
let savedCountryId = ''
let savedCityId = ''

export function AttractionSelector({
  isOpen,
  onClose,
  tourCountries = [],
  onSelect,
}: AttractionSelectorProps) {
  // 從記憶中載入初始值
  const [selectedCountryId, setSelectedCountryId] = useState<string>(savedCountryId)
  const [selectedCityId, setSelectedCityId] = useState<string>(savedCityId)
  const [searchQuery, setSearchQuery] = useState('')
  const [attractions, setAttractions] = useState<AttractionWithCity[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const initialLoadDone = useRef(false)

  // 序列化 tourCountries 避免無限迴圈
  const tourCountryIds = useMemo(
    () => tourCountries.map(c => c.country_id).filter(Boolean),
    [tourCountries]
  )

  // 打開對話框時只清空勾選，保留篩選條件
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      // 從記憶中恢復篩選狀態
      if (!initialLoadDone.current) {
        setSelectedCountryId(savedCountryId)
        setSelectedCityId(savedCityId)
        initialLoadDone.current = true
      }
    }
  }, [isOpen])

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
          .order('name')

        // 如果有選擇城市，篩選該城市的景點
        if (selectedCityId) {
          query = query.eq('city_id', selectedCityId)
        } else if (selectedCountryId) {
          // 如果有選擇國家，篩選該國家的景點
          query = query.eq('country_id', selectedCountryId)
        } else if (tourCountryIds.length > 0) {
          // 如果沒選擇國家，但行程有設定國家，就篩選這些國家的景點
          query = query.in('country_id', tourCountryIds)
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
          city_id: string
          cities: { name: string }
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
          city_id: item.city_id,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedCountryId, selectedCityId, tourCountryIds.join(',')])

  // 搜尋過濾
  const filteredAttractions = useMemo(() => {
    if (!searchQuery) return attractions

    const query = searchQuery.toLowerCase()
    return attractions.filter(
      a =>
        a.name.toLowerCase().includes(query) ||
        a.name_en?.toLowerCase().includes(query) ||
        a.city_name?.toLowerCase().includes(query) ||
        a.category?.toLowerCase().includes(query)
    )
  }, [attractions, searchQuery])

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
            {tourCountries.length > 0 && (
              <select
                value={selectedCountryId}
                onChange={e => handleCountryChange(e.target.value)}
                className="px-4 py-2.5 border border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold transition-all"
              >
                <option value="">全部國家</option>
                {tourCountries.map(country => (
                  <option key={country.country_id} value={country.country_id}>
                    {country.country_name}
                  </option>
                ))}
              </select>
            )}

            {/* 城市選擇 */}
            {selectedCountryId && cities.length > 0 && (
              <select
                value={selectedCityId}
                onChange={e => handleCityChange(e.target.value)}
                className="px-4 py-2.5 border border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-morandi-gold/30 focus:border-morandi-gold transition-all"
              >
                <option value="">全部城市</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
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
          </div>

          {/* 景點列表 */}
          <div className="flex-1 overflow-y-auto border border-morandi-container/50 rounded-xl bg-white">
            {loading ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                <Loader2 className="animate-spin mr-2" size={20} />
                載入中...
              </div>
            ) : filteredAttractions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                {searchQuery ? '找不到符合的景點' : '沒有可選擇的景點'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3">
                {filteredAttractions.map(attraction => {
                  const image = getAttractionImage(attraction)
                  const isSelected = selectedIds.has(attraction.id)

                  return (
                    <label
                      key={attraction.id}
                      className={`
                        relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all
                        border-2 hover:shadow-md
                        ${isSelected
                          ? 'border-morandi-gold bg-morandi-gold/5 shadow-sm'
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
                        <div className="font-medium text-morandi-primary text-sm leading-tight line-clamp-2">
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
