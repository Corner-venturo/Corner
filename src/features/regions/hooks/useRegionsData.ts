import { useRegionStoreNew } from '@/stores';

/**
 * 地區資料管理 Hook
 * 負責取得和操作國家、地區、城市資料
 */
export function useRegionsData() {
  const {
    countries,
    regions,
    cities,
    loading,
    fetchAll,
    createCountry,
    createRegion,
    createCity,
    updateCountry,
    updateRegion,
    updateCity,
    deleteCountry,
    deleteRegion,
    deleteCity,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionStoreNew();

  return {
    // 資料
    countries,
    regions,
    cities,
    loading,

    // 載入
    fetchAll,

    // 新增
    createCountry,
    createRegion,
    createCity,

    // 更新
    updateCountry,
    updateRegion,
    updateCity,

    // 刪除
    deleteCountry,
    deleteRegion,
    deleteCity,

    // 查詢
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  };
}
