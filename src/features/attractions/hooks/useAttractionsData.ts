import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Attraction, AttractionFormData } from '../types'

// ============================================
// Hook: 景點資料管理（僅負責 CRUD，不做篩選）
// ============================================

export function useAttractionsData() {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(false)

  // 載入景點資料（使用分頁功能，不需要限制）
  const fetchAttractions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('id, name, name_en, country_id, city_id, region_id, category, description, duration_minutes, tags, thumbnail, images, is_active, created_at, updated_at')
        .order('created_at', { ascending: false }) // 最新的在前面

      if (error) throw error
      setAttractions(data || [])
    } catch (error) {
      console.error('Error fetching attractions:', error)
      setAttractions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 新增景點
  const addAttraction = useCallback(
    async (formData: AttractionFormData) => {
      try {
        const { error } = await supabase.from('attractions').insert([
          {
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
            region_id: formData.region_id || null,
          },
        ])

        if (error) throw error
        await fetchAttractions()
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    [fetchAttractions]
  )

  // 更新景點
  const updateAttraction = useCallback(
    async (id: string, formData: AttractionFormData) => {
      try {
        const { error } = await supabase
          .from('attractions')
          .update({
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
            region_id: formData.region_id || null,
          })
          .eq('id', id)

        if (error) throw error
        await fetchAttractions()
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    [fetchAttractions]
  )

  // 刪除景點
  const deleteAttraction = useCallback(
    async (id: string) => {
      if (!confirm('確定要刪除此景點？')) return { success: false, cancelled: true }

      try {
        const { error } = await supabase.from('attractions').delete().eq('id', id)

        if (error) throw error
        await fetchAttractions()
        return { success: true }
      } catch (error) {
        alert('刪除失敗')
        return { success: false, error }
      }
    },
    [fetchAttractions]
  )

  // 切換啟用狀態（樂觀更新，避免畫面閃爍）
  const toggleStatus = useCallback(
    async (attraction: Attraction) => {
      // 樂觀更新：立即更新本地狀態
      const newStatus = !attraction.is_active
      setAttractions(prev =>
        prev.map(item => (item.id === attraction.id ? { ...item, is_active: newStatus } : item))
      )

      try {
        const { error } = await supabase
          .from('attractions')
          .update({ is_active: newStatus })
          .eq('id', attraction.id)

        if (error) throw error
        return { success: true }
      } catch (error) {
        // 如果更新失敗，還原本地狀態
        setAttractions(prev =>
          prev.map(item =>
            item.id === attraction.id ? { ...item, is_active: attraction.is_active } : item
          )
        )
        return { success: false, error }
      }
    },
    []
  )

  // 初始載入（只執行一次，避免無限迴圈）
  useEffect(() => {
    fetchAttractions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    attractions,
    loading,
    fetchAttractions,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    toggleStatus,
  }
}
