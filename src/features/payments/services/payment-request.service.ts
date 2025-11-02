import { BaseService, StoreOperations } from '@/core/services/base.service'
import { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { usePaymentRequestStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'
import { generateId } from '@/lib/data/create-data-store'

class PaymentRequestService extends BaseService<PaymentRequest> {
  protected resourceName = 'payment_requests'

  protected getStore = (): StoreOperations<PaymentRequest> => {
    const store = usePaymentRequestStore.getState()
    return {
      getAll: () => store.items,
      getById: (id: string) => store.items.find(r => r.id === id),
      add: async (request: PaymentRequest) => {
        // 移除系統自動生成的欄位
        const { id, created_at, updated_at, ...createData } = request
        const result = await store.create(createData)
        return result
      },
      update: async (id: string, data: Partial<PaymentRequest>) => {
        await store.update(id, data)
      },
      delete: async (id: string) => {
        await store.delete(id)
      },
    }
  }

  protected validate(data: Partial<PaymentRequest>): void {
    if (data.tour_id && !data.tour_id.trim()) {
      throw new ValidationError('tour_id', '必須關聯旅遊團')
    }

    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new ValidationError('total_amount', '總金額不能為負數')
    }

    if (data.request_date) {
      const requestDate = new Date(data.request_date)
      const dayOfWeek = requestDate.getDay()
      if (dayOfWeek !== 4) {
        throw new ValidationError('request_date', '請款日期必須為週四')
      }
    }
  }

  // ========== PaymentRequestItem 管理 ==========

  /**
   * 新增請款項目
   */
  async addItem(
    requestId: string,
    itemData: Omit<
      PaymentRequestItem,
      'id' | 'request_id' | 'item_number' | 'subtotal' | 'created_at' | 'updated_at'
    >
  ): Promise<PaymentRequestItem> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    const id = generateId()
    const now = this.now()
    const itemNumber = `${request.request_number}-${String(request.items.length + 1).padStart(3, '0')}`

    const item: PaymentRequestItem = {
      ...itemData,
      id,
      request_id: requestId,
      item_number: itemNumber,
      subtotal: itemData.unit_price * itemData.quantity,
      created_at: now,
      updated_at: now,
    }

    // 更新 request 的 items 和 total_amount
    const updatedItems = [...request.items, item]
    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0)

    await this.update(requestId, {
      items: updatedItems,
      total_amount: totalAmount,
      updated_at: now,
    })

    return item
  }

  /**
   * 更新請款項目
   */
  async updateItem(
    requestId: string,
    itemId: string,
    itemData: Partial<PaymentRequestItem>
  ): Promise<void> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    const now = this.now()
    const updatedItems = request.items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...itemData, updated_at: now }
        updated.subtotal = updated.unit_price * updated.quantity
        return updated
      }
      return item
    })

    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0)

    await this.update(requestId, {
      items: updatedItems,
      total_amount: totalAmount,
      updated_at: now,
    })
  }

  /**
   * 刪除請款項目
   */
  async deleteItem(requestId: string, itemId: string): Promise<void> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    const now = this.now()
    const updatedItems = request.items.filter(item => item.id !== itemId)
    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0)

    await this.update(requestId, {
      items: updatedItems,
      total_amount: totalAmount,
      updated_at: now,
    })
  }

  // ========== 業務邏輯方法 ==========

  /**
   * 計算請款單總金額（手動觸發）
   */
  async calculateTotalAmount(requestId: string): Promise<number> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    const totalAmount = request.items.reduce((sum, item) => sum + item.subtotal, 0)

    await this.update(requestId, {
      total_amount: totalAmount,
      updated_at: this.now(),
    })

    return totalAmount
  }

  /**
   * 按類別取得請款項目
   */
  getItemsByCategory(
    requestId: string,
    category: PaymentRequestItem['category']
  ): PaymentRequestItem[] {
    const store = usePaymentRequestStore.getState()
    const request = store.items.find((r: PaymentRequest) => r.id === requestId)
    return request?.items.filter((item: PaymentRequestItem) => item.category === category) || []
  }

  /**
   * 從報價單創建請款單
   */
  async createFromQuote(
    tourId: string,
    quoteId: string,
    requestDate: string,
    tourName: string,
    code: string
  ): Promise<PaymentRequest> {
    const requestData = {
      allocation_mode: 'single' as const,
      tour_id: tourId,
      code,
      tour_name: tourName,
      quote_id: quoteId,
      request_date: requestDate,
      items: [],
      total_amount: 0,
      status: 'pending' as const,
      note: '從報價單自動生成',
      budget_warning: false,
      created_by: '1', // 使用實際用戶ID
    }

    return await this.create(requestData)
  }

  // ========== Query 方法 ==========

  /**
   * 取得待處理請款單
   */
  getPendingRequests(): PaymentRequest[] {
    const store = usePaymentRequestStore.getState()
    return store.items.filter(r => r.status === 'pending')
  }

  /**
   * 取得處理中請款單
   */
  getProcessingRequests(): PaymentRequest[] {
    const store = usePaymentRequestStore.getState()
    return store.items.filter(r => r.status === 'processing')
  }

  /**
   * 按旅遊團取得請款單
   */
  getRequestsByTour(tourId: string): PaymentRequest[] {
    const store = usePaymentRequestStore.getState()
    return store.items.filter(r => r.tour_id === tourId)
  }

  /**
   * 按訂單取得請款單
   */
  getRequestsByOrder(orderId: string): PaymentRequest[] {
    const store = usePaymentRequestStore.getState()
    return store.items.filter(r => r.order_id === orderId)
  }
}

export const paymentRequestService = new PaymentRequestService()
