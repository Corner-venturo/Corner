import { useCustomerStore } from '@/stores'
import { customerService } from '../services/customer.service'
import { Customer } from '@/stores/types'

/**
 * 客戶管理 Hook
 * 提供客戶相關的所有操作
 */
export const useCustomers = () => {
  const store = useCustomerStore()

  return {
    // ========== 資料 ==========
    customers: store.items,

    // ========== CRUD 操作 ==========
    /**
     * 創建新客戶
     */
    createCustomer: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      return await store.create(data)
    },

    /**
     * 更新客戶資訊
     */
    updateCustomer: async (id: string, data: Partial<Customer>) => {
      return await store.update(id, data)
    },

    /**
     * 刪除客戶
     */
    deleteCustomer: async (id: string) => {
      return await store.delete(id)
    },

    /**
     * 載入客戶列表
     */
    loadCustomers: async () => {
      return await store.fetchAll()
    },

    // ========== 業務方法 ==========
    /**
     * 搜尋客戶
     */
    searchCustomers: (searchTerm: string) => {
      return customerService.searchCustomers(searchTerm)
    },

    /**
     * 獲取特定旅遊團的客戶
     */
    getCustomersByTour: (tour_id: string) => {
      return customerService.getCustomersByTour(tour_id)
    },

    /**
     * 獲取 VIP 客戶
     */
    getVIPCustomers: () => {
      return customerService.getVIPCustomers()
    },
  }
}
