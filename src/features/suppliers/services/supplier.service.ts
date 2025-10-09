import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Supplier } from '@/stores/types';
import { useSupplierStore } from '@/stores/supplier-store';
import { ValidationError } from '@/core/errors/app-errors';

class SupplierService extends BaseService<Supplier> {
  protected resourceName = 'suppliers';

  protected getStore(): StoreOperations<Supplier> {
    const store = useSupplierStore.getState();
    return {
      getAll: () => store.suppliers,
      getById: (id: string) => store.suppliers.find(s => s.id === id),
      add: async (supplier: Supplier) => {
        await store.addSupplier(supplier as any);
        return supplier;
      },
      update: async (id: string, data: Partial<Supplier>) => {
        await store.updateSupplier(id, data);
      },
      delete: async (id: string) => {
        await store.deleteSupplier(id);
      }
    };
  }

  protected validate(data: Partial<Supplier>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '供應商名稱至少需要 2 個字符');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError('email', '郵件格式錯誤');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new ValidationError('phone', '電話格式錯誤');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^[\d\s\-+()]{8,}$/.test(phone);
  }

  // ========== 業務邏輯方法 ==========

  getSuppliersByCategory(category: Supplier['category']): Supplier[] {
    const store = useSupplierStore.getState();
    return store.suppliers.filter(s => s.category === category);
  }

  getActiveSuppliers(): Supplier[] {
    const store = useSupplierStore.getState();
    return store.suppliers.filter(s => s.isActive);
  }

  searchSuppliers(searchTerm: string): Supplier[] {
    const store = useSupplierStore.getState();
    const term = searchTerm.toLowerCase();
    return store.suppliers.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.contact_person?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  }
}

export const supplierService = new SupplierService();
