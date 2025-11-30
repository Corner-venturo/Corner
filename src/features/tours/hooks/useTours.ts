'use client'

import { useTourStore } from '@/stores'
import { tourService } from '../services/tour.service'
import { Tour } from '@/stores/types'

/**
 * 簡化版 Tours Hook（與其他模組接口統一）
 *
 * 使用範例：
 * const { tours, orders, createTour, updateTour } = useTours();
 */
export const useTours = () => {
  const tourStore = useTourStore()

  return {
    // ========== 資料 ==========
    tours: tourStore.items,

    // ========== Tour CRUD 操作 ==========
    createTour: tourStore.create,

    updateTour: tourStore.update,

    deleteTour: tourStore.delete,

    loadTours: tourStore.fetchAll,

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
