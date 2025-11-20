'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin } from 'lucide-react'
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

export function AttractionSelector({
  isOpen,
  onClose,
  tourCountries = [],
  onSelect,
}: AttractionSelectorProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<string>('')
  const [selectedCityId, setSelectedCityId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [attractions, setAttractions] = useState<AttractionWithCity[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])

  // 序列化 tourCountries 避免無限迴圈
  const tourCountryIds = useMemo(
    () => tourCountries.map(c => c.country_id).filter(Boolean),
    [tourCountries]
  )

  // 打開對話框時清空選擇
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      setSearchQuery('')
      setSelectedCityId('')
    }
  }, [isOpen])

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

        // 轉換資料格式
        const formatted = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          name_en: item.name_en,
          category: item.category,
          description: item.description,
          thumbnail: item.thumbnail,
          country_id: item.country_id,
          region_id: item.region_id,
          city_id: item.city_id,
          city_name: item.cities?.name || '',
        }))

        setAttractions(formatted as any)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="text-morandi-gold" size={20} />
            選擇景點
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 篩選區 */}
          <div className="flex gap-3">
            {/* 國家選擇 */}
            {tourCountries.length > 0 && (
              <select
                value={selectedCountryId}
                onChange={e => {
                  setSelectedCountryId(e.target.value)
                  setSelectedCityId('')
                  setSearchQuery('')
                }}
                className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[150px]"
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
                onChange={e => {
                  setSelectedCityId(e.target.value)
                  setSearchQuery('')
                }}
                className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[150px]"
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
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋景點名稱、城市..."
                className="pl-10"
              />
            </div>
          </div>

          {/* 景點列表 */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-gray-500">載入中...</div>
            ) : filteredAttractions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? '找不到符合的景點' : '沒有可選擇的景點'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredAttractions.map(attraction => (
                  <label
                    key={attraction.id}
                    className="flex items-start gap-3 p-3 hover:bg-morandi-container/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(attraction.id)}
                      onChange={() => toggleSelection(attraction.id)}
                      className="mt-1 rounded"
                    />

                    {/* 縮圖 */}
                    {attraction.thumbnail && (
                      <img
                        src={attraction.thumbnail}
                        alt={attraction.name}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* 資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-morandi-primary truncate">
                        {attraction.name}
                      </div>
                      {attraction.name_en && (
                        <div className="text-xs text-gray-500 truncate">{attraction.name_en}</div>
                      )}
                      <div className="text-xs text-morandi-secondary mt-1 flex items-center gap-2">
                        <span>{attraction.city_name}</span>
                        {attraction.category && (
                          <>
                            <span>·</span>
                            <span>{attraction.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 已選擇提示 */}
          {selectedIds.size > 0 && (
            <div className="text-sm text-morandi-secondary bg-morandi-container/10 px-3 py-2 rounded">
              已選擇 <span className="font-semibold text-morandi-gold">{selectedIds.size}</span>{' '}
              個景點
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            確認新增 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
