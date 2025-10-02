import { usePaymentStore } from '@/stores/payment-store';
import { paymentService } from '../services/payment.service';
import { PaymentRequest, PaymentRequestItem } from '@/stores/types';

export const usePayments = () => {
  const store = usePaymentStore();

  return {
    // ========== 資料 ==========
    paymentRequests: store.paymentRequests,
    selectedPaymentRequest: store.selectedPaymentRequest,
    disbursementOrders: store.disbursementOrders,
    selectedDisbursementOrder: store.selectedDisbursementOrder,

    // ========== PaymentRequest 操作 ==========
    createPaymentRequest: async (data: Omit<PaymentRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>) => {
      return await store.addPaymentRequest(data);
    },

    updatePaymentRequest: async (id: string, data: Partial<PaymentRequest>) => {
      return await store.updatePaymentRequest(id, data);
    },

    deletePaymentRequest: async (id: string) => {
      return await store.deletePaymentRequest(id);
    },

    setSelectedPaymentRequest: (request: PaymentRequest | null) => {
      store.setSelectedPaymentRequest(request);
    },

    createFromQuote: async (tourId: string, quoteId: string, requestDate: string) => {
      return await paymentService.createFromQuote(tourId, quoteId, requestDate);
    },

    // ========== PaymentRequestItem 操作 ==========
    addPaymentItem: (requestId: string, item: Omit<PaymentRequestItem, 'id' | 'requestId' | 'itemNumber' | 'createdAt' | 'updatedAt'>) => {
      return store.addPaymentItem(requestId, item);
    },

    updatePaymentItem: (requestId: string, itemId: string, item: Partial<PaymentRequestItem>) => {
      store.updatePaymentItem(requestId, itemId, item);
    },

    deletePaymentItem: (requestId: string, itemId: string) => {
      store.deletePaymentItem(requestId, itemId);
    },

    // ========== DisbursementOrder 操作 ==========
    createDisbursementOrder: (paymentRequestIds: string[], note?: string) => {
      return paymentService.createDisbursementOrder(paymentRequestIds, note);
    },

    updateDisbursementOrder: (id: string, updates: any) => {
      store.updateDisbursementOrder(id, updates);
    },

    confirmDisbursementOrder: (id: string, confirmedBy: string) => {
      paymentService.confirmDisbursementOrder(id, confirmedBy);
    },

    addToCurrentDisbursementOrder: (paymentRequestIds: string[]) => {
      paymentService.addToCurrentDisbursementOrder(paymentRequestIds);
    },

    removeFromDisbursementOrder: (disbursementId: string, paymentRequestId: string) => {
      paymentService.removeFromDisbursementOrder(disbursementId, paymentRequestId);
    },

    getCurrentWeekDisbursementOrder: () => {
      return paymentService.getCurrentWeekDisbursementOrder();
    },

    // ========== 工具方法 ==========
    generateRequestNumber: () => paymentService.generateRequestNumber(),
    generateDisbursementNumber: () => paymentService.generateDisbursementNumber(),
    calculateTotalAmount: (request: PaymentRequest) => paymentService.calculateTotalAmount(request),
    getItemsByCategory: (requestId: string, category: PaymentRequestItem['category']) =>
      paymentService.getItemsByCategory(requestId, category),
    getNextThursday: () => paymentService.getNextThursday(),
    getPendingRequests: () => paymentService.getPendingRequests(),
    getProcessingRequests: () => paymentService.getProcessingRequests(),
  };
};
