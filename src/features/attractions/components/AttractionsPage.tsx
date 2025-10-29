'use client';

import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { useRegionStoreNew } from '@/stores';
import { useAttractionsData } from '../hooks/useAttractionsData';
import { useAttractionsFilters } from '../hooks/useAttractionsFilters';
import { useAttractionsDialog } from '../hooks/useAttractionsDialog';
import { AttractionsFilters } from './AttractionsFilters';
import { AttractionsList } from './AttractionsList';
import { AttractionsDialog } from './AttractionsDialog';

// ============================================
// 景點管理主頁面
// ============================================

export default function AttractionsPage() {
  // 地區資料
  const {
    countries,
    regions,
    cities,
    fetchAll,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionStoreNew();

  // 景點資料管理（載入所有資料）
  const {
    attractions,
    loading,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    toggleStatus,
  } = useAttractionsData();

  // 篩選邏輯（在前端進行篩選和排序）
  const {
    searchTerm,
    setSearchTerm,
    selectedCountry,
    setSelectedCountry,
    selectedRegion,
    setSelectedRegion,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    clearFilters,
    hasActiveFilters,
    sortField,
    sortDirection,
    handleSort,
    sortedAttractions,
  } = useAttractionsFilters({ attractions, cities });

  // 對話框管理
  const {
    isAddOpen,
    openAdd,
    closeAdd,
    isEditOpen,
    editingAttraction,
    openEdit,
    closeEdit,
    initialFormData,
  } = useAttractionsDialog();

  // 載入地區資料（只執行一次，避免無限迴圈）
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 取得當前篩選的地區資訊
  const availableRegions = selectedCountry ? getRegionsByCountry(selectedCountry) : [];
  const availableCities = selectedRegion
    ? getCitiesByRegion(selectedRegion)
    : selectedCountry
    ? getCitiesByCountry(selectedCountry)
    : [];

  const categories = ['all', '景點', '餐廳', '住宿', '購物', '交通'];

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="景點管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '景點管理', href: '/database/attractions' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋景點名稱..."
        onAdd={openAdd}
        addLabel="新增景點"
      />

      <div className="flex-1 overflow-auto">
        {/* 篩選區 */}
        <AttractionsFilters
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
        />

        {/* 景點列表 */}
        <AttractionsList
          loading={loading}
          sortedAttractions={sortedAttractions}
          countries={countries}
          cities={cities}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
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
        countries={countries}
        regions={regions}
        cities={cities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
        initialFormData={initialFormData}
      />

      {/* 編輯對話框 */}
      <AttractionsDialog
        open={isEditOpen}
        onClose={closeEdit}
        onSubmit={(formData) => updateAttraction(editingAttraction!.id, formData)}
        attraction={editingAttraction}
        countries={countries}
        regions={regions}
        cities={cities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
        initialFormData={initialFormData}
      />
    </div>
  );
}
