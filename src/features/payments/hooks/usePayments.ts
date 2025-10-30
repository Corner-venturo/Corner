import { usePaymentRequestStore, useDisbursementOrderStore } from '@/stores'
import { paymentRequestService } from '../services/payment-request.service'
import { disbursementOrderService } from '../services/disbursement-order.service'
import { PaymentRequest, PaymentRequestItem, DisbursementOrder } from '@/stores/types'
import { BaseEntity } from '@/types'

/**
 * Payments Hook - 統一財務操作接口
 *
 * 使用新的 Service 層架構
 */
export const usePayments = () => {
  const paymentRequestStore = usePaymentRequestStore()
  const disbursementOrderStore = useDisbursementOrderStore()

  return {
    // ========== 資料 ==========
    payment_requests: paymentRequestStore.items,
    disbursement_orders: disbursementOrderStore.items,

    // ========== PaymentRequest CRUD 操作 ==========
    createPaymentRequest: async (
      data: Omit<PaymentRequest, keyof BaseEntity | 'request_number'>
    ) => {
      return await paymentRequestService.create(data as unknown)
    },

    updatePaymentRequest: async (id: string, data: Partial<PaymentRequest>) => {
      return await paymentRequestService.update(id, data)
    },

    deletePaymentRequest: async (id: string) => {
      return await paymentRequestService.delete(id)
    },

    loadPaymentRequests: async () => {
      return await paymentRequestStore.fetchAll()
    },

    // ========== PaymentRequestItem 操作 ==========
    addPaymentItem: async (
      requestId: string,
      item: Omit<
        PaymentRequestItem,
        'id' | 'request_id' | 'item_number' | 'subtotal' | 'created_at' | 'updated_at'
      >
    ) => {
      return await paymentRequestService.addItem(requestId, item)
    },

    updatePaymentItem: async (
      requestId: string,
      itemId: string,
      data: Partial<PaymentRequestItem>
    ) => {
      return await paymentRequestService.updateItem(requestId, itemId, data)
    },

    deletePaymentItem: async (requestId: string, itemId: string) => {
      return await paymentRequestService.deleteItem(requestId, itemId)
    },

    // ========== PaymentRequest 業務邏輯 ==========
    createFromQuote: async (
      tourId: string,
      quoteId: string,
      requestDate: string,
      tourName: string,
      code: string
    ) => {
      return await paymentRequestService.createFromQuote(
        tourId,
        quoteId,
        requestDate,
        tourName,
        code
      )
    },

    calculateTotalAmount: async (requestId: string) => {
      return await paymentRequestService.calculateTotalAmount(requestId)
    },

    getItemsByCategory: (requestId: string, category: PaymentRequestItem['category']) => {
      return paymentRequestService.getItemsByCategory(requestId, category)
    },

    getPendingRequests: () => {
      return paymentRequestService.getPendingRequests()
    },

    getProcessingRequests: () => {
      return paymentRequestService.getProcessingRequests()
    },

    // ========== DisbursementOrder CRUD 操作 ==========
    createDisbursementOrder: async (paymentRequestIds: string[], note?: string) => {
      return await disbursementOrderService.createWithRequests(paymentRequestIds, note)
    },

    updateDisbursementOrder: async (id: string, data: Partial<DisbursementOrder>) => {
      return await disbursementOrderService.update(id, data)
    },

    deleteDisbursementOrder: async (id: string) => {
      return await disbursementOrderService.delete(id)
    },

    loadDisbursementOrders: async () => {
      return await disbursementOrderStore.fetchAll()
    },

    // ========== DisbursementOrder 業務邏輯 ==========
    confirmDisbursementOrder: async (id: string, confirmedBy: string) => {
      return await disbursementOrderService.confirmOrder(id, confirmedBy)
    },

    addToCurrentDisbursementOrder: async (paymentRequestIds: string[]) => {
      return await disbursementOrderService.addToCurrentWeekOrder(paymentRequestIds)
    },

    removeFromDisbursementOrder: async (orderId: string, requestId: string) => {
      return await disbursementOrderService.removePaymentRequest(orderId, requestId)
    },

    addPaymentRequestsToOrder: async (orderId: string, requestIds: string[]) => {
      return await disbursementOrderService.addPaymentRequests(orderId, requestIds)
    },

    getCurrentWeekDisbursementOrder: () => {
      return disbursementOrderService.getCurrentWeekOrder()
    },

    getNextThursday: () => {
      return disbursementOrderService.getNextThursday()
    },

    getPendingOrders: () => {
      return disbursementOrderService.getPendingOrders()
    },

    getConfirmedOrders: () => {
      return disbursementOrderService.getConfirmedOrders()
    },
  }
}
