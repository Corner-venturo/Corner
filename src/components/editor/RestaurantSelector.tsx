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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, UtensilsCrossed, ImageIcon, Loader2, Users, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// 餐廳型別
export interface Restaurant {
  id: string
  name: string
  name_en: string | null
  country_id: string
  region_id: string | null
  city_id: string
  cuisine_type: string[] | null
  category: string | null
  meal_type: string[] | null
  description: string | null
  specialties: string[] | null
  price_range: string | null
  avg_price_lunch: number | null
  avg_price_dinner: number | null
  group_friendly: boolean
  max_group_size: number | null
  group_menu_available: boolean
  private_room: boolean
  thumbnail: string | null
  images: string[] | null
  rating: number | null
  is_active: boolean
  is_featured: boolean
  // Join fields
  region_name?: string
  city_name?: string
}

// 米其林餐廳型別（從現有表格）
export interface MichelinRestaurant {
  id: string
  name: string
  name_en: string | null
  country_id: string
  city_id: string
  michelin_stars: number | null
  bib_gourmand: boolean | null
  green_star: boolean | null
  cuisine_type: string[] | null
  description: string | null
  signature_dishes: string[] | null
  price_range: string | null
  avg_price_lunch: number | null
  avg_price_dinner: number | null
  group_friendly: boolean | null
  max_group_size: number | null
  group_menu_available: boolean | null
  private_room: boolean | null
  thumbnail: string | null
  images: string[] | null
  is_active: boolean | null
  // Join fields
  region_name?: string
  city_name?: string
}

type CombinedRestaurant = (Restaurant | MichelinRestaurant) & {
  source: 'restaurant' | 'michelin'
  region_name?: string
  city_name?: string
}

interface RestaurantSelectorProps {
  isOpen: boolean
  onClose: () => void
  tourCountryName?: string
  onSelect: (restaurants: CombinedRestaurant[]) => void
  includeMichelin?: boolean  // 是否包含米其林餐廳
}

// 保存篩選狀態
let savedCountryId = ''
let savedRegionId = ''
let savedCityId = ''
let savedCategory = ''

// 餐廳分類
const RESTAURANT_CATEGORIES = [
  { value: 'fine-dining', label: '高級餐廳' },
  { value: 'casual', label: '休閒餐廳' },
  { value: 'local', label: '在地美食' },
  { value: 'buffet', label: '自助餐' },
  { value: 'izakaya', label: '居酒屋' },
]

export function RestaurantSelector({
  isOpen,
  onClose,
  tourCountryName = '',
  onSelect,
  includeMichelin = true,
}: RestaurantSelectorProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<string>(savedCountryId)
  const [selectedRegionId, setSelectedRegionId] = useState<string>(savedRegionId)
  const [selectedCityId, setSelectedCityId] = useState<string>(savedCityId)
  const [selectedCategory, setSelectedCategory] = useState<string>(savedCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurants, setRestaurants] = useState<CombinedRestaurant[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [showMichelinOnly, setShowMichelinOnly] = useState(false)

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

      if (tourCountryName) {
        const matchedCountry = countries.find(c => c.name === tourCountryName)
        if (matchedCountry && matchedCountry.id !== savedCountryId) {
          setSelectedCountryId(matchedCountry.id)
          savedCountryId = matchedCountry.id
          setSelectedRegionId('')
          savedRegionId = ''
          setSelectedCityId('')
          savedCityId = ''
          return
        }
      }

      if (savedCountryId) {
        setSelectedCountryId(savedCountryId)
        setSelectedRegionId(savedRegionId)
        setSelectedCityId(savedCityId)
        setSelectedCategory(savedCategory)
      }
    }
  }, [isOpen, tourCountryName, countries])

  // 國家變更
  const handleCountryChange = (countryId: string) => {
    const value = countryId === '__all__' ? '' : countryId
    setSelectedCountryId(value)
    setSelectedRegionId('')
    setSelectedCityId('')
    savedCountryId = value
    savedRegionId = ''
    savedCityId = ''
  }

  // 區域變更
  const handleRegionChange = (regionId: string) => {
    const value = regionId === '__all__' ? '' : regionId
    setSelectedRegionId(value)
    setSelectedCityId('')
    savedRegionId = value
    savedCityId = ''
  }

  // 城市變更
  const handleCityChange = (cityId: string) => {
    const value = cityId === '__all__' ? '' : cityId
    setSelectedCityId(value)
    savedCityId = value
  }

  // 分類變更
  const handleCategoryChange = (category: string) => {
    const value = category === '__all__' ? '' : category
    setSelectedCategory(value)
    savedCategory = value
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

  // 載入餐廳資料（包含一般餐廳和米其林餐廳）
  React.useEffect(() => {
    if (!isOpen) return

    const loadRestaurants = async () => {
      if (!selectedCountryId) {
        setRestaurants([])
        return
      }

      setLoading(true)
      try {
        const results: CombinedRestaurant[] = []

        // 1. 載入一般餐廳
        if (!showMichelinOnly) {
          let restaurantQuery = supabase
            .from('restaurants')
            .select(`
              id, name, name_en, country_id, region_id, city_id,
              cuisine_type, category, meal_type, description,
              specialties, price_range, avg_price_lunch, avg_price_dinner,
              group_friendly, max_group_size, group_menu_available,
              private_room, thumbnail, images, rating, is_active, is_featured,
              regions(name),
              cities!inner(name)
            `)
            .eq('is_active', true)
            .eq('country_id', selectedCountryId)
            .order('is_featured', { ascending: false })
            .order('display_order')

          // 區域篩選
          if (selectedRegionId) {
            restaurantQuery = restaurantQuery.eq('region_id', selectedRegionId)
          }

          // 城市篩選
          if (selectedCityId) {
            restaurantQuery = restaurantQuery.eq('city_id', selectedCityId)
          }

          // 分類篩選
          if (selectedCategory) {
            restaurantQuery = restaurantQuery.eq('category', selectedCategory)
          }

          const { data: restaurantData } = await restaurantQuery

          if (restaurantData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            restaurantData.forEach((item: any) => {
              results.push({
                id: item.id,
                name: item.name,
                name_en: item.name_en,
                country_id: item.country_id,
                region_id: item.region_id || null,
                city_id: item.city_id,
                cuisine_type: item.cuisine_type,
                category: item.category,
                meal_type: item.meal_type,
                description: item.description,
                specialties: item.specialties,
                price_range: item.price_range,
                avg_price_lunch: item.avg_price_lunch,
                avg_price_dinner: item.avg_price_dinner,
                group_friendly: item.group_friendly ?? true,
                max_group_size: item.max_group_size,
                group_menu_available: item.group_menu_available ?? false,
                private_room: item.private_room ?? false,
                thumbnail: item.thumbnail,
                images: item.images,
                rating: item.rating,
                is_active: item.is_active ?? true,
                is_featured: item.is_featured ?? false,
                source: 'restaurant' as const,
                region_name: item.regions?.name || '',
                city_name: item.cities?.name || '',
              })
            })
          }
        }

        // 2. 載入米其林餐廳
        if (includeMichelin) {
          let michelinQuery = supabase
            .from('michelin_restaurants')
            .select(`
              id, name, name_en, country_id, city_id,
              michelin_stars, bib_gourmand, green_star,
              cuisine_type, description, signature_dishes,
              price_range, avg_price_lunch, avg_price_dinner,
              max_group_size, group_menu_available,
              thumbnail, images, is_active,
              cities!inner(name)
            `)
            .eq('is_active', true)
            .eq('country_id', selectedCountryId)
            .order('michelin_stars', { ascending: false })

          // 城市篩選
          if (selectedCityId) {
            michelinQuery = michelinQuery.eq('city_id', selectedCityId)
          }

          const { data: michelinData } = await michelinQuery

          if (michelinData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            michelinData.forEach((item: any) => {
              results.push({
                id: item.id,
                name: item.name,
                name_en: item.name_en,
                country_id: item.country_id,
                city_id: item.city_id,
                michelin_stars: item.michelin_stars,
                bib_gourmand: item.bib_gourmand,
                green_star: item.green_star,
                cuisine_type: item.cuisine_type,
                description: item.description,
                signature_dishes: item.signature_dishes,
                price_range: item.price_range,
                avg_price_lunch: item.avg_price_lunch,
                avg_price_dinner: item.avg_price_dinner,
                group_friendly: true,
                max_group_size: item.max_group_size,
                group_menu_available: item.group_menu_available ?? false,
                private_room: false,
                thumbnail: item.thumbnail,
                images: item.images,
                is_active: item.is_active ?? true,
                source: 'michelin' as const,
                city_name: item.cities?.name || '',
              })
            })
          }
        }

        // 排序：米其林優先，然後是精選
        results.sort((a, b) => {
          if (a.source === 'michelin' && b.source !== 'michelin') return -1
          if (a.source !== 'michelin' && b.source === 'michelin') return 1
          return 0
        })

        setRestaurants(results)
      } catch (error) {
        logger.error('Error loading restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [isOpen, selectedCountryId, selectedRegionId, selectedCityId, selectedCategory, includeMichelin, showMichelinOnly])

  // 搜尋過濾
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants

    if (showMichelinOnly) {
      filtered = filtered.filter(r => r.source === 'michelin')
    }

    if (!searchQuery) return filtered

    const query = searchQuery.toLowerCase()
    return filtered.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.name_en?.toLowerCase().includes(query) ||
        r.region_name?.toLowerCase().includes(query) ||
        r.city_name?.toLowerCase().includes(query) ||
        r.cuisine_type?.some(c => c.toLowerCase().includes(query))
    )
  }, [restaurants, searchQuery, showMichelinOnly])

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
    const selected = restaurants.filter(r => selectedIds.has(r.id))
    onSelect(selected)
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const getRestaurantImage = (restaurant: CombinedRestaurant) => {
    return restaurant.thumbnail || (restaurant.images && restaurant.images.length > 0 ? restaurant.images[0] : null)
  }

  // 取得米其林星級顯示
  const getMichelinDisplay = (restaurant: CombinedRestaurant) => {
    if (restaurant.source !== 'michelin') return null
    const michelin = restaurant as MichelinRestaurant

    if (michelin.michelin_stars && michelin.michelin_stars > 0) {
      return (
        <span className="flex items-center gap-0.5 text-red-500">
          {Array(michelin.michelin_stars).fill(0).map((_, i) => (
            <Star key={i} size={10} fill="currentColor" />
          ))}
        </span>
      )
    }
    if (michelin.bib_gourmand) {
      return <span className="text-xs text-orange-500 font-medium">必比登</span>
    }
    if (michelin.green_star) {
      return <span className="text-xs text-green-600 font-medium">綠星</span>
    }
    return <span className="text-xs text-red-400">米其林推薦</span>
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="w-[800px] h-[700px] max-w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-rose-50 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="text-rose-500" size={22} />
            選擇餐廳
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          {/* 篩選區 - 國家、區域、城市 */}
          <div className="flex gap-3 flex-wrap">
            {/* 國家選擇 */}
            <Select value={selectedCountryId || '__all__'} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500">
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
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500">
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
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500">
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

            {/* 分類選擇 */}
            {!showMichelinOnly && (
              <Select value={selectedCategory || '__all__'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-11 px-4 border-morandi-container rounded-xl text-sm bg-white min-w-[120px] focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500">
                  <SelectValue placeholder="全部分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部分類</SelectItem>
                  {RESTAURANT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 米其林篩選 */}
            {includeMichelin && (
              <button
                onClick={() => setShowMichelinOnly(!showMichelinOnly)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  showMichelinOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-morandi-container text-morandi-secondary hover:bg-red-50'
                }`}
              >
                <Star size={14} className="inline mr-1" />
                米其林
              </button>
            )}

            {/* 搜尋框 */}
            <div className="flex-1 relative min-w-[160px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋餐廳..."
                className="pl-10 h-11 rounded-xl border-morandi-container focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />
            </div>
          </div>

          {/* 餐廳列表 */}
          <div className="flex-1 overflow-y-auto border border-morandi-container/50 rounded-xl bg-white">
            {loading ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                <Loader2 className="animate-spin mr-2" size={20} />
                載入中...
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="h-full flex items-center justify-center text-morandi-secondary">
                {!selectedCountryId ? '請先選擇國家' : searchQuery ? '找不到符合的餐廳' : '沒有可選擇的餐廳'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3">
                {filteredRestaurants.map(restaurant => {
                  const image = getRestaurantImage(restaurant)
                  const isSelected = selectedIds.has(restaurant.id)
                  const isMichelin = restaurant.source === 'michelin'

                  return (
                    <label
                      key={`${restaurant.source}-${restaurant.id}`}
                      className={`
                        relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all
                        border-2 hover:shadow-md
                        ${isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-sm'
                          : isMichelin
                            ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50'
                            : 'border-transparent bg-morandi-container/20 hover:bg-morandi-container/30'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(restaurant.id)}
                        className="sr-only"
                      />

                      {/* 縮圖 */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-morandi-container/30">
                        {image ? (
                          <img
                            src={image}
                            alt={restaurant.name}
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
                          {isMichelin && getMichelinDisplay(restaurant)}
                          {restaurant.name}
                        </div>
                        {restaurant.name_en && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {restaurant.name_en}
                          </div>
                        )}
                        <div className="text-xs text-morandi-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                          {/* 顯示區域與城市 */}
                          {restaurant.region_name && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {restaurant.region_name}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-morandi-container/50 rounded">
                            {restaurant.city_name}
                          </span>
                          {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                            <span className="text-rose-600">
                              {restaurant.cuisine_type[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1 flex items-center gap-2">
                          {restaurant.group_friendly && (
                            <span className="flex items-center gap-0.5 text-blue-500">
                              <Users size={10} />
                              團體
                            </span>
                          )}
                          {'private_room' in restaurant && restaurant.private_room && (
                            <span className="text-purple-500">
                              包廂
                            </span>
                          )}
                          {restaurant.price_range && (
                            <span className="text-green-600 font-medium">
                              {'$'.repeat(parseInt(restaurant.price_range) || 2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 選中標記 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
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
            <div className="text-sm text-rose-800 bg-rose-100 px-4 py-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {selectedIds.size}
              </div>
              已選擇 {selectedIds.size} 間餐廳
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
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl min-w-[120px]"
          >
            確認新增 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
