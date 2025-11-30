import { BaseService, StoreOperations } from '@/core/services/base.service'
import { useOrderStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'
import { Order, PaymentStatus } from '@/types/order.types'
import { BaseEntity } from '@/core/types/common'

class OrderService extends BaseService<Order & BaseEntity> {
  protected resourceName = 'orders'

  protected getStore = (): StoreOperations<Order & BaseEntity> => {
    const store = useOrderStore.getState()
    return {
      getAll: () => store.items as (Order & BaseEntity)[],
      getById: (id: string) => store.items.find(o => o.id === id) as (Order & BaseEntity) | undefined,
      add: async (order: Order & BaseEntity) => {
        const { id, created_at, updated_at, ...createData } = order
        const result = await store.create(createData)
        return result
      },
      update: async (id: string, data: Partial<Order>) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<Order>): void {
    if (data.tour_id && !data.tour_id.trim()) {
      throw new ValidationError('tour_id', '必須關聯旅遊團')
    }

    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new ValidationError('total_amount', '訂單金額不能為負數')
    }
  }

  // ========== 業務邏輯方法 ==========

  getOrdersByTour(tour_id: string): Order[] {
    const store = useOrderStore.getState()
    return store.items.filter(o => o.tour_id === tour_id)
  }

  getOrdersByStatus(status: PaymentStatus): Order[] {
    const store = useOrderStore.getState()
    return store.items.filter(o => o.payment_status === status)
  }

  getOrdersByCustomer(customer_id: string): Order[] {
    const store = useOrderStore.getState()
    return store.items.filter(o => o.customer_id === customer_id)
  }

  calculateTotalRevenue(): number {
    const store = useOrderStore.getState()
    return store.items
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0)
  }

  getPendingOrders(): Order[] {
    return this.getOrdersByStatus('unpaid')
  }

  getConfirmedOrders(): Order[] {
    return this.getOrdersByStatus('paid')
  }
}

export const orderService = new OrderService()
