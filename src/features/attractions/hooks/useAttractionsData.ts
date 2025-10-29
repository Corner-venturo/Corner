import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Attraction, AttractionFormData } from '../types';

// ============================================
// Hook: 景點資料管理（僅負責 CRUD，不做篩選）
// ============================================

export function useAttractionsData() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);

  // 載入所有景點資料
  const fetchAttractions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAttractions(data || []);
    } catch (error) {
      // Error loading attractions - fallback to empty list
      setAttractions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 新增景點
  const addAttraction = useCallback(async (formData: AttractionFormData) => {
    try {
      const { error } = await supabase
        .from('attractions')
        .insert([{
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
          region_id: formData.region_id || null,
        }]);

      if (error) throw error;
      await fetchAttractions();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [fetchAttractions]);

  // 更新景點
  const updateAttraction = useCallback(async (id: string, formData: AttractionFormData) => {
    try {
      const { error } = await supabase
        .from('attractions')
        .update({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
          region_id: formData.region_id || null,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchAttractions();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [fetchAttractions]);

  // 刪除景點
  const deleteAttraction = useCallback(async (id: string) => {
    if (!confirm('確定要刪除此景點？')) return { success: false, cancelled: true };

    try {
      const { error } = await supabase
        .from('attractions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAttractions();
      return { success: true };
    } catch (error) {
      alert('刪除失敗');
      return { success: false, error };
    }
  }, [fetchAttractions]);

  // 切換啟用狀態
  const toggleStatus = useCallback(async (attraction: Attraction) => {
    try {
      const { error } = await supabase
        .from('attractions')
        .update({ is_active: !attraction.is_active })
        .eq('id', attraction.id);

      if (error) throw error;
      await fetchAttractions();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [fetchAttractions]);

  // 初始載入（只執行一次，避免無限迴圈）
  useEffect(() => {
    fetchAttractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    attractions,
    loading,
    fetchAttractions,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    toggleStatus,
  };
}
