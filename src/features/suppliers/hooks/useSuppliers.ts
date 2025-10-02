import { useSupplierStore } from '@/stores/supplier-store';
import { supplierService } from '../services/supplier.service';
import { Supplier } from '@/stores/types';

/**
 * 供應商管理 Hook
 * 提供供應商相關的所有操作
 */
export const useSuppliers = () => {
  const store = useSupplierStore();

  return {
    // ========== 資料 ==========
    suppliers: store.suppliers,

    // ========== CRUD 操作 ==========
    /**
     * 創建新供應商
     */
    createSupplier: async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addSupplier(data);
    },

    /**
     * 更新供應商資訊
     */
    updateSupplier: async (id: string, data: Partial<Supplier>) => {
      return await store.updateSupplier(id, data);
    },

    /**
     * 刪除供應商
     */
    deleteSupplier: async (id: string) => {
      return await store.deleteSupplier(id);
    },

    /**
     * 載入供應商列表
     */
    loadSuppliers: async () => {
      return await store.loadSuppliers();
    },

    // ========== 業務方法 ==========
    /**
     * 根據類別獲取供應商
     */
    getSuppliersByCategory: (category: Supplier['category']) => {
      return supplierService.getSuppliersByCategory(category);
    },

    /**
     * 獲取啟用中的供應商
     */
    getActiveSuppliers: () => {
      return supplierService.getActiveSuppliers();
    },

    /**
     * 搜尋供應商
     */
    searchSuppliers: (searchTerm: string) => {
      return supplierService.searchSuppliers(searchTerm);
    },
  };
};
