import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Supplier } from '@/stores/types';
import { useSupplierStore, useRegionStore } from '@/stores';
import { ValidationError } from '@/core/errors/app-errors';
import { supabase } from '@/lib/supabase/client';
import type { SupplierPaymentAccount } from '@/types/supplier.types';

class SupplierService extends BaseService<Supplier> {
  protected resourceName = 'suppliers';

  protected getStore = (): StoreOperations<Supplier> => {
    const store = useSupplierStore.getState();
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find((s: Supplier) => s.id === id),
      add: async (supplier: Supplier) => {
        await store.create(supplier as unknown);
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

  /**
   * 儲存供應商的城市關聯（寫入 supplier_cities 表）
   */
  async saveSupplierCities(supplierId: string, cityIds: string[]): Promise<void> {
    if (!cityIds || cityIds.length === 0) return;

    try {
      // 準備關聯資料
      const supplierCities = cityIds.map(cityId => ({
        supplier_id: supplierId,
        city_id: cityId,
      }));

      // 批次寫入 Supabase
      const { error } = await supabase
        .from('supplier_cities')
        .insert(supplierCities);

      if (error) {
        console.error('儲存供應商城市關聯失敗:', error);
        throw error;
      }

      console.log(`✅ 已儲存 ${cityIds.length} 個城市關聯`);
    } catch (error) {
      console.error('saveSupplierCities 失敗:', error);
      throw error;
    }
  }

  /**
   * 儲存供應商的付款帳戶（寫入 supplier_payment_accounts 表）
   */
  async savePaymentAccounts(
    supplierId: string,
    accounts: Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    if (!accounts || accounts.length === 0) return;

    try {
      // 準備資料
      const paymentAccounts = accounts.map(account => ({
        supplier_id: supplierId,
        ...account
      }));

      // 批次寫入 Supabase
      const { error } = await supabase
        .from('supplier_payment_accounts')
        .insert(paymentAccounts);

      if (error) {
        console.error('儲存付款帳戶失敗:', error);
        throw error;
      }

      console.log(`✅ 已儲存 ${accounts.length} 個付款帳戶`);
    } catch (error) {
      console.error('savePaymentAccounts 失敗:', error);
      throw error;
    }
  }

  /**
   * 建立供應商（包含城市關聯和付款帳戶）
   * 直接寫入 Supabase（繞過 store 避免型別不一致問題）
   */
  async createSupplierWithCities(
    supplierData: {
      supplier_code?: string;
      name: string;
      country?: string;
      region?: string;
      type: string;
      contact: {
        contact_person: string;
        phone: string;
        email?: string;
        address?: string;
        website?: string;
      };
      status: string;
      note?: string;
    },
    cityIds: string[],
    paymentAccounts?: Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ id: string }> {
    try {
      // 1. 轉換資料格式以符合資料庫結構
      const dbData = {
        code: supplierData.supplier_code || '',
        name: supplierData.name,
        country_id: supplierData.country || null,
        region_id: supplierData.region || null,
        type: supplierData.type,
        contact_person: supplierData.contact.contact_person,
        phone: supplierData.contact.phone,
        email: supplierData.contact.email || null,
        address: supplierData.contact.address || null,
        website: supplierData.contact.website || null,
        is_active: supplierData.status === 'active',
        notes: supplierData.note || null
      };

      // 2. 直接寫入 Supabase
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert([dbData])
        .select('id')
        .single();

      if (supplierError) {
        console.error('建立供應商失敗:', supplierError);
        throw supplierError;
      }

      if (!newSupplier) {
        throw new Error('建立供應商失敗：沒有返回資料');
      }

      // 3. 儲存城市關聯
      if (cityIds && cityIds.length > 0) {
        await this.saveSupplierCities(newSupplier.id, cityIds);
      }

      // 4. 儲存付款帳戶
      if (paymentAccounts && paymentAccounts.length > 0) {
        await this.savePaymentAccounts(newSupplier.id, paymentAccounts);
      }

      console.log('✅ 供應商建立成功:', newSupplier.id);
      return newSupplier;
    } catch (error) {
      console.error('createSupplierWithCities 失敗:', error);
      throw error;
    }
  }
}

export const supplierService = new SupplierService();
