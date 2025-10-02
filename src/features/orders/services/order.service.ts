import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Order } from '@/stores/types';
import { useOrderStore } from '@/stores/order-store';
import { ValidationError } from '@/core/errors/app-errors';

class OrderService extends BaseService<Order> {
  protected resourceName = 'orders';

  protected getStore(): StoreOperations<Order> {
    const store = useOrderStore.getState();
    return {
      getAll: () => store.orders,
      getById: (id: string) => store.orders.find(o => o.id === id),
      add: (order: Order) => {
        store.addOrder(order as any);
        return order;
      },
      update: (id: string, data: Partial<Order>) => {
        store.updateOrder(id, data);
      },
      delete: (id: string) => {
        store.deleteOrder(id);
      }
    };
  }

  protected validate(data: Partial<Order>): void {
    if (data.tourId && !data.tourId.trim()) {
      throw new ValidationError('tourId', '必須關聯旅遊團');
    }

    if (data.totalAmount !== undefined && data.totalAmount < 0) {
      throw new ValidationError('totalAmount', '訂單金額不能為負數');
    }
  }

  // ========== 業務邏輯方法 ==========

  getOrdersByTour(tourId: string): Order[] {
    const store = useOrderStore.getState();
    return store.orders.filter(o => o.tourId === tourId);
  }

  getOrdersByStatus(status: Order['status']): Order[] {
    const store = useOrderStore.getState();
    return store.orders.filter(o => o.status === status);
  }

  getOrdersByCustomer(customerId: string): Order[] {
    const store = useOrderStore.getState();
    return store.orders.filter(o => o.customerId === customerId);
  }

  calculateTotalRevenue(): number {
    const store = useOrderStore.getState();
    return store.orders
      .filter(o => o.status === '已確認' || o.status === '已完成')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }

  getPendingOrders(): Order[] {
    return this.getOrdersByStatus('待確認');
  }

  getConfirmedOrders(): Order[] {
    return this.getOrdersByStatus('已確認');
  }
}

export const orderService = new OrderService();
