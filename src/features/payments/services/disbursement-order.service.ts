import { BaseService, StoreOperations } from '@/core/services/base.service'
import { DisbursementOrder, PaymentRequest } from '@/stores/types'
import { useDisbursementOrderStore, usePaymentRequestStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'

class DisbursementOrderService extends BaseService<DisbursementOrder> {
  protected resourceName = 'disbursement_orders'

  protected getStore = (): StoreOperations<DisbursementOrder> => {
    const store = useDisbursementOrderStore.getState()
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(o => o.id === id),
      add: async (order: DisbursementOrder) => {
        // 移除系統自動生成的欄位
        const { id, created_at, updated_at, ...createData } = order
        const result = await store.create(createData)
        return result
      },
      update: async (id: string, data: Partial<DisbursementOrder>) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<DisbursementOrder>): void {
    if (data.payment_request_ids && data.payment_request_ids.length === 0) {
      throw new ValidationError('payment_request_ids', '出納單必須包含至少一個請款單')
    }

    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new ValidationError('total_amount', '總金額不能為負數')
    }

    if (data.disbursement_date) {
      const date = new Date(data.disbursement_date)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 4) {
        throw new ValidationError('disbursement_date', '出納日期必須為週四')
      }
    }
  }

  // ========== 業務邏輯方法 ==========

  /**
   * 取得下週四日期
   */
  getNextThursday(): string {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7
    const nextThursday = new Date(today)

    // 如果今天是週四且超過 17:00，則為下週四
    if (daysUntilThursday === 0 && today.getHours() >= 17) {
      nextThursday.setDate(today.getDate() + 7)
    } else if (daysUntilThursday === 0) {
      nextThursday.setDate(today.getDate())
    } else {
      nextThursday.setDate(today.getDate() + daysUntilThursday)
    }

    return nextThursday.toISOString().split('T')[0]
  }

  /**
   * 取得當週出納單（待處理）
   */
  getCurrentWeekOrder(): DisbursementOrder | null {
    const nextThursday = this.getNextThursday()
    const store = useDisbursementOrderStore.getState()

    return (
      store.items.find(
        order => order.disbursement_date === nextThursday && order.status === 'pending'
      ) || null
    )
  }

  /**
   * 使用請款單創建出納單
   */
  async createWithRequests(paymentRequestIds: string[], note?: string): Promise<DisbursementOrder> {
    // 計算總金額
    const paymentRequestStore = usePaymentRequestStore.getState()
    const totalAmount = paymentRequestIds.reduce((sum, requestId) => {
      const request = paymentRequestStore.items.find((r: any) => r.id === requestId)
      return sum + (request?.total_amount || 0)
    }, 0)

    const orderData = {
      disbursement_date: this.getNextThursday(),
      payment_request_ids: [...paymentRequestIds],
      total_amount: totalAmount,
      status: 'pending' as const,
      note,
      created_by: '1', // 使用實際用戶ID
    }

    const order = await this.create(orderData)

    // 更新請款單狀態為 processing
    for (const requestId of paymentRequestIds) {
      await this.updatePaymentRequestStatus(requestId, 'processing')
    }

    return order
  }

  /**
   * 確認出納單
   */
  async confirmOrder(orderId: string, confirmedBy: string): Promise<void> {
    const order = await this.getById(orderId)
    if (!order) {
      throw new Error(`找不到出納單: ${orderId}`)
    }

    if (order.status !== 'pending') {
      throw new Error('只能確認待處理的出納單')
    }

    const now = this.now()

    // 更新出納單狀態
    await this.update(orderId, {
      status: 'confirmed',
      confirmed_by: confirmedBy,
      confirmed_at: now,
      updated_at: now,
    })

    // 更新所有關聯請款單狀態為 confirmed
    for (const requestId of order.payment_request_ids) {
      await this.updatePaymentRequestStatus(requestId, 'confirmed')
    }
  }

  /**
   * 添加請款單到出納單
   */
  async addPaymentRequests(orderId: string, requestIds: string[]): Promise<void> {
    const order = await this.getById(orderId)
    if (!order) {
      throw new Error(`找不到出納單: ${orderId}`)
    }

    if (order.status !== 'pending') {
      throw new Error('只能修改待處理的出納單')
    }

    // 計算新的總金額
    const paymentRequestStore = usePaymentRequestStore.getState()
    const newRequestIds = [...order.payment_request_ids, ...requestIds]
    const newTotalAmount = newRequestIds.reduce((sum, requestId) => {
      const request = paymentRequestStore.items.find(r => r.id === requestId)
      return sum + (request?.total_amount || 0)
    }, 0)

    // 更新出納單
    await this.update(orderId, {
      payment_request_ids: newRequestIds,
      total_amount: newTotalAmount,
      updated_at: this.now(),
    })

    // 更新請款單狀態
    for (const requestId of requestIds) {
      await this.updatePaymentRequestStatus(requestId, 'processing')
    }
  }

  /**
   * 從出納單移除請款單
   */
  async removePaymentRequest(orderId: string, requestId: string): Promise<void> {
    const order = await this.getById(orderId)
    if (!order) {
      throw new Error(`找不到出納單: ${orderId}`)
    }

    if (order.status !== 'pending') {
      throw new Error('只能修改待處理的出納單')
    }

    // 計算新的總金額
    const paymentRequestStore = usePaymentRequestStore.getState()
    const newRequestIds = order.payment_request_ids.filter(id => id !== requestId)
    const newTotalAmount = newRequestIds.reduce((sum, reqId) => {
      const request = paymentRequestStore.items.find(r => r.id === reqId)
      return sum + (request?.total_amount || 0)
    }, 0)

    // 更新出納單
    await this.update(orderId, {
      payment_request_ids: newRequestIds,
      total_amount: newTotalAmount,
      updated_at: this.now(),
    })

    // 將請款單狀態改回 pending
    await this.updatePaymentRequestStatus(requestId, 'pending')
  }

  /**
   * 添加到當週出納單（找不到則創建新的）
   */
  async addToCurrentWeekOrder(requestIds: string[]): Promise<DisbursementOrder> {
    const currentOrder = this.getCurrentWeekOrder()

    if (currentOrder) {
      // 已有當週出納單，直接添加
      await this.addPaymentRequests(currentOrder.id, requestIds)
      return (await this.getById(currentOrder.id)) as DisbursementOrder
    } else {
      // 沒有當週出納單，創建新的
      return await this.createWithRequests(requestIds)
    }
  }

  // ========== Helper 方法 ==========

  /**
   * 更新請款單狀態（私有方法）
   */
  private async updatePaymentRequestStatus(
    requestId: string,
    status: PaymentRequest['status']
  ): Promise<void> {
    const store = usePaymentRequestStore.getState()
    await store.update(requestId, {
      status,
      updated_at: this.now(),
    })
  }

  // ========== Query 方法 ==========

  /**
   * 取得待處理出納單
   */
  getPendingOrders(): DisbursementOrder[] {
    const store = useDisbursementOrderStore.getState()
    return store.items.filter(o => o.status === 'pending')
  }

  /**
   * 取得已確認出納單
   */
  getConfirmedOrders(): DisbursementOrder[] {
    const store = useDisbursementOrderStore.getState()
    return store.items.filter(o => o.status === 'confirmed')
  }

  /**
   * 按日期取得出納單
   */
  getOrdersByDate(date: string): DisbursementOrder[] {
    const store = useDisbursementOrderStore.getState()
    return store.items.filter(o => o.disbursement_date === date)
  }
}

export const disbursementOrderService = new DisbursementOrderService()
