import { useTourStore } from '@/stores/tour-store';
import { customerService } from '../services/customer.service';
import { Customer } from '@/stores/types';

/**
 * 客戶管理 Hook
 * 提供客戶相關的所有操作
 */
export const useCustomers = () => {
  const store = useTourStore();

  return {
    // ========== 資料 ==========
    customers: store.customers,

    // ========== CRUD 操作 ==========
    /**
     * 創建新客戶
     */
    createCustomer: async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addCustomer(data);
    },

    /**
     * 更新客戶資訊
     */
    updateCustomer: async (id: string, data: Partial<Customer>) => {
      return await store.updateCustomer(id, data);
    },

    /**
     * 刪除客戶
     */
    deleteCustomer: async (id: string) => {
      return await store.deleteCustomer(id);
    },

    /**
     * 載入客戶列表
     */
    loadCustomers: async () => {
      return await store.loadCustomers();
    },

    // ========== 業務方法 ==========
    /**
     * 搜尋客戶
     */
    searchCustomers: (searchTerm: string) => {
      return customerService.searchCustomers(searchTerm);
    },

    /**
     * 獲取特定旅遊團的客戶
     */
    getCustomersByTour: (tour_id: string) => {
      return customerService.getCustomersByTour(tourId);
    },

    /**
     * 獲取 VIP 客戶
     */
    getVIPCustomers: () => {
      return customerService.getVIPCustomers();
    },
  };
};
