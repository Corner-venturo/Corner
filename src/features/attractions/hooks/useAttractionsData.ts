import { useCallback, useEffect, useRef } from 'react'
import { useAttractionStore } from '@/stores'
import { Attraction, AttractionFormData } from '../types'
import { logger } from '@/lib/utils/logger'
import { confirm, alert } from '@/lib/ui/alert-dialog'

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
        logger.log('[Attractions] 更新景點:', id)

        // 轉換表單資料為 Attraction 格式（只傳送資料庫需要的欄位）
        const attractionData: Partial<Attraction> = {
          name: formData.name,
          name_en: formData.name_en || undefined,
          description: formData.description || undefined,
          country_id: formData.country_id,
          region_id: formData.region_id || undefined,
          city_id: formData.city_id || undefined,
          category: formData.category || '景點',
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          duration_minutes: formData.duration_minutes || 60,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          images: formData.images ? formData.images.split(',').map(url => url.trim()).filter(Boolean) : [],
          notes: formData.notes || undefined,
          is_active: formData.is_active,
        }

        logger.log('[Attractions] attractionData:', attractionData)
        const result = await store.update(id, attractionData as Attraction)
        logger.log('[Attractions] 更新成功! 結果:', result)
        // 觸發重新載入以確保 UI 同步
        await store.fetchAll()
        void alert('景點已更新', 'success')
        return { success: true }
      } catch (error) {
        logger.error('[Attractions] 更新失敗:', error)
        const errorMessage = error instanceof Error ? error.message : '更新失敗，請稍後再試'
        void alert(errorMessage, 'error')
        return { success: false, error }
      }
    },
    [store]
  )

  // 刪除景點
  const deleteAttraction = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要刪除此景點？', {
        title: '刪除景點',
        type: 'warning',
      })
      if (!confirmed) return { success: false, cancelled: true }

      try {
        await store.delete(id)
        return { success: true }
      } catch (error) {
        await alert('刪除失敗', 'error')
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
