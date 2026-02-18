import { useCallback } from 'react'
import { useAttractions, createAttraction as createAttractionData, updateAttraction as updateAttractionData, deleteAttraction as deleteAttractionData, invalidateAttractions } from '@/data'
import { Attraction, AttractionFormData } from '../types'
import { logger } from '@/lib/utils/logger'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { ATTRACTIONS_DATA_LABELS } from '../constants/labels'

// ============================================
// Hook: 景點資料管理（使用 SWR 架構）
// ============================================

/**
 * 景點資料管理 Hook
 *
 * ✅ 使用 @/data SWR hooks（自動載入 + 快取）
 * ✅ 提供向後相容的 API
 * ✅ 處理表單資料轉換
 */
export function useAttractionsData() {
  const { items: attractions, loading } = useAttractions()

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

        await createAttractionData(attractionData as Omit<Attraction, 'id' | 'created_at' | 'updated_at'>)
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    []
  )

  // 更新景點（處理表單資料轉換）
  const updateAttraction = useCallback(
    async (id: string, formData: AttractionFormData) => {
      try {
        logger.log('[Attractions] 更新景點:', id)

        // 轉換表單資料為 Attraction 格式（只傳送資料庫需要的欄位）
        const attractionData: Partial<Attraction> = {
          name: formData.name,
          english_name: formData.english_name || undefined,
          description: formData.description || undefined,
          country_id: formData.country_id,
          region_id: formData.region_id || undefined,
          city_id: formData.city_id || undefined,
          category: formData.category || ATTRACTIONS_DATA_LABELS.DEFAULT_CATEGORY,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          duration_minutes: formData.duration_minutes || 60,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          images: formData.images ? formData.images.split(',').map(url => url.trim()).filter(Boolean) : [],
          notes: formData.notes || undefined,
          is_active: formData.is_active,
          // AI 補充欄位
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
          ticket_price: formData.ticket_price || undefined,
          opening_hours: formData.opening_hours || undefined,
        }

        logger.log('[Attractions] attractionData:', attractionData)
        const result = await updateAttractionData(id, attractionData as Partial<Attraction>)
        logger.log('[Attractions] 更新成功! 結果:', result)
        // 觸發重新載入以確保 UI 同步
        await invalidateAttractions()
        void alert(ATTRACTIONS_DATA_LABELS.景點已更新, 'success')
        return { success: true }
      } catch (error) {
        logger.error('[Attractions] 更新失敗:', error)
        const errorMessage = error instanceof Error ? error.message : ATTRACTIONS_DATA_LABELS.更新失敗請稍後再試
        void alert(errorMessage, 'error')
        return { success: false, error }
      }
    },
    []
  )

  // 刪除景點
  const deleteAttractionHandler = useCallback(
    async (id: string) => {
      const confirmed = await confirm(ATTRACTIONS_DATA_LABELS.確定要刪除此景點, {
        title: ATTRACTIONS_DATA_LABELS.刪除景點,
        type: 'warning',
      })
      if (!confirmed) return { success: false, cancelled: true }

      try {
        await deleteAttractionData(id)
        return { success: true }
      } catch (error) {
        await alert(ATTRACTIONS_DATA_LABELS.刪除失敗, 'error')
        return { success: false, error }
      }
    },
    []
  )

  // 切換啟用狀態
  const toggleStatus = useCallback(
    async (attraction: Attraction) => {
      try {
        await updateAttractionData(attraction.id, {
          is_active: !attraction.is_active
        })
        return { success: true }
      } catch (error) {
        return { success: false, error }
      }
    },
    []
  )

  // 返回向後相容的 API
  return {
    attractions,
    loading,
    fetchAttractions: invalidateAttractions,
    addAttraction,
    updateAttraction,
    deleteAttraction: deleteAttractionHandler,
    toggleStatus,
  }
}
