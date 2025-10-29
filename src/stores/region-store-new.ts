/**
 * 地區管理 Store (新版 - 重構)
 * 支援三層架構：Countries > Regions > Cities
 * 使用 createStore 工廠函數統一架構
 * 整合統計資訊
 */

import { createStore } from './core/create-store-new';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

// ============================================
// 型別定義
// ============================================

export interface Country {
  id: string;
  name: string;
  name_en: string;
  emoji?: string;
  code?: string;
  has_regions: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  country_id: string;
  name: string;
  name_en?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  country_id: string;
  region_id?: string;
  name: string;
  name_en?: string;
  airport_code?: string;
  description?: string;
  timezone?: string;
  background_image_url?: string;
  background_image_url_2?: string;
  primary_image?: number; // 1 or 2, indicates which image is primary
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegionStats {
  city_id: string;
  attractions_count: number;
  cost_templates_count: number;
  quotes_count: number;
  tours_count: number;
  updated_at: string;
}

// ============================================
// 內部 Stores（使用 createStore 工廠）
// ============================================

const useCountryStoreInternal = createStore<Country>('countries');
const useRegionStoreInternal = createStore<Region>('regions');
const useCityStoreInternal = createStore<City>('cities');

// ============================================
// 統計資料 Store (簡單的 Zustand store，不需要離線支援)
// ============================================

import { create } from 'zustand';

interface StatsState {
  stats: Record<string, RegionStats>;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

const useStatsStore = create<StatsState>((set) => ({
  stats: {},
  loading: false,
  error: null,

  fetchStats: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('region_stats')
        .select('*');

      if (error) throw error;

      // 轉換為 Record
      const statsMap: Record<string, RegionStats> = {};
      data?.forEach(stat => {
        statsMap[stat.city_id] = stat;
      });

      set({ stats: statsMap, loading: false });
      logger.info('✅ 地區統計資料載入完成', { count: data?.length });
    } catch (error) {
      logger.error('❌ 載入統計資料失敗', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

// ============================================
// 對外整合 Hook
// ============================================

export const useRegionStoreNew = () => {
  const countryStore = useCountryStoreInternal();
  const regionStore = useRegionStoreInternal();
  const cityStore = useCityStoreInternal();
  const statsStore = useStatsStore();

  return {
    // 資料
    countries: countryStore.items,
    regions: regionStore.items,
    cities: cityStore.items,
    stats: statsStore.stats,

    // 狀態（任一 store 在 loading 就算 loading）
    loading: countryStore.loading || regionStore.loading || cityStore.loading || statsStore.loading,
    error: countryStore.error || regionStore.error || cityStore.error || statsStore.error,

    // ============================================
    // 載入所有資料
    // ============================================
    fetchAll: async () => {
      await Promise.all([
        countryStore.fetchAll(),
        regionStore.fetchAll(),
        cityStore.fetchAll(),
      ]);

      logger.info('✅ 地區資料載入完成', {
        countries: countryStore.items.length,
        regions: regionStore.items.length,
        cities: cityStore.items.length,
      });
    },

    // ============================================
    // 載入統計資訊
    // ============================================
    fetchStats: statsStore.fetchStats,

    // ============================================
    // Countries CRUD
    // ============================================
    createCountry: countryStore.create,
    updateCountry: countryStore.update,
    deleteCountry: countryStore.delete,

    // ============================================
    // Regions CRUD
    // ============================================
    createRegion: regionStore.create,
    updateRegion: regionStore.update,
    deleteRegion: regionStore.delete,

    // ============================================
    // Cities CRUD
    // ============================================
    createCity: cityStore.create,
    updateCity: cityStore.update,
    deleteCity: cityStore.delete,

    // ============================================
    // 查詢方法
    // ============================================
    getCountry: (id: string) => {
      return countryStore.items.find(c => c.id === id);
    },

    getRegionsByCountry: (countryId: string) => {
      return regionStore.items.filter(r => r.country_id === countryId);
    },

    getCitiesByCountry: (countryId: string) => {
      return cityStore.items.filter(c => c.country_id === countryId);
    },

    getCitiesByRegion: (regionId: string) => {
      return cityStore.items.filter(c => c.region_id === regionId);
    },

    getCityStats: (cityId: string) => {
      return statsStore.stats[cityId];
    },
  };
};
