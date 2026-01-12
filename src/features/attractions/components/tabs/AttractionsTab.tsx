'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAttractionsData } from '../../hooks/useAttractionsData'
import { useAttractionsFilters } from '../../hooks/useAttractionsFilters'
import { useAttractionsDialog } from '../../hooks/useAttractionsDialog'
import { useAttractionsReorder } from '../../hooks/useAttractionsReorder'
import { AttractionsList } from '../AttractionsList'
import { SortableAttractionsList } from '../SortableAttractionsList'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, List, SortAsc, Loader2 } from 'lucide-react'
import type { Country, City } from '@/data'

// Dynamic import for large dialog component (807 lines)
const AttractionsDialog = dynamic(
  () => import('../AttractionsDialog').then(m => m.AttractionsDialog),
  { ssr: false }
)

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
  isAddOpen: boolean
  closeAdd: () => void
  initialFormData: import('../../types').AttractionFormData
}

export default function AttractionsTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedCountry,
  openAdd,
  isAddOpen,
  closeAdd,
  initialFormData,
}: AttractionsTabProps) {
  // 用於顯示的國家和城市資料（從景點載入後，按需從資料庫查詢）
  const [displayCountries, setDisplayCountries] = useState<Country[]>([])
  const [displayCities, setDisplayCities] = useState<City[]>([])
  // 排序模式控制
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [isSorting, setIsSorting] = useState(false)

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

  // 使用 SWR 載入地區資料供對話框使用
  // 動態 import 避免 SSR 問題
  interface Region {
    id: string
    country_id: string
    name: string
    name_en?: string
    description?: string
    display_order: number
    is_active: boolean
    workspace_id?: string
    created_at: string
    updated_at: string
  }

  const [regionsData, setRegionsData] = useState<{
    countries: Country[]
    regions: Region[]
    cities: City[]
  }>({ countries: [], regions: [], cities: [] })

  useEffect(() => {
    const loadRegions = async () => {
      const [countriesRes, regionsRes, citiesRes] = await Promise.all([
        supabase.from('countries').select('*'),
        supabase.from('regions').select('*'),
        supabase.from('cities').select('*'),
      ])
      setRegionsData({
        countries: (countriesRes.data || []) as Country[],
        regions: (regionsRes.data || []) as Region[],
        cities: (citiesRes.data || []) as City[],
      })
    }
    loadRegions()
  }, [])

  const { countries, regions, cities } = regionsData

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

    // updateAttraction 內部已處理 tags/images 轉換，直接傳遞 formData
    const result = await updateAttraction(editingAttraction.id, formData)

    if (result?.success) {
      closeEdit()
      return { success: true }
    }
    return { success: false }
  }

  // 新增景點
  const handleAddSubmit = async (formData: import('../../types').AttractionFormData) => {
    // addAttraction 內部已處理 tags/images 轉換
    const result = await addAttraction(formData)

    if (result?.success) {
      closeAdd()
      return { success: true }
    }
    return { success: false }
  }

  // 按名稱排序所有景點
  const handleSortByName = async () => {
    if (isSorting || attractions.length === 0) return

    setIsSorting(true)
    try {
      // 按名稱排序（使用 localeCompare 支援中文排序）
      const sorted = [...attractions].sort((a, b) =>
        a.name.localeCompare(b.name, 'zh-TW')
      )

      // 批量更新 display_order
      await reorderAttractions(sorted)
      logger.log('[Attractions] 按名稱排序完成')
    } catch (error) {
      logger.error('[Attractions] 排序失敗:', error)
    } finally {
      setIsSorting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 視圖切換按鈕 */}
      <div className="flex justify-between mb-4 px-4">
        {/* 左側：排序按鈕 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSortByName}
          disabled={isSorting || attractions.length === 0}
          className="h-8"
        >
          {isSorting ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <SortAsc size={14} className="mr-1.5" />
          )}
          {isSorting ? '排序中...' : '按名稱排序'}
        </Button>

        {/* 右側：檢視切換 */}
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
          initialFormData={initialFormData}
        />
      )}

      {/* 新增對話框 */}
      <AttractionsDialog
        open={isAddOpen}
        onClose={closeAdd}
        onSubmit={handleAddSubmit}
        attraction={null}
        countries={countries}
        regions={regions}
        cities={cities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
        initialFormData={initialFormData}
      />
    </div>
  )
}
