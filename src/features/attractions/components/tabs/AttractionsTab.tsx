'use client'

import { useState, useEffect } from 'react'
import { useRegionsStore } from '@/stores'
import { useAttractionsData } from '../../hooks/useAttractionsData'
import { useAttractionsFilters } from '../../hooks/useAttractionsFilters'
import { useAttractionsDialog } from '../../hooks/useAttractionsDialog'
import { AttractionsList } from '../AttractionsList'
import { AttractionsDialog } from '../AttractionsDialog'
import { supabase } from '@/lib/supabase/client'
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
  selectedRegion: string
  selectedCity: string
  openAdd: () => void
}

export default function AttractionsTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedCountry,
  selectedRegion,
  selectedCity,
  openAdd,
  countries: filterCountries,
  regions: filterRegions,
  cities: filterCities,
}: AttractionsTabProps & {
  countries: any[]
  regions: any[]
  cities: any[]
}) {
  const { getRegionsByCountry, getCitiesByCountry, getCitiesByRegion } =
    useRegionsStore()

  // 用於顯示的國家和城市資料（從景點載入後，按需從資料庫查詢）
  const [displayCountries, setDisplayCountries] = useState<Country[]>([])
  const [displayCities, setDisplayCities] = useState<City[]>([])

  const { attractions, loading, addAttraction, updateAttraction, deleteAttraction, toggleStatus } =
    useAttractionsData()

  // 當景點載入後，取得所有用到的國家和城市 ID，然後查詢這些資料
  useEffect(() => {
    if (attractions.length > 0) {
      const countryIds = Array.from(new Set(attractions.map(a => a.country_id).filter(Boolean)))
      const cityIds = Array.from(new Set(attractions.map(a => a.city_id).filter(Boolean)))

      // 載入這些國家
      if (countryIds.length > 0) {
        supabase
          .from('countries')
          .select('*')
          .in('id', countryIds)
          .then(({ data }) => {
            if (data) setDisplayCountries(data)
          })
      }

      // 載入這些城市
      if (cityIds.length > 0) {
        supabase
          .from('cities')
          .select('*')
          .in('id', cityIds)
          .then(({ data }) => {
            if (data) setDisplayCities(data)
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
    selectedRegion,
    selectedCity,
  })

  const {
    isAddOpen,
    closeAdd,
    isEditOpen,
    editingAttraction,
    openEdit,
    closeEdit,
    initialFormData,
  } = useAttractionsDialog()

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* 景點列表 */}
        <AttractionsList
          loading={loading}
          sortedAttractions={sortedAttractions}
          countries={displayCountries}
          cities={displayCities}
          onEdit={openEdit}
          onToggleStatus={toggleStatus}
          onDelete={deleteAttraction}
          onAddNew={openAdd}
        />
      </div>

      {/* 新增對話框 */}
      <AttractionsDialog
        open={isAddOpen}
        onClose={closeAdd}
        onSubmit={addAttraction}
        countries={filterCountries}
        regions={filterRegions}
        cities={filterCities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
        initialFormData={initialFormData}
      />

      {/* 編輯對話框 */}
      <AttractionsDialog
        open={isEditOpen}
        onClose={closeEdit}
        onSubmit={formData => updateAttraction(editingAttraction!.id, formData)}
        attraction={editingAttraction}
        countries={filterCountries}
        regions={filterRegions}
        cities={filterCities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
        initialFormData={initialFormData}
      />
    </div>
  )
}
