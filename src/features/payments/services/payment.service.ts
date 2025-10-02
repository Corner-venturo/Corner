import { BaseService, StoreOperations } from '@/core/services/base.service';
import { PaymentRequest, PaymentRequestItem, DisbursementOrder } from '@/stores/types';
import { usePaymentStore } from '@/stores/payment-store';
import { ValidationError } from '@/core/errors/app-errors';

class PaymentService extends BaseService<PaymentRequest> {
  protected resourceName = 'payment_requests';

  protected getStore(): StoreOperations<PaymentRequest> {
    const store = usePaymentStore.getState();
    return {
      getAll: () => store.paymentRequests,
      getById: (id: string) => store.paymentRequests.find(p => p.id === id),
      add: async (request: PaymentRequest) => {
        await store.addPaymentRequest(request as any);
        return request;
      },
      update: async (id: string, data: Partial<PaymentRequest>) => {
        await store.updatePaymentRequest(id, data);
      },
      delete: async (id: string) => {
        await store.deletePaymentRequest(id);
      }
    };
  }

  protected validate(data: Partial<PaymentRequest>): void {
    if (data.totalAmount !== undefined && data.totalAmount < 0) {
      throw new ValidationError('totalAmount', '金額不能為負數');
    }

    if (data.requestDate) {
      const requestDate = new Date(data.requestDate);
      if (isNaN(requestDate.getTime())) {
        throw new ValidationError('requestDate', '請款日期格式錯誤');
      }
    }
  }

  // ========== 業務邏輯方法 ==========

  generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const store = usePaymentStore.getState();
    const existingNumbers = store.paymentRequests
      .filter(r => r.requestNumber.startsWith(`REQ-${year}`))
      .map(r => {
        const numPart = r.requestNumber.split('-')[1];
        return parseInt(numPart.substring(4)) || 0;
      });

    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    return `REQ-${year}${nextNumber.toString().padStart(3, '0')}`;
  }

  calculateTotalAmount(request: PaymentRequest): number {
    return request.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  getNextThursday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    const nextThursday = new Date(today);

    if (daysUntilThursday === 0 && today.getHours() >= 17) {
      nextThursday.setDate(today.getDate() + 7);
    } else if (daysUntilThursday === 0) {
      nextThursday.setDate(today.getDate());
    } else {
      nextThursday.setDate(today.getDate() + daysUntilThursday);
    }

    return nextThursday.toISOString().split('T')[0];
  }

  async createFromQuote(tourId: string, quoteId: string, requestDate: string): Promise<string> {
    const store = usePaymentStore.getState();
    return store.createPaymentRequestFromQuote(tourId, quoteId, requestDate);
  }

  getPendingRequests(): PaymentRequest[] {
    return usePaymentStore.getState().paymentRequests.filter(r => r.status === 'pending');
  }

  getProcessingRequests(): PaymentRequest[] {
    return usePaymentStore.getState().paymentRequests.filter(r => r.status === 'processing');
  }

  getItemsByCategory(requestId: string, category: PaymentRequestItem['category']): PaymentRequestItem[] {
    const store = usePaymentStore.getState();
    return store.getItemsByCategory(requestId, category);
  }

  // ========== DisbursementOrder 業務邏輯 ==========

  generateDisbursementNumber(): string {
    const year = new Date().getFullYear();
    const store = usePaymentStore.getState();
    const existingNumbers = store.disbursementOrders
      .filter(order => order.orderNumber.startsWith(`CD-${year}`))
      .map(order => {
        const numPart = order.orderNumber.split('-')[1];
        return parseInt(numPart.substring(4)) || 0;
      });

    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    return `CD-${year}${nextNumber.toString().padStart(3, '0')}`;
  }

  createDisbursementOrder(paymentRequestIds: string[], note?: string): string {
    const store = usePaymentStore.getState();
    return store.createDisbursementOrder(paymentRequestIds, note);
  }

  confirmDisbursementOrder(id: string, confirmedBy: string): void {
    const store = usePaymentStore.getState();
    store.confirmDisbursementOrder(id, confirmedBy);
  }

  getCurrentWeekDisbursementOrder(): DisbursementOrder | null {
    const store = usePaymentStore.getState();
    return store.getCurrentWeekDisbursementOrder();
  }

  addToCurrentDisbursementOrder(paymentRequestIds: string[]): void {
    const store = usePaymentStore.getState();
    store.addToCurrentDisbursementOrder(paymentRequestIds);
  }

  removeFromDisbursementOrder(disbursementId: string, paymentRequestId: string): void {
    const store = usePaymentStore.getState();
    store.removeFromDisbursementOrder(disbursementId, paymentRequestId);
  }
}

export const paymentService = new PaymentService();
