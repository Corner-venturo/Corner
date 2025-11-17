'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { useRegionsStore } from '@/stores'
import { useAttractionsData } from '../hooks/useAttractionsData'
import { useAttractionsFilters } from '../hooks/useAttractionsFilters'
import { useAttractionsDialog } from '../hooks/useAttractionsDialog'
import { AttractionsFilters } from './AttractionsFilters'
import { AttractionsListVirtualized } from './AttractionsListVirtualized'
import { AttractionsDialog } from './AttractionsDialog'

// ============================================
// 景點管理主頁面
// ============================================

export default function AttractionsPage() {
  // 地區資料（暫時禁用，避免載入大量資料）
  // const {
  //   countries,
  //   regions,
  //   cities,
  //   fetchAll,
  //   getRegionsByCountry,
  //   getCitiesByCountry,
  //   getCitiesByRegion,
  // } = useRegionsStore()

  // 暫時硬編碼空陣列
  const countries: any[] = []
  const regions: any[] = []
  const cities: any[] = []
  const fetchAll = async () => {}
  const getRegionsByCountry = () => []
  const getCitiesByCountry = () => []
  const getCitiesByRegion = () => []

  // 景點資料管理（暫時使用硬編碼資料測試）
  // const { attractions, loading, addAttraction, updateAttraction, deleteAttraction, toggleStatus } =
  //   useAttractionsData()

  // 硬編碼測試資料
  const attractions = [
    {
      id: '1',
      name: '測試景點 1',
      name_en: 'Test Attraction 1',
      country_id: 'japan',
      city_id: 'tokyo',
      category: '景點',
      description: '測試用',
      duration_minutes: 60,
      tags: [],
      thumbnail: '',
      is_active: true,
    },
    {
      id: '2',
      name: '測試景點 2',
      name_en: 'Test Attraction 2',
      country_id: 'japan',
      city_id: 'osaka',
      category: '餐廳',
      description: '測試用',
      duration_minutes: 90,
      tags: [],
      thumbnail: '',
      is_active: true,
    },
    {
      id: '3',
      name: '測試景點 3',
      name_en: 'Test Attraction 3',
      country_id: 'thailand',
      city_id: 'bangkok',
      category: '住宿',
      description: '測試用',
      duration_minutes: 120,
      tags: [],
      thumbnail: '',
      is_active: false,
    },
  ]
  const loading = false
  const addAttraction = async () => ({ success: true })
  const updateAttraction = async () => ({ success: true })
  const deleteAttraction = async () => ({ success: true })
  const toggleStatus = async () => ({ success: true })

  // 篩選邏輯（暫時禁用，直接使用原始資料）
  // const {
  //   searchTerm,
  //   setSearchTerm,
  //   selectedCountry,
  //   setSelectedCountry,
  //   selectedRegion,
  //   setSelectedRegion,
  //   selectedCity,
  //   setSelectedCity,
  //   selectedCategory,
  //   setSelectedCategory,
  //   clearFilters,
  //   hasActiveFilters,
  //   sortField,
  //   sortDirection,
  //   handleSort,
  //   sortedAttractions,
  // } = useAttractionsFilters({ attractions, cities })

  // 暫時硬編碼篩選邏輯
  const searchTerm = ''
  const setSearchTerm = () => {}
  const selectedCountry = ''
  const setSelectedCountry = () => {}
  const selectedRegion = ''
  const setSelectedRegion = () => {}
  const selectedCity = ''
  const setSelectedCity = () => {}
  const selectedCategory = 'all'
  const setSelectedCategory = () => {}
  const clearFilters = () => {}
  const hasActiveFilters = false
  const sortField = null
  const sortDirection = null
  const handleSort = () => {}
  const sortedAttractions = attractions // 直接使用原始資料，不篩選不排序

  // 對話框管理（暫時禁用）
  // const {
  //   isAddOpen,
  //   openAdd,
  //   closeAdd,
  //   isEditOpen,
  //   editingAttraction,
  //   openEdit,
  //   closeEdit,
  //   initialFormData,
  // } = useAttractionsDialog()

  const isAddOpen = false
  const openAdd = () => {}
  const closeAdd = () => {}
  const isEditOpen = false
  const editingAttraction: any = null
  const openEdit = () => {}
  const closeEdit = () => {}
  const initialFormData: any = {}

  // 暫時禁用地區資料載入，避免崩潰
  useEffect(() => {
    // fetchAll() // 暫時註解
    logger.log('[Attractions] Skipping regions fetchAll to prevent crash')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 取得當前篩選的地區資訊
  const availableRegions = selectedCountry ? getRegionsByCountry(selectedCountry) : []
  const availableCities = selectedRegion
    ? getCitiesByRegion(selectedRegion)
    : selectedCountry
      ? getCitiesByCountry(selectedCountry)
      : []

  const categories = ['all', '景點', '餐廳', '住宿', '購物', '交通']

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="景點管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '景點管理', href: '/database/attractions' },
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋景點名稱..."
        onAdd={openAdd}
        addLabel="新增景點"
      />

      <div className="flex-1 overflow-auto">
        {/* 篩選區 - 暫時隱藏避免崩潰 */}
        {/* <AttractionsFilters
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            countries={countries}
            availableRegions={availableRegions}
            availableCities={availableCities}
            categories={categories}
          /> */}

        {/* 景點列表（超級簡化版本） */}
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">景點列表 ({sortedAttractions.length} 筆)</h3>
            </div>
            <div className="divide-y">
              {sortedAttractions.map(attraction => (
                <div key={attraction.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <MapPin size={24} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{attraction.name}</h4>
                    <p className="text-sm text-gray-600">{attraction.category}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {attraction.is_active ? '✅ 啟用' : '⭕ 停用'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 新增對話框 - 暫時禁用 */}
      {/* <AttractionsDialog
          open={isAddOpen}
          onClose={closeAdd}
          onSubmit={addAttraction}
          countries={countries}
          regions={regions}
          cities={cities}
          getRegionsByCountry={getRegionsByCountry}
          getCitiesByCountry={getCitiesByCountry}
          getCitiesByRegion={getCitiesByRegion}
          initialFormData={initialFormData}
        /> */}

      {/* 編輯對話框 - 暫時禁用 */}
      {/* <AttractionsDialog
          open={isEditOpen}
          onClose={closeEdit}
          onSubmit={formData => updateAttraction(editingAttraction!.id, formData)}
          attraction={editingAttraction}
          countries={countries}
          regions={regions}
          cities={cities}
          getRegionsByCountry={getRegionsByCountry}
          getCitiesByCountry={getCitiesByCountry}
          getCitiesByRegion={getCitiesByRegion}
          initialFormData={initialFormData}
        /> */}
    </div>
  )
}
