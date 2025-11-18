import { BaseService, StoreOperations } from '@/core/services/base.service'
import { useOrderStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'

// Use any to bypass type constraint
class OrderService extends BaseService<any> {
  protected resourceName = 'orders'

  protected getStore = (): StoreOperations<any> => {
    const store = useOrderStore.getState()
    return {
      getAll: () => store.items as any,
      getById: (id: string) => store.items.find((o: any) => o.id === id) as any,
      add: async (order: any) => {
        // 移除系統自動生成的欄位
        const { id, created_at, updated_at, ...createData } = order
        const result = await store.create(createData as any)
        return result as any
      },
      update: async (id: string, data: any) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: any): void {
    if (data.tour_id && !(data.tour_id as string).trim()) {
      throw new ValidationError('tour_id', '必須關聯旅遊團')
    }

    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new ValidationError('total_amount', '訂單金額不能為負數')
    }
  }

  // ========== 業務邏輯方法 ==========

  getOrdersByTour(tour_id: string): any[] {
    const store = useOrderStore.getState()
    return store.items.filter((o: any) => o.tour_id === tour_id) as any
  }

  getOrdersByStatus(status: 'unpaid' | 'partial' | 'paid'): any[] {
    const store = useOrderStore.getState()
    return store.items.filter((o: any) => o.payment_status === status) as any
  }

  getOrdersByCustomer(customer_id: string): any[] {
    const store = useOrderStore.getState()
    return store.items.filter((o: any) => o.customer_id === customer_id) as any
  }

  calculateTotalRevenue(): number {
    const store = useOrderStore.getState()
    return store.items
      .filter((o: any) => o.payment_status === 'paid')
      .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  }

  getPendingOrders(): any[] {
    return this.getOrdersByStatus('unpaid')
  }

  getConfirmedOrders(): any[] {
    return this.getOrdersByStatus('paid')
  }
}

export const orderService = new OrderService()
