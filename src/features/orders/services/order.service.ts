import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Order } from '@/stores/types';
import { useOrderStore } from '@/stores';
import { ValidationError } from '@/core/errors/app-errors';

class OrderService extends BaseService<Order> {
  protected resourceName = 'orders';

  protected getStore = (): StoreOperations<Order> => {
    const store = useOrderStore.getState();
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(o => o.id === id),
      add: async (order: Order) => {
        const result = await store.create(order as any);
        return result || order;
      },
      update: async (id: string, data: Partial<Order>) => {
        await store.update(id, data);
      },
      delete: async (id: string) => {
        await store.delete(id);
      }
    };
  }

  protected validate(data: Partial<Order>): void {
    if (data.tour_id && !data.tour_id.trim()) {
      throw new ValidationError('tour_id', '必須關聯旅遊團');
    }

    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new ValidationError('total_amount', '訂單金額不能為負數');
    }
  }

  // ========== 業務邏輯方法 ==========

  getOrdersByTour(tour_id: string): Order[] {
    const store = useOrderStore.getState();
    return store.items.filter(o => o.tour_id === tour_id);
  }

  getOrdersByStatus(status: '未收款' | '部分收款' | '已收款'): Order[] {
    const store = useOrderStore.getState();
    return store.items.filter(o => o.payment_status === status);
  }

  getOrdersByCustomer(customer_id: string): Order[] {
    const store = useOrderStore.getState();
    return store.items.filter((o: any) => o.customer_id === customer_id);
  }

  calculateTotalRevenue(): number {
    const store = useOrderStore.getState();
    return store.items
      .filter(o => o.payment_status === '已收款')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }

  getPendingOrders(): Order[] {
    return this.getOrdersByStatus('未收款');
  }

  getConfirmedOrders(): Order[] {
    return this.getOrdersByStatus('已收款');
  }
}

export const orderService = new OrderService();
