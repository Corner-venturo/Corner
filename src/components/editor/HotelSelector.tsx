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
import { Search, Building2, ImageIcon, Loader2, Star, Crown, Plus, PenLine } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// 飯店型別
export interface LuxuryHotel {
  id: string
  name: string
  name_en: string | null
  brand: string | null
  country_id: string
  region_id: string | null
  city_id: string
  star_rating: number | null
  hotel_class: string | null
  category: string | null
  description: string | null
  highlights: string[] | null
  price_range: string | null
  avg_price_per_night: number | null
  thumbnail: string | null
  images: string[] | null
  is_active: boolean
  is_featured: boolean
  // Join fields
  region_name?: string
  city_name?: string
}

interface HotelSelectorProps {
  isOpen: boolean
  onClose: () => void
  tourCountryName?: string
  onSelect: (hotels: LuxuryHotel[]) => void
}

// 使用 localStorage 保存篩選狀態（避免全域變數導致的狀態不一致）
const STORAGE_KEY = 'hotel-selector-filters'

function getSavedFilters() {
  if (typeof window === 'undefined') return { countryId: '', regionId: '', cityId: '', brand: '' }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { countryId: '', regionId: '', cityId: '', brand: '' }
  } catch {
    return { countryId: '', regionId: '', cityId: '', brand: '' }
  }
}

function saveFilters(filters: { countryId: string; regionId: string; cityId: string; brand: string }) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // ignore
  }
}

// 品牌列表
const HOTEL_BRANDS = [
  'Aman',
  'Four Seasons',
  'Ritz-Carlton',
  'Park Hyatt',
  'Mandarin Oriental',
  'Peninsula',
  'St. Regis',
  'Conrad',
  'Waldorf Astoria',
  'InterContinental',
  'Capella',
  'Banyan Tree',
  'Sofitel Legend',
  'Shilla',
  'Signiel',
]

export function HotelSelector({
  isOpen,
  onClose,
  tourCountryName = '',
  onSelect,
}: HotelSelectorProps) {
  // 使用 ref 來追蹤是否已初始化
  const filtersInitialized = useRef(false)
  const savedFilters = useRef(getSavedFilters())

  const [selectedCountryId, setSelectedCountryId] = useState<string>('')
  const [selectedRegionId, setSelectedRegionId] = useState<string>('')
  const [selectedCityId, setSelectedCityId] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [hotels, setHotels] = useState<LuxuryHotel[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const initialLoadDone = useRef(false)

  // 手動新增飯店
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualHotelName, setManualHotelName] = useState('')

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

  // 打開對話框時自動選擇行程的國家
  React.useEffect(() => {
    if (isOpen && countries.length > 0) {
      setSelectedIds(new Set())

      // 重新讀取 localStorage
      savedFilters.current = getSavedFilters()

      if (tourCountryName) {
        const matchedCountry = countries.find(c => c.name === tourCountryName)
        if (matchedCountry && matchedCountry.id !== savedFilters.current.countryId) {
          setSelectedCountryId(matchedCountry.id)
          setSelectedRegionId('')
          setSelectedCityId('')
          setSelectedBrand('')
          saveFilters({ countryId: matchedCountry.id, regionId: '', cityId: '', brand: '' })
          return
        }
      }

      if (savedFilters.current.countryId) {
        setSelectedCountryId(savedFilters.current.countryId)
        setSelectedRegionId(savedFilters.current.regionId)
        setSelectedCityId(savedFilters.current.cityId)
        setSelectedBrand(savedFilters.current.brand)
      }
    }
  }, [isOpen, tourCountryName, countries])

  // 國家變更
  const handleCountryChange = (countryId: string) => {
    const value = countryId === '__all__' ? '' : countryId
    setSelectedCountryId(value)
    setSelectedRegionId('')
    setSelectedCityId('')
    saveFilters({ countryId: value, regionId: '', cityId: '', brand: selectedBrand })
  }

  // 區域變更
  const handleRegionChange = (regionId: string) => {
    const value = regionId === '__all__' ? '' : regionId
    setSelectedRegionId(value)
    setSelectedCityId('')
    saveFilters({ countryId: selectedCountryId, regionId: value, cityId: '', brand: selectedBrand })
  }

  // 城市變更
  const handleCityChange = (cityId: string) => {
    const value = cityId === '__all__' ? '' : cityId
    setSelectedCityId(value)
    saveFilters({ countryId: selectedCountryId, regionId: selectedRegionId, cityId: value, brand: selectedBrand })
  }

  // 品牌變更
  const handleBrandChange = (brand: string) => {
    const value = brand === '__all__' ? '' : brand
    setSelectedBrand(value)
    saveFilters({ countryId: selectedCountryId, regionId: selectedRegionId, cityId: selectedCityId, brand: value })
  }

  // 載入區域列表
  React.useEffect(() => {
    if (!isOpen || !selectedCountryId) {
      setRegions([])
      return
    }

    const loadRegions = async () => {
      const { data } = await supabase
        .from('regions')
        .select('id, name')
        .eq('country_id', selectedCountryId)
        .eq('is_active', true)
        .order('name')
      setRegions(data || [])
    }
    loadRegions()
  }, [isOpen, selectedCountryId])

  // 載入城市列表（根據區域或國家）
  React.useEffect(() => {
    if (!isOpen || !selectedCountryId) {
      setCities([])
      return
    }

    const loadCities = async () => {
      let query = supabase
        .from('cities')
        .select('id, name')
        .eq('country_id', selectedCountryId)
        .eq('is_active', true)
        .order('name')

      // 如果有選區域，只顯示該區域的城市
      if (selectedRegionId) {
        query = query.eq('region_id', selectedRegionId)
      }

      const { data } = await query
      setCities(data || [])
    }
    loadCities()
  }, [isOpen, selectedCountryId, selectedRegionId])

  // 載入飯店資料
  React.useEffect(() => {
    if (!isOpen) return

    const loadHotels = async () => {
      if (!selectedCountryId) {
        setHotels([])
        return
      }

      setLoading(true)
      try {
        let query = supabase
          .from('luxury_hotels')
          .select(`
            id, name, name_en, brand, country_id, region_id, city_id,
            star_rating, hotel_class, category, description,
            highlights, price_range, avg_price_per_night,
            thumbnail, images, is_active, is_featured,
            regions(name),
            cities!inner(name)
          `)
          .eq('is_active', true)
          .eq('country_id', selectedCountryId)
          .order('is_featured', { ascending: false })
          .order('display_order')

        // 區域篩選
        if (selectedRegionId) {
          query = query.eq('region_id', selectedRegionId)
        }

        // 城市篩選
        if (selectedCityId) {
          query = query.eq('city_id', selectedCityId)
        }

        // 品牌篩選
        if (selectedBrand) {
          query = query.eq('brand', selectedBrand)
        }

        const { data, error } = await query

        if (error) throw error

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = (data || []).map((item: any): LuxuryHotel => ({
          id: item.id,
          name: item.name,
          name_en: item.name_en,
          brand: item.brand,
          country_id: item.country_id,
          region_id: item.region_id || null,
          city_id: item.city_id,
          star_rating: item.star_rating,
          hotel_class: item.hotel_class,
          category: item.category,
          description: item.description,
          highlights: item.highlights,
          price_range: item.price_range,
          avg_price_per_night: item.avg_price_per_night,
          thumbnail: item.thumbnail,
          images: item.images,
          is_active: item.is_active ?? true,
          is_featured: item.is_featured ?? false,
          region_name: item.regions?.name || '',
          city_name: item.cities?.name || '',
        }))

        setHotels(formatted)
      } catch (error) {
        logger.error('Error loading hotels:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHotels()
  }, [isOpen, selectedCountryId, selectedRegionId, selectedCityId, selectedBrand])

  // 搜尋過濾
  const filteredHotels = useMemo(() => {
    if (!searchQuery) return hotels

    const query = searchQuery.toLowerCase()
    return hotels.filter(
      h =>
        h.name.toLowerCase().includes(query) ||
        h.name_en?.toLowerCase().includes(query) ||
        h.brand?.toLowerCase().includes(query) ||
        h.region_name?.toLowerCase().includes(query) ||
        h.city_name?.toLowerCase().includes(query)
    )
  }, [hotels, searchQuery])

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleConfirm = () => {
    const selected = hotels.filter(h => selectedIds.has(h.id))
    onSelect(selected)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds(new Set())
    setSearchQuery('')
    setShowManualInput(false)
    setManualHotelName('')
    onClose()
  }

  // 手動新增飯店
  const handleManualAdd = () => {
    if (!manualHotelName.trim()) return

    // 創建一個臨時的飯店物件
    const manualHotel: LuxuryHotel = {
      id: `manual_${Date.now()}`,
      name: manualHotelName.trim(),
      name_en: null,
      brand: null,
      country_id: selectedCountryId || '',
      region_id: null,
      city_id: selectedCityId || '',
      star_rating: null,
      hotel_class: null,
      category: null,
      description: null,
      highlights: null,
      price_range: null,
      avg_price_per_night: null,
      thumbnail: null,
      images: null,
      is_active: true,
      is_featured: false,
      city_name: cities.find(c => c.id === selectedCityId)?.name || '',
    }

    onSelect([manualHotel])
    setManualHotelName('')
    setShowManualInput(false)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const getHotelImage = (hotel: LuxuryHotel) => {
    return hotel.thumbnail || (hotel.images && hotel.images.length > 0 ? hotel.images[0] : null)
  }

  // 轉換價格等級顯示
  const getPriceDisplay = (priceRange: string | null) => {
    if (!priceRange) return ''
    const level = parseInt(priceRange)
    if (isNaN(level)) return priceRange
    return '$'.repeat(level)
  }

  // 轉換飯店等級顯示
  const getHotelClassLabel = (hotelClass: string | null) => {
    switch (hotelClass) {
      case 'ultra-luxury': return '頂級奢華'
      case 'luxury': return '奢華'
      case 'boutique': return '精品'
      default: return hotelClass
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="w-[800px] h-[700px] max-w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building2 className="text-amber-600" size={22} />
            選擇飯店
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          {/* 篩選區 - 第一排：國家、區域、城市 */}
          <div className="flex gap-3 flex-wrap">
            {/* 國家選擇 */}
            <Select value={selectedCountryId || '__all__'} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
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

            {/* 區域選擇 */}
            {selectedCountryId && regions.length > 0 && (
              <Select value={selectedRegionId || '__all__'} onValueChange={handleRegionChange}>
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                  <SelectValue placeholder="全部區域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部區域</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 城市選擇 */}
            {selectedCountryId && cities.length > 0 && (
              <Select value={selectedCityId || '__all__'} onValueChange={handleCityChange}>
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
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

            {/* 品牌選擇 */}
            <Select value={selectedBrand || '__all__'} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[140px] focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                <SelectValue placeholder="全部品牌" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部品牌</SelectItem>
                {HOTEL_BRANDS.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 搜尋框 */}
            <div className="flex-1 relative min-w-[180px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋飯店..."
                className="pl-10 h-11 rounded-xl border-morandi-container focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>

            {/* 手動新增按鈕 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              className={`rounded-xl h-11 gap-1.5 ${showManualInput ? 'bg-amber-50 border-amber-300' : ''}`}
            >
              <PenLine size={16} />
              手動輸入
            </Button>
          </div>

          {/* 手動輸入區 */}
          {showManualInput && (
            <div className="flex gap-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <Input
                value={manualHotelName}
                onChange={e => setManualHotelName(e.target.value)}
                placeholder="輸入飯店名稱..."
                className="flex-1 h-10 rounded-lg border-amber-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
                disabled={!manualHotelName.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-10 px-4 gap-1.5"
              >
                <Plus size={16} />
                新增
              </Button>
            </div>
          )}

          {/* 飯店列表 */}
          <div className="flex-1 overflow-y-auto border border-morandi-container/50 rounded-xl bg-white">
            {loading ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                <Loader2 className="animate-spin mr-2" size={20} />
                載入中...
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                {!selectedCountryId ? '請先選擇國家' : searchQuery ? '找不到符合的飯店' : '沒有可選擇的飯店'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3">
                {filteredHotels.map(hotel => {
                  const image = getHotelImage(hotel)
                  const isSelected = selectedIds.has(hotel.id)

                  return (
                    <label
                      key={hotel.id}
                      className={`
                        relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all
                        border-2 hover:shadow-md
                        ${isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                          : hotel.is_featured
                            ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50'
                            : 'border-transparent bg-morandi-container/20 hover:bg-morandi-container/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(hotel.id)}
                        className="sr-only"
                      />

                      {/* 縮圖 */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-morandi-container/30">
                        {image ? (
                          <img
                            src={image}
                            alt={hotel.name}
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
                        <div className="font-medium text-morandi-primary text-sm leading-tight line-clamp-1 flex items-center gap-1">
                          {hotel.is_featured && (
                            <Crown size={12} className="text-amber-500 flex-shrink-0" />
                          )}
                          {hotel.name}
                        </div>
                        {hotel.name_en && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {hotel.name_en}
                          </div>
                        )}
                        <div className="text-xs text-morandi-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                          {/* 顯示區域與城市 */}
                          {hotel.region_name && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {hotel.region_name}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-morandi-container/50 rounded">
                            {hotel.city_name}
                          </span>
                          {hotel.brand && (
                            <span className="text-amber-600 font-medium">
                              {hotel.brand}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1 flex items-center gap-2">
                          {hotel.star_rating && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star size={10} fill="currentColor" />
                              {hotel.star_rating}
                            </span>
                          )}
                          {hotel.hotel_class && (
                            <span className="text-purple-600">
                              {getHotelClassLabel(hotel.hotel_class)}
                            </span>
                          )}
                          {hotel.price_range && (
                            <span className="text-green-600 font-medium">
                              {getPriceDisplay(hotel.price_range)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 選中標記 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
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
            <div className="text-sm text-amber-800 bg-amber-100 px-4 py-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {selectedIds.size}
              </div>
              已選擇 {selectedIds.size} 間飯店
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
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl min-w-[120px]"
          >
            確認新增 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
