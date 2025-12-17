import { BaseService, StoreOperations } from '@/core/services/base.service'
import { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { usePaymentRequestStore, usePaymentRequestItemStore } from '@/stores'
import { ValidationError } from '@/core/errors/app-errors'
import { generateId } from '@/lib/data/create-data-store'
import { generateVoucherFromPaymentRequest } from '@/services/voucher-auto-generator'
import { logger } from '@/lib/utils/logger'

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

    if (data.amount !== undefined && data.amount < 0) {
      throw new ValidationError('amount', '總金額不能為負數')
    }

    if (data.created_at) {
      const requestDate = new Date(data.created_at)
      const dayOfWeek = requestDate.getDay()
      if (dayOfWeek !== 4) {
        throw new ValidationError('created_at', '請款日期必須為週四')
      }
    }
  }

  // ========== PaymentRequestItem 管理 ==========

  /**
   * 取得請款單的所有項目
   */
  getItemsByRequestId(requestId: string): PaymentRequestItem[] {
    const itemStore = usePaymentRequestItemStore.getState()
    return itemStore.items.filter(item => item.request_id === requestId)
  }

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

    const itemStore = usePaymentRequestItemStore.getState()
    const existingItems = this.getItemsByRequestId(requestId)

    const now = this.now()
    // 品項編號格式：TYO241218A-R01-1, TYO241218A-R01-2...
    const itemIndex = existingItems.length + 1
    const itemNumber = `${request.code}-${itemIndex}`

    // 資料庫欄位是 unitprice（無底線），轉換欄位名稱
    const item = {
      request_id: requestId,
      item_number: itemNumber,
      category: itemData.category,
      supplier_id: itemData.supplier_id,
      supplier_name: itemData.supplier_name,
      description: itemData.description,
      unitprice: itemData.unit_price, // 資料庫欄位名稱
      quantity: itemData.quantity,
      subtotal: itemData.unit_price * itemData.quantity,
      note: itemData.note,
      sort_order: itemData.sort_order,
    }

    // 使用 itemStore 新增項目
    const createdItem = await itemStore.create(item as unknown as Parameters<typeof itemStore.create>[0])

    // 更新 request 的總金額
    const allItems = [...existingItems, createdItem as PaymentRequestItem]
    const totalAmount = allItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)

    await this.update(requestId, {
      amount: totalAmount,
      updated_at: now,
    })

    return createdItem as PaymentRequestItem
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

    const itemStore = usePaymentRequestItemStore.getState()
    const now = this.now()

    // 計算新的 subtotal
    const existingItem = itemStore.items.find(i => i.id === itemId)
    const unitPrice = itemData.unit_price ?? existingItem?.unit_price ?? 0
    const quantity = itemData.quantity ?? existingItem?.quantity ?? 0
    const subtotal = unitPrice * quantity

    // 使用 itemStore 更新項目
    await itemStore.update(itemId, {
      ...itemData,
      subtotal,
      updated_at: now,
    })

    // 更新 request 的總金額
    const allItems = this.getItemsByRequestId(requestId)
    const totalAmount = allItems.reduce((sum, i) => {
      if (i.id === itemId) {
        return sum + subtotal
      }
      return sum + (i.subtotal || 0)
    }, 0)

    await this.update(requestId, {
      amount: totalAmount,
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

    const itemStore = usePaymentRequestItemStore.getState()
    const now = this.now()

    // 使用 itemStore 刪除項目
    await itemStore.delete(itemId)

    // 更新 request 的總金額
    const remainingItems = this.getItemsByRequestId(requestId).filter(i => i.id !== itemId)
    const totalAmount = remainingItems.reduce((sum, i) => sum + (i.subtotal || 0), 0)

    await this.update(requestId, {
      amount: totalAmount,
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

    const items = this.getItemsByRequestId(requestId)
    const totalAmount = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)

    await this.update(requestId, {
      amount: totalAmount,
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
    const items = this.getItemsByRequestId(requestId)
    return items.filter(item => item.category === category)
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
      tour_id: tourId,
      code,
      request_number: code,
      request_date: requestDate,
      request_type: '從報價單自動生成',
      amount: 0,
      status: 'pending' as const,
      note: '從報價單自動生成',
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

  /**
   * ✅ 付款確認（標記為已付款，並自動產生會計傳票）
   */
  async markAsPaid(
    requestId: string,
    options?: {
      hasAccounting?: boolean
      isExpired?: boolean
      workspaceId?: string
    }
  ): Promise<void> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    if (request.status === 'paid') {
      throw new Error('此請款單已付款')
    }

    const now = this.now()

    // 1. 更新請款單狀態為已付款
    await this.update(requestId, {
      status: 'paid',
      paid_at: now,
      updated_at: now,
    })

    // 2. 如果啟用會計模組，自動產生傳票
    if (options?.hasAccounting && !options?.isExpired && options?.workspaceId) {
      try {
        // 判斷供應商類型（從第一個項目）
        const items = this.getItemsByRequestId(requestId)
        const firstItem = items[0]
        const supplierType = firstItem?.category || 'other'

        await generateVoucherFromPaymentRequest({
          workspace_id: options.workspaceId,
          payment_request_id: requestId,
          payment_amount: request.amount || 0,
          payment_date: now.split('T')[0], // YYYY-MM-DD
          supplier_type: supplierType as 'transportation' | 'accommodation' | 'meal' | 'ticket' | 'insurance' | 'other',
          description: `${request.request_number || ''} - 付款`,
        })

        logger.info('✅ 付款傳票已自動產生', {
          requestId,
          requestNumber: request.request_number,
          amount: request.amount,
        })
      } catch (error) {
        logger.error('❌ 傳票產生失敗（不影響付款確認）:', error)
        // 不阻斷付款流程
      }
    }
  }

  /**
   * 取消付款（將狀態改回待處理）
   */
  async cancelPayment(requestId: string): Promise<void> {
    const request = await this.getById(requestId)
    if (!request) {
      throw new Error(`找不到請款單: ${requestId}`)
    }

    if (request.status !== 'paid') {
      throw new Error('只能取消已付款的請款單')
    }

    await this.update(requestId, {
      status: 'pending',
      paid_at: undefined,
      updated_at: this.now(),
    })

    logger.warn('⚠️ 付款已取消，請手動作廢相關傳票', { requestId })
  }
}

export const paymentRequestService = new PaymentRequestService()
