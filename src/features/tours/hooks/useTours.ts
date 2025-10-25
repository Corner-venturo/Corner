import { useTourStore } from '@/stores';
import { tourService } from '../services/tour.service';
import { Tour } from '@/stores/types';

/**
 * 簡化版 Tours Hook（與其他模組接口統一）
 *
 * 使用範例：
 * const { tours, orders, createTour, updateTour } = useTours();
 */
export const useTours = () => {
  const tourStore = useTourStore();

  return {
    // ========== 資料 ==========
    tours: tourStore.items,

    // ========== Tour CRUD 操作 ==========
    createTour: async (data: Omit<Tour, 'id' | 'created_at' | 'updated_at'>) => {
      return await tourStore.create(data as any);
    },

    updateTour: async (id: string, data: Partial<Tour>) => {
      return await tourStore.update(id, data);
    },

    deleteTour: async (id: string) => {
      return await tourStore.delete(id);
    },

    loadTours: async () => {
      return await tourStore.fetchAll();
    },

    // ========== 業務方法（來自 Service） ==========
    generateTourCode: async (location: string, date: Date, isSpecial?: boolean) => {
      return await tourService.generateTourCode(location, date, isSpecial);
    },

    isTourCodeExists: async (code: string) => {
      return await tourService.isTourCodeExists(code);
    },

    calculateFinancialSummary: async (tour_id: string) => {
      return await tourService.calculateFinancialSummary(tour_id);
    },

    updateTourStatus: async (tour_id: string, status: Tour['status'], reason?: string) => {
      return await tourService.updateTourStatus(tour_id, status, reason);
    },
  };
};
