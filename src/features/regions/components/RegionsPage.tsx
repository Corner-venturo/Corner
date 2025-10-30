'use client'

import { useEffect, useState, useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import type { City } from '@/stores'
import { useRegionsData } from '../hooks/useRegionsData'
import { useRegionsHierarchy } from '../hooks/useRegionsHierarchy'
import { RegionsList } from './RegionsList'
import { AddCountryDialog, AddRegionDialog, AddCityDialog, EditCityDialog } from './RegionsDialogs'
import { EditCityImageDialog } from './EditCityImageDialog'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

// ============================================
// 地區管理主頁面
// ============================================

export default function RegionsPage() {
  // 資料管理
  const {
    countries,
    loading,
    fetchAll,
    createCountry,
    createRegion,
    createCity,
    updateCountry,
    updateCity,
    deleteCountry,
    deleteRegion,
    deleteCity,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionsData()

  // UI 狀態管理
  const {
    expandedCountries,
    expandedRegions,
    toggleCountry,
    toggleRegion,
    sortField,
    sortDirection,
    handleSort,
    sortCities,
    searchTerm,
    setSearchTerm,
  } = useRegionsHierarchy()

  // 對話框狀態
  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false)
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false)
  const [isAddCityOpen, setIsAddCityOpen] = useState(false)
  const [isEditCityOpen, setIsEditCityOpen] = useState(false)
  const [isEditImageOpen, setIsEditImageOpen] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState<string>('')
  const [selectedRegionId, setSelectedRegionId] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const { confirm, confirmDialogProps } = useConfirmDialog()

  // 載入資料
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // 狀態切換處理
  const toggleCountryStatus = async (country: any) => {
    await updateCountry(country.id, { is_active: !country.is_active })
  }

  const toggleCityStatus = async (city: City) => {
    await updateCity(city.id, { is_active: !city.is_active })
  }

  // 刪除處理
  const handleDeleteCountry = async (id: string) => {
    const confirmed = await confirm({
      type: 'danger',
      title: '刪除國家',
      message: '確定要刪除此國家嗎？',
      details: ['⚠️ 這將同時刪除所有關聯的地區和城市', '⚠️ 此操作無法復原'],
      confirmLabel: '確認刪除',
      cancelLabel: '取消',
    })
    if (confirmed) {
      await deleteCountry(id)
    }
  }

  const handleDeleteRegion = async (id: string) => {
    const confirmed = await confirm({
      type: 'danger',
      title: '刪除地區',
      message: '確定要刪除此地區嗎？',
      details: ['⚠️ 這將同時刪除所有關聯的城市', '⚠️ 此操作無法復原'],
      confirmLabel: '確認刪除',
      cancelLabel: '取消',
    })
    if (confirmed) {
      await deleteRegion(id)
    }
  }

  const handleDeleteCity = async (id: string) => {
    const confirmed = await confirm({
      type: 'danger',
      title: '刪除城市',
      message: '確定要刪除此城市嗎？',
      details: ['此操作無法復原'],
      confirmLabel: '確認刪除',
      cancelLabel: '取消',
    })
    if (confirmed) {
      await deleteCity(id)
    }
  }

  // 過濾資料
  const filteredCountries = useMemo(() => {
    return countries.filter(
      country =>
        !searchTerm ||
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.name_en.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [countries, searchTerm])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="地區管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '地區管理', href: '/database/regions' },
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋國家、地區或城市..."
        onAdd={() => setIsAddCountryOpen(true)}
        addLabel="新增國家"
      />

      <div className="flex-1 overflow-auto">
        <RegionsList
          loading={loading}
          filteredCountries={filteredCountries}
          expandedCountries={expandedCountries}
          expandedRegions={expandedRegions}
          sortField={sortField}
          sortDirection={sortDirection}
          toggleCountry={toggleCountry}
          toggleRegion={toggleRegion}
          toggleCountryStatus={toggleCountryStatus}
          toggleCityStatus={toggleCityStatus}
          handleSort={handleSort}
          handleDeleteCountry={handleDeleteCountry}
          handleDeleteRegion={handleDeleteRegion}
          handleDeleteCity={handleDeleteCity}
          onAddCountry={() => setIsAddCountryOpen(true)}
          onAddRegion={countryId => {
            setSelectedCountryId(countryId)
            setIsAddRegionOpen(true)
          }}
          onAddCity={(countryId, regionId) => {
            setSelectedCountryId(countryId)
            setSelectedRegionId(regionId || '')
            setIsAddCityOpen(true)
          }}
          onEditCity={city => {
            setSelectedCity(city)
            setIsEditCityOpen(true)
          }}
          onEditImage={city => {
            setSelectedCity(city)
            setIsEditImageOpen(true)
          }}
          getRegionsByCountry={getRegionsByCountry}
          getCitiesByCountry={getCitiesByCountry}
          getCitiesByRegion={getCitiesByRegion}
          sortCities={sortCities}
        />
      </div>

      {/* 對話框 */}
      <AddCountryDialog
        open={isAddCountryOpen}
        onClose={() => setIsAddCountryOpen(false)}
        onCreate={createCountry}
      />
      <AddRegionDialog
        open={isAddRegionOpen}
        onClose={() => setIsAddRegionOpen(false)}
        countryId={selectedCountryId}
        onCreate={createRegion}
      />
      <AddCityDialog
        open={isAddCityOpen}
        onClose={() => setIsAddCityOpen(false)}
        countryId={selectedCountryId}
        regionId={selectedRegionId}
        onCreate={createCity}
      />
      <EditCityDialog
        open={isEditCityOpen}
        onClose={() => {
          setIsEditCityOpen(false)
          setSelectedCity(null)
        }}
        city={selectedCity}
        onUpdate={updateCity}
      />
      <EditCityImageDialog
        open={isEditImageOpen}
        onClose={() => {
          setIsEditImageOpen(false)
          setSelectedCity(null)
        }}
        city={selectedCity}
        onUpdate={updateCity}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </div>
  )
}
