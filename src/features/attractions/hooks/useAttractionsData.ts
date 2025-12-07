import { useCallback, useEffect, useRef } from 'react'
import { useAttractionStore } from '@/stores'
import { Attraction, AttractionFormData } from '../types'
import { logger } from '@/lib/utils/logger'

// ============================================
// Hook: 景點資料管理（使用 Store 架構）
// ============================================

/**
 * 景點資料管理 Hook
 *
 * ✅ 使用 useAttractionStore（支援離線 + Realtime）
 * ✅ 提供向後相容的 API
 * ✅ 處理表單資料轉換
 */
export function useAttractionsData() {
  const store = useAttractionStore()
  const initializedRef = useRef(false)

  // 自動載入景點資料
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      logger.log('[Attractions] 載入景點資料...')
      store.fetchAll()
    }
  }, [store.fetchAll])

  // 新增景點（處理表單資料轉換）
  const addAttraction = useCallback(
    async (formData: AttractionFormData) => {
      try {
        // 轉換表單資料為 Attraction 格式
        const attractionData: Partial<Attraction> = {
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
          region_id: formData.region_id || undefined,
          display_order: 0,
        }

        await store.create(attractionData as Attraction)
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    [store]
  )

  // 更新景點（處理表單資料轉換）
  const updateAttraction = useCallback(
    async (id: string, formData: AttractionFormData) => {
      try {
        // 轉換表單資料為 Attraction 格式
        const attractionData: Partial<Attraction> = {
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          images: formData.images ? formData.images.split(',').map(url => url.trim()) : [],
          region_id: formData.region_id || undefined,
        }

        await store.update(id, attractionData as Attraction)
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    [store]
  )

  // 刪除景點
  const deleteAttraction = useCallback(
    async (id: string) => {
      if (!confirm('確定要刪除此景點？')) return { success: false, cancelled: true }

      try {
        await store.delete(id)
        return { success: true }
      } catch (error) {
        alert('刪除失敗')
        return { success: false, error }
      }
    },
    [store]
  )

  // 切換啟用狀態
  const toggleStatus = useCallback(
    async (attraction: Attraction) => {
      try {
        await store.update(attraction.id, {
          is_active: !attraction.is_active
        })
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    [store]
  )

  // 返回向後相容的 API
  return {
    attractions: store.items,
    loading: store.loading,
    fetchAttractions: store.fetchAll,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    toggleStatus,
  }
}
