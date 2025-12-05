/**
 * 景點排序管理 Hook
 * 處理景點的拖拽排序功能
 */

import { useCallback } from 'react'
import { useAttractionStore } from '@/stores/attraction-store'
import { Attraction } from '../types'

export function useAttractionsReorder() {
  const { update: updateAttraction } = useAttractionStore()

  /**
   * 批量更新景點順序
   * @param attractions 重新排序後的景點列表
   */
  const reorderAttractions = useCallback(async (attractions: Attraction[]) => {
    try {
      // 批量更新每個景點的 display_order
      const updatePromises = attractions.map((attraction, index) =>
        updateAttraction(attraction.id, { 
          display_order: index 
        }).catch((error) => {
          console.error(`更新景點 ${attraction.name} 排序失敗:`, error)
          return null
        })
      )

      // 等待所有更新完成
      await Promise.allSettled(updatePromises)
      
      console.log('景點排序更新完成')
    } catch (error) {
      console.error('批量更新景點排序失敗:', error)
      throw error
    }
  }, [updateAttraction])

  /**
   * 更新單個景點的順序
   * @param attractionId 景點 ID
   * @param newOrder 新的順序
   */
  const updateAttractionOrder = useCallback(async (attractionId: string, newOrder: number) => {
    try {
      await updateAttraction(attractionId, { display_order: newOrder })
    } catch (error) {
      console.error('更新景點順序失敗:', error)
      throw error
    }
  }, [updateAttraction])

  return {
    reorderAttractions,
    updateAttractionOrder,
  }
}