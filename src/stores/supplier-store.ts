import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Supplier, PriceListItem } from './types';
import { createPersistentCrudMethods, generateId } from '@/lib/persistent-store';

interface SupplierState {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;

  // Suppliers CRUD（統一方法）
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<Supplier | undefined>;
  deleteSupplier: (id: string) => Promise<boolean>;
  loadSuppliers: () => Promise<Supplier[] | null>;
  setSelectedSupplier: (supplier: Supplier | null) => void;

  // Price List Management
  addPriceListItem: (supplier_id: string, item: Omit<PriceListItem, 'id' | 'createdAt'>) => void;
  updatePriceListItem: (supplier_id: string, itemId: string, item: Partial<PriceListItem>) => void;
  deletePriceListItem: (supplier_id: string, itemId: string) => void;

  // Utility functions
  getSuppliersByType: (type: Supplier['type']) => Supplier[];
  getPriceListByCategory: (supplier_id: string, category: string) => PriceListItem[];
  searchSuppliers: (query: string) => Supplier[];
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      selectedSupplier: null,

      // Suppliers CRUD（使用統一方法）
      ...createPersistentCrudMethods<Supplier>('suppliers', 'suppliers', set, get),

      setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),

      // Price List Management
      addPriceListItem: (supplierId, itemData) => {
        try {
          const id = generateId();
          const now = new Date().toISOString();
          const item: PriceListItem = {
            ...itemData,
            id,
            createdAt: now,
          };

          set((state) => ({
            suppliers: state.suppliers.map(supplier =>
              supplier.id === supplierId
                ? {
                    ...supplier,
                    priceList: [...supplier.priceList, item],
                    updatedAt: now
                  }
                : supplier
            )
          }));
        } catch (error) {
          console.error('❌ 新增價格項目失敗:', error);
        }
      },

      updatePriceListItem: (supplierId, itemId, itemData) => {
        try {
          const now = new Date().toISOString();
          set((state) => ({
            suppliers: state.suppliers.map(supplier =>
              supplier.id === supplierId
                ? {
                    ...supplier,
                    priceList: supplier.priceList.map(item =>
                      item.id === itemId ? { ...item, ...itemData } : item
                    ),
                    updatedAt: now
                  }
                : supplier
            )
          }));
        } catch (error) {
          console.error('❌ 更新價格項目失敗:', error);
        }
      },

      deletePriceListItem: (supplierId, itemId) => {
        try {
          const now = new Date().toISOString();
          set((state) => ({
            suppliers: state.suppliers.map(supplier =>
              supplier.id === supplierId
                ? {
                    ...supplier,
                    priceList: supplier.priceList.filter(item => item.id !== itemId),
                    updatedAt: now
                  }
                : supplier
            )
          }));
        } catch (error) {
          console.error('❌ 刪除價格項目失敗:', error);
        }
      },

      // Utility functions
      getSuppliersByType: (type) => {
        return get().suppliers.filter(supplier => supplier.type === type && supplier.status === 'active');
      },

      getPriceListByCategory: (supplierId, category) => {
        const supplier = get().suppliers.find(s => s.id === supplierId);
        if (!supplier) return [];
        return supplier.priceList.filter(item => item.category === category);
      },

      searchSuppliers: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().suppliers.filter(supplier =>
          supplier.name.toLowerCase().includes(lowercaseQuery) ||
          supplier.contact.contact_person.toLowerCase().includes(lowercaseQuery) ||
          supplier.contact.email?.toLowerCase().includes(lowercaseQuery) ||
          supplier.priceList.some(item =>
            item.itemName.toLowerCase().includes(lowercaseQuery) ||
            item.category.toLowerCase().includes(lowercaseQuery)
          )
        );
      }
    }),
    {
      name: 'venturo-supplier-store',
      version: 1,
    }
  )
);
