'use client'

import { useAuthStore } from '@/stores'
import {
  useTours as useToursData,
  createTour as createTourApi,
  updateTour as updateTourApi,
  deleteTour as deleteTourApi,
  invalidateTours,
} from '@/data'
import { tourService } from '../services/tour.service'
import { createTourChannel } from '../services/tour-channel.service'
import { Tour } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

/**
 * 簡化版 Tours Hook（與其他模組接口統一）
 * 使用 @/data hooks（SWR 自動載入）
 *
 * 使用範例：
 * const { tours, createTour, updateTour } = useTours();
 */
export const useTours = () => {
  // 使用 @/data hooks（SWR 自動載入）
  const { items: tours } = useToursData()

  return {
    // ========== 資料 ==========
    tours,

    // ========== Tour CRUD 操作 ==========
    /**
     * 建立旅遊團並自動建立專屬頻道
     */
    createTour: async (data: Parameters<typeof createTourApi>[0]) => {
      // 1. 建立旅遊團
      const newTour = await createTourApi(data)

      // 2. 自動建立頻道（異步執行，不阻塞返回）
      const user = useAuthStore.getState().user
      if (user && newTour) {
        // 背景執行，不等待結果
        createTourChannel(newTour as unknown as Tour, user.id)
          .then(result => {
            if (result.success) {
              logger.log(`[useTours] 已為 ${newTour.code} 建立頻道`)
            } else {
              logger.warn(`[useTours] 建立頻道失敗: ${result.error}`)
            }
          })
          .catch(error => {
            logger.error('[useTours] 建立頻道時發生錯誤:', error)
          })
      }

      return newTour
    },

    updateTour: updateTourApi,

    deleteTour: deleteTourApi,

    loadTours: invalidateTours,

    // ========== 業務方法（來自 Service） ==========
    generateTourCode: async (location: string, date: Date, isSpecial?: boolean) => {
      return await tourService.generateTourCode(location, date, isSpecial)
    },

    isTourCodeExists: async (code: string) => {
      return await tourService.isTourCodeExists(code)
    },

    calculateFinancialSummary: async (tour_id: string) => {
      return await tourService.calculateFinancialSummary(tour_id)
    },

    updateTourStatus: async (tour_id: string, status: Tour['status']) => {
      return await tourService.updateTourStatus(tour_id, status)
    },
  }
}
