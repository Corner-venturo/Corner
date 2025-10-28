/**
 * 地區管理 Store (新版)
 * 支援三層架構：Countries > Regions > Cities
 * 整合統計資訊
 */

import { create } from 'zustand';
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
// Store State
// ============================================

interface RegionStoreState {
  // 資料
  countries: Country[];
  regions: Region[];
  cities: City[];
  stats: Record<string, RegionStats>;  // key: city_id

  // 狀態
  loading: boolean;
  error: string | null;

  // 操作
  fetchAll: () => Promise<void>;
  fetchStats: () => Promise<void>;

  // Countries
  createCountry: (data: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => Promise<Country | null>;
  updateCountry: (id: string, data: Partial<Country>) => Promise<void>;
  deleteCountry: (id: string) => Promise<void>;

  // Regions
  createRegion: (data: Omit<Region, 'id' | 'created_at' | 'updated_at'>) => Promise<Region | null>;
  updateRegion: (id: string, data: Partial<Region>) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;

  // Cities
  createCity: (data: Omit<City, 'id' | 'created_at' | 'updated_at'>) => Promise<City | null>;
  updateCity: (id: string, data: Partial<City>) => Promise<void>;
  deleteCity: (id: string) => Promise<void>;

  // 查詢
  getCountry: (id: string) => Country | undefined;
  getRegionsByCountry: (countryId: string) => Region[];
  getCitiesByCountry: (countryId: string) => City[];
  getCitiesByRegion: (regionId: string) => City[];
  getCityStats: (cityId: string) => RegionStats | undefined;
}

// ============================================
// Store 實作
// ============================================

export const useRegionStoreNew = create<RegionStoreState>((set, get) => ({
  // 初始狀態
  countries: [],
  regions: [],
  cities: [],
  stats: {},
  loading: false,
  error: null,

  // ============================================
  // 載入所有資料
  // ============================================
  fetchAll: async () => {
    set({ loading: true, error: null });

    try {
      // 檢查認證狀態
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        logger.warn('⚠️ 未登入，嘗試使用匿名存取');
      }

      // 並行載入
      const [countriesRes, regionsRes, citiesRes] = await Promise.all([
        supabase
          .from('countries')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('regions')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('cities')
          .select('*')
          .order('display_order', { ascending: true }),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (citiesRes.error) throw citiesRes.error;

      set({
        countries: countriesRes.data || [],
        regions: regionsRes.data || [],
        cities: citiesRes.data || [],
        loading: false,
      });

      logger.info('✅ 地區資料載入完成', {
        countries: countriesRes.data?.length,
        regions: regionsRes.data?.length,
        cities: citiesRes.data?.length,
      });
    } catch (error) {
      logger.error('❌ 載入地區資料失敗', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // ============================================
  // 載入統計資訊
  // ============================================
  fetchStats: async () => {
    try {
      const { data, error } = await supabase
        .from('region_stats')
        .select('*');

      if (error) throw error;

      // 轉換為 Record
      const statsMap: Record<string, RegionStats> = {};
      data?.forEach(stat => {
        statsMap[stat.city_id] = stat;
      });

      set({ stats: statsMap });
      logger.info('✅ 地區統計資料載入完成', { count: data?.length });
    } catch (error) {
      logger.error('❌ 載入統計資料失敗', error);
    }
  },

  // ============================================
  // Countries CRUD
  // ============================================
  createCountry: async (data) => {
    try {
      const { data: newCountry, error } = await supabase
        .from('countries')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        countries: [...state.countries, newCountry].sort((a, b) => a.display_order - b.display_order),
      }));

      logger.info('✅ 國家建立成功', newCountry);
      return newCountry;
    } catch (error) {
      logger.error('❌ 建立國家失敗', error);
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateCountry: async (id, data) => {
    try {
      const { error } = await supabase
        .from('countries')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        countries: state.countries.map(c =>
          c.id === id ? { ...c, ...data } : c
        ),
      }));

      logger.info('✅ 國家更新成功', { id, data });
    } catch (error) {
      logger.error('❌ 更新國家失敗', error);
      set({ error: (error as Error).message });
    }
  },

  deleteCountry: async (id) => {
    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        countries: state.countries.filter(c => c.id !== id),
      }));

      logger.info('✅ 國家刪除成功', { id });
    } catch (error) {
      logger.error('❌ 刪除國家失敗', error);
      set({ error: (error as Error).message });
    }
  },

  // ============================================
  // Regions CRUD
  // ============================================
  createRegion: async (data) => {
    try {
      const { data: newRegion, error } = await supabase
        .from('regions')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        regions: [...state.regions, newRegion].sort((a, b) => a.display_order - b.display_order),
      }));

      logger.info('✅ 地區建立成功', newRegion);
      return newRegion;
    } catch (error) {
      logger.error('❌ 建立地區失敗', error);
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateRegion: async (id, data) => {
    try {
      const { error } = await supabase
        .from('regions')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        regions: state.regions.map(r =>
          r.id === id ? { ...r, ...data } : r
        ),
      }));

      logger.info('✅ 地區更新成功', { id, data });
    } catch (error) {
      logger.error('❌ 更新地區失敗', error);
      set({ error: (error as Error).message });
    }
  },

  deleteRegion: async (id) => {
    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        regions: state.regions.filter(r => r.id !== id),
      }));

      logger.info('✅ 地區刪除成功', { id });
    } catch (error) {
      logger.error('❌ 刪除地區失敗', error);
      set({ error: (error as Error).message });
    }
  },

  // ============================================
  // Cities CRUD
  // ============================================
  createCity: async (data) => {
    try {
      const { data: newCity, error } = await supabase
        .from('cities')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        cities: [...state.cities, newCity].sort((a, b) => a.display_order - b.display_order),
      }));

      logger.info('✅ 城市建立成功', newCity);
      return newCity;
    } catch (error) {
      logger.error('❌ 建立城市失敗', error);
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateCity: async (id, data) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cities: state.cities.map(c =>
          c.id === id ? { ...c, ...data } : c
        ),
      }));

      logger.info('✅ 城市更新成功', { id, data });
    } catch (error) {
      logger.error('❌ 更新城市失敗', error);
      set({ error: (error as Error).message });
    }
  },

  deleteCity: async (id) => {
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        cities: state.cities.filter(c => c.id !== id),
        stats: Object.fromEntries(
          Object.entries(state.stats).filter(([cityId]) => cityId !== id)
        ),
      }));

      logger.info('✅ 城市刪除成功', { id });
    } catch (error) {
      logger.error('❌ 刪除城市失敗', error);
      set({ error: (error as Error).message });
    }
  },

  // ============================================
  // 查詢方法
  // ============================================
  getCountry: (id) => {
    return get().countries.find(c => c.id === id);
  },

  getRegionsByCountry: (countryId) => {
    return get().regions.filter(r => r.country_id === countryId);
  },

  getCitiesByCountry: (countryId) => {
    return get().cities.filter(c => c.country_id === countryId);
  },

  getCitiesByRegion: (regionId) => {
    return get().cities.filter(c => c.region_id === regionId);
  },

  getCityStats: (cityId) => {
    return get().stats[cityId];
  },
}));
