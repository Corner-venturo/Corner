import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Customer } from '@/stores/types';
import { useTourStore } from '@/stores/tour-store';
import { ValidationError } from '@/core/errors/app-errors';

class CustomerService extends BaseService<Customer> {
  protected resourceName = 'customers';

  protected getStore(): StoreOperations<Customer> {
    const store = useTourStore.getState();
    return {
      getAll: () => store.customers,
      getById: (id: string) => store.customers.find(c => c.id === id),
      add: async (customer: Customer) => {
        await store.addCustomer(customer as any);
        return customer;
      },
      update: async (id: string, data: Partial<Customer>) => {
        await store.updateCustomer(id, data);
      },
      delete: async (id: string) => {
        await store.deleteCustomer(id);
      }
    };
  }

  protected validate(data: Partial<Customer>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new ValidationError('name', '客戶姓名至少需要 2 個字符');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new ValidationError('email', '郵件格式錯誤');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new ValidationError('phone', '電話格式錯誤');
    }

    if (data.idNumber && !this.isValidIdNumber(data.idNumber)) {
      throw new ValidationError('idNumber', '身份證字號格式錯誤');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^[\d\s\-+()]{8,}$/.test(phone);
  }

  private isValidIdNumber(idNumber: string): boolean {
    // 台灣身份證或護照基本驗證
    return /^[A-Z][12]\d{8}$/.test(idNumber) || /^[A-Z]{1,2}\d{6,9}$/.test(idNumber);
  }

  // ========== 業務邏輯方法 ==========

  searchCustomers(searchTerm: string): Customer[] {
    const store = useTourStore.getState();
    const term = searchTerm.toLowerCase();
    return store.customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.idNumber?.toLowerCase().includes(term)
    );
  }

  getCustomersByTour(tour_id: string): Customer[] {
    const store = useTourStore.getState();
    const tourOrders = store.orders.filter(o => o.tour_id === tourId);
    const customerIds = tourOrders.map(o => o.customerId);
    return store.customers.filter(c => customerIds.includes(c.id));
  }

  getVIPCustomers(): Customer[] {
    const store = useTourStore.getState();
    return store.customers.filter(c => c.isVIP);
  }
}

export const customerService = new CustomerService();
