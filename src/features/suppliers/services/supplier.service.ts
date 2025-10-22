import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Supplier } from '@/stores/types';
import { useSupplierStore, useRegionStore } from '@/stores';
import { ValidationError } from '@/core/errors/app-errors';

class SupplierService extends BaseService<Supplier> {
  protected resourceName = 'suppliers';

  protected getStore = (): StoreOperations<Supplier> => {
    const store = useSupplierStore.getState();
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find((s: Supplier) => s.id === id),
      add: async (supplier: Supplier) => {
        await store.create(supplier as any);
        return supplier;
      },
      update: async (id: string, data: Partial<Supplier>) => {
        await store.update(id, data);
      },
      delete: async (id: string) => {
        await store.delete(id);
      }
    };
  };

  protected validate(data: Partial<Supplier>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '供應商名稱至少需要 2 個字符');
    }

    // Supplier 使用 contact 物件
    if (data.contact?.email && !this.isValidEmail(data.contact.email)) {
      throw new ValidationError('email', '郵件格式錯誤');
    }

    if (data.contact?.phone && !this.isValidPhone(data.contact.phone)) {
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

  getSuppliersByCategory(category: Supplier['type']): Supplier[] {
    const store = useSupplierStore.getState();
    return store.items.filter((s: Supplier) => s.type === category);
  }

  getActiveSuppliers(): Supplier[] {
    const store = useSupplierStore.getState();
    return store.items.filter((s: Supplier) => s.status === 'active');
  }

  searchSuppliers(searchTerm: string): Supplier[] {
    const store = useSupplierStore.getState();
    const term = searchTerm.toLowerCase();
    return store.items.filter((s: Supplier) =>
      s.name.toLowerCase().includes(term) ||
      s.contact.contact_person?.toLowerCase().includes(term) ||
      s.contact.email?.toLowerCase().includes(term)
    );
  }

  /**
   * 生成供應商編號
   * 格式：S + 國家代碼（3碼）+ 流水號（3碼）
   * 例如：SJPN001（日本的第一個供應商）
   */
  async generateSupplierCode(countryName: string): Promise<string> {
    const supplierStore = useSupplierStore.getState();
    const regionStore = useRegionStore.getState();

    // 從 regions 根據國家名稱找到國家代碼
    let countryCode = 'OTH'; // 預設其他
    const country = regionStore.items.find(
      r => r.type === 'country' && r.name === countryName && !r._deleted
    );
    if (country) {
      countryCode = country.code;
    }

    // 找出該國家現有的供應商數量，作為流水號
    const sameCountrySuppliers = supplierStore.items.filter(
      (s: Supplier) => s.country === countryName
    );

    // 生成流水號（從現有數量 +1 開始）
    const sequence = (sameCountrySuppliers.length + 1).toString().padStart(3, '0');

    return `S${countryCode}${sequence}`;
  }
}

export const supplierService = new SupplierService();
