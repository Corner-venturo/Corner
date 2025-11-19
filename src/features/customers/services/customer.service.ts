import { BaseService, StoreOperations } from '@/core/services/base.service'
import { Customer } from '@/types/models'
import { useCustomerStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'
import { BaseEntity } from '@/core/types/common'

class CustomerService extends BaseService<Customer & BaseEntity> {
  protected resourceName = 'customers'

  protected getStore = (): StoreOperations<Customer & BaseEntity> => {
    const store = useCustomerStore.getState()
    return {
      getAll: () => store.items as (Customer & BaseEntity)[],
      getById: (id: string) => store.items.find(c => c.id === id) as (Customer & BaseEntity) | undefined,
      add: async (customer: Customer & BaseEntity) => {
        await store.create(customer as unknown as Customer)
        return customer
      },
      update: async (id: string, data: Partial<Customer>) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<Customer>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '客戶姓名至少需要 2 個字符')
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError('email', '郵件格式錯誤')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new ValidationError('phone', '電話格式錯誤')
    }

    if (data.national_id && !this.isValidIdNumber(data.national_id)) {
      throw new ValidationError('national_id', '身份證字號格式錯誤')
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  private isValidPhone(phone: string): boolean {
    return /^[\d\s\-+()]{8,}$/.test(phone)
  }

  private isValidIdNumber(national_id: string): boolean {
    // 台灣身份證或護照基本驗證
    return /^[A-Z][12]\d{8}$/.test(national_id) || /^[A-Z]{1,2}\d{6,9}$/.test(national_id)
  }

  // ========== 業務邏輯方法 ==========

  searchCustomers(searchTerm: string): Customer[] {
    const store = useCustomerStore.getState()
    const term = searchTerm.toLowerCase()
    return store.items.filter(
      c =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.phone || '').includes(term) ||
        (c.national_id || '').toLowerCase().includes(term)
    ) as Customer[]
  }

  getCustomersByTour(_tour_id: string): Customer[] {
    const _store = useCustomerStore.getState()
    // Order 類型需要加入 customer_id 欄位
    // const tourOrders = useOrderStore.getState().items.filter(o => o.tour_id === _tour_id);
    // const customerIds = tourOrders.map(o => o.customer_id);
    // return _store.items.filter(c => customerIds.includes(c.id));
    return [] // 暫時返回空陣列，等 Order 類型更新
  }

  getVIPCustomers(): Customer[] {
    const store = useCustomerStore.getState()
    return store.items.filter(c => c.is_vip) as Customer[]
  }
}

export const customerService = new CustomerService()
