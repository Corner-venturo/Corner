'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useRegionsStore } from '@/stores'
import { useAttractionsData } from '../../hooks/useAttractionsData'
import { useAttractionsFilters } from '../../hooks/useAttractionsFilters'
import { useAttractionsDialog } from '../../hooks/useAttractionsDialog'
import { useAttractionsReorder } from '../../hooks/useAttractionsReorder'
import { AttractionsList } from '../AttractionsList'
import { SortableAttractionsList } from '../SortableAttractionsList'
import { AttractionsDialog } from '../AttractionsDialog'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, List } from 'lucide-react'
import type { Country, City } from '@/stores/region-store'

// ============================================
// 景點管理分頁
// ============================================

// 將狀態和函數導出，讓父組件可以使用
export interface AttractionsTabProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedCountry: string
  openAdd: () => void
}

export default function AttractionsTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedCountry,
  openAdd,
}: AttractionsTabProps) {
  // 用於顯示的國家和城市資料（從景點載入後，按需從資料庫查詢）
  const [displayCountries, setDisplayCountries] = useState<Country[]>([])
  const [displayCities, setDisplayCities] = useState<City[]>([])
  // 排序模式控制
  const [isReorderMode, setIsReorderMode] = useState(false)

  const { attractions, loading, addAttraction, updateAttraction, deleteAttraction, toggleStatus } =
    useAttractionsData()

  const { isEditOpen, editingAttraction, openEdit, closeEdit } = useAttractionsDialog()
  const { reorderAttractions, moveUp, moveDown } = useAttractionsReorder()

  // 當景點載入後，取得所有用到的國家和城市 ID，然後查詢這些資料
  useEffect(() => {
    if (attractions.length > 0) {
      const countryIds = Array.from(new Set(attractions.map(a => a.country_id).filter((id): id is string => !!id)))
      const cityIds = Array.from(new Set(attractions.map(a => a.city_id).filter((id): id is string => !!id)))

      // 載入這些國家
      if (countryIds.length > 0) {
        supabase
          .from('countries')
          .select('*')
          .in('id', countryIds)
          .then(({ data, error }) => {
            if (error) {
              logger.error('載入國家失敗:', error)
              return
            }
            if (data) setDisplayCountries(data as Country[])
          })
      }

      // 載入這些城市
      if (cityIds.length > 0) {
        supabase
          .from('cities')
          .select('*')
          .in('id', cityIds)
          .then(({ data, error }) => {
            if (error) {
              logger.error('載入城市失敗:', error)
              return
            }
            if (data) setDisplayCities(data as City[])
          })
      }
    }
  }, [attractions])

  const { sortedAttractions } = useAttractionsFilters({
    attractions,
    cities: displayCities,
    searchTerm,
    selectedCategory,
    selectedCountry,
    selectedRegion: '', // 不再使用地區篩選
    selectedCity: '', // 不再使用城市篩選
  })

  const { countries, regions, cities } = useRegionsStore()

  const getRegionsByCountry = (countryId: string) => {
    return regions.filter(r => r.country_id === countryId)
  }

  const getCitiesByCountry = (countryId: string) => {
    return cities.filter(c => c.country_id === countryId)
  }

  const getCitiesByRegion = (regionId: string) => {
    return cities.filter(c => c.region_id === regionId)
  }

  const handleEditSubmit = async (formData: import('../../types').AttractionFormData) => {
    if (!editingAttraction) return { success: false }

    const result = await updateAttraction(editingAttraction.id, {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
      images: formData.images ? formData.images.split(',').map((i: string) => i.trim()) : [],
    } as unknown as Parameters<typeof updateAttraction>[1])

    if (result) {
      closeEdit()
      return { success: true }
    }
    return { success: false }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 視圖切換按鈕 */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isReorderMode ? "outline" : "default"}
            size="sm"
            onClick={() => setIsReorderMode(false)}
            className="h-8"
          >
            <List size={14} className="mr-1.5" />
            列表檢視
          </Button>
          <Button
            variant={isReorderMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsReorderMode(true)}
            className="h-8"
          >
            <ArrowUpDown size={14} className="mr-1.5" />
            拖拽排序
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* 根據模式顯示不同的列表 */}
        {isReorderMode ? (
          <SortableAttractionsList
            loading={loading}
            attractions={sortedAttractions}
            countries={displayCountries}
            cities={displayCities}
            onEdit={openEdit}
            onToggleStatus={toggleStatus}
            onDelete={deleteAttraction}
            onReorder={reorderAttractions}
          />
        ) : (
          <AttractionsList
            loading={loading}
            sortedAttractions={sortedAttractions}
            countries={displayCountries}
            cities={displayCities}
            onEdit={openEdit}
            onToggleStatus={toggleStatus}
            onDelete={deleteAttraction}
            onAddNew={openAdd}
            onMoveUp={(attraction) => moveUp(attraction, sortedAttractions)}
            onMoveDown={(attraction) => moveDown(attraction, sortedAttractions)}
          />
        )}
      </div>

      {/* 編輯對話框 */}
      {editingAttraction && (
        <AttractionsDialog
          open={isEditOpen}
          onClose={closeEdit}
          onSubmit={handleEditSubmit}
          attraction={editingAttraction}
          countries={countries}
          regions={regions}
          cities={cities}
          getRegionsByCountry={getRegionsByCountry}
          getCitiesByCountry={getCitiesByCountry}
          getCitiesByRegion={getCitiesByRegion}
          initialFormData={{
            name: '',
            name_en: '',
            description: '',
            country_id: '',
            region_id: '',
            city_id: '',
            category: '景點',
            tags: '',
            duration_minutes: 60,
            address: '',
            phone: '',
            website: '',
            images: '',
            notes: '',
            is_active: true,
          }}
        />
      )}
    </div>
  )
}
