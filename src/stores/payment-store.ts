import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentRequest, PaymentRequestItem, DisbursementOrder } from './types';
import { createPersistentCrudMethods, generateId } from '@/lib/persistent-store';

interface PaymentStore {
  paymentRequests: PaymentRequest[];
  selectedPaymentRequest: PaymentRequest | null;
  disbursementOrders: DisbursementOrder[];
  selectedDisbursementOrder: DisbursementOrder | null;

  // PaymentRequest CRUD（統一方法）
  addPaymentRequest: (request: Omit<PaymentRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>) => Promise<PaymentRequest>;
  updatePaymentRequest: (id: string, request: Partial<PaymentRequest>) => Promise<PaymentRequest | undefined>;
  deletePaymentRequest: (id: string) => Promise<boolean>;
  loadPaymentRequests: () => Promise<PaymentRequest[] | null>;
  setSelectedPaymentRequest: (request: PaymentRequest | null) => void;
  createPaymentRequestFromQuote: (tourId: string, quoteId: string, requestDate: string) => string;

  // PaymentRequestItem CRUD
  addPaymentItem: (requestId: string, item: Omit<PaymentRequestItem, 'id' | 'requestId' | 'itemNumber' | 'createdAt' | 'updatedAt'>) => string;
  updatePaymentItem: (requestId: string, itemId: string, item: Partial<PaymentRequestItem>) => void;
  deletePaymentItem: (requestId: string, itemId: string) => void;

  // DisbursementOrder CRUD
  createDisbursementOrder: (paymentRequestIds: string[], note?: string) => string;
  updateDisbursementOrder: (id: string, updates: Partial<DisbursementOrder>) => void;
  confirmDisbursementOrder: (id: string, confirmedBy: string) => void;
  addToCurrentDisbursementOrder: (paymentRequestIds: string[]) => void;
  removeFromDisbursementOrder: (disbursementId: string, paymentRequestId: string) => void;
  getCurrentWeekDisbursementOrder: () => DisbursementOrder | null;

  // Utility functions
  generateRequestNumber: () => string;
  generateDisbursementNumber: () => string;
  calculateTotalAmount: (requestId: string) => void;
  getItemsByCategory: (requestId: string, category: PaymentRequestItem['category']) => PaymentRequestItem[];
  getNextThursday: () => string;
  getPendingPaymentRequests: () => PaymentRequest[];
  getProcessingPaymentRequests: () => PaymentRequest[];
}

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      paymentRequests: [],
      selectedPaymentRequest: null,
      disbursementOrders: [],
      selectedDisbursementOrder: null,

      // PaymentRequest CRUD（使用統一方法，自定義 add 以生成 requestNumber）
      ...createPersistentCrudMethods<PaymentRequest>('payment_requests', 'paymentRequests', set, get),
      addPaymentRequest: (requestData) => {
        try {
          const id = generateId();
          const requestNumber = get().generateRequestNumber();
          const now = new Date().toISOString();

          const request: PaymentRequest = {
            ...requestData,
            id,
            requestNumber,
            items: [],
            totalAmount: 0,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({ paymentRequests: [...state.paymentRequests, request] }));
          return request;
        } catch (error) {
          console.error('❌ 新增請款單失敗:', error);
          throw error;
        }
      },

      setSelectedPaymentRequest: (request) => set({ selectedPaymentRequest: request }),

      // PaymentRequestItem CRUD（保留自定義邏輯）
      addPaymentItem: (requestId, itemData) => {
        try {
          const id = generateId();
          const now = new Date().toISOString();

          const request = get().paymentRequests.find(r => r.id === requestId);
          if (!request) {
            console.error('❌ 找不到請款單:', requestId);
            return '';
          }

          const itemNumber = `${request.requestNumber}-${String(request.items.length + 1).padStart(3, '0')}`;

          const item: PaymentRequestItem = {
            ...itemData,
            id,
            requestId,
            itemNumber,
            subtotal: itemData.unitPrice * itemData.quantity,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            paymentRequests: state.paymentRequests.map(request =>
              request.id === requestId
                ? {
                    ...request,
                    items: [...request.items, item],
                    updatedAt: now
                  }
                : request
            )
          }));

          get().calculateTotalAmount(requestId);
          return id;
        } catch (error) {
          console.error('❌ 新增請款項目失敗:', error);
          return '';
        }
      },

      updatePaymentItem: (requestId, itemId, itemData) => {
        try {
          const now = new Date().toISOString();

          set((state) => ({
            paymentRequests: state.paymentRequests.map(request =>
              request.id === requestId
                ? {
                    ...request,
                    items: request.items.map(item => {
                      if (item.id === itemId) {
                        const updatedItem = { ...item, ...itemData, updatedAt: now };
                        updatedItem.subtotal = updatedItem.unitPrice * updatedItem.quantity;
                        return updatedItem;
                      }
                      return item;
                    }),
                    updatedAt: now
                  }
                : request
            )
          }));

          get().calculateTotalAmount(requestId);
        } catch (error) {
          console.error('❌ 更新請款項目失敗:', error);
        }
      },

      deletePaymentItem: (requestId, itemId) => {
        try {
          const now = new Date().toISOString();

          set((state) => ({
            paymentRequests: state.paymentRequests.map(request =>
              request.id === requestId
                ? {
                    ...request,
                    items: request.items.filter(item => item.id !== itemId),
                    updatedAt: now
                  }
                : request
            )
          }));

          get().calculateTotalAmount(requestId);
        } catch (error) {
          console.error('❌ 刪除請款項目失敗:', error);
        }
      },

      // Utility functions
      generateRequestNumber: () => {
        const year = new Date().getFullYear();
        const existingNumbers = get().paymentRequests
          .filter(request => request.requestNumber.startsWith(`REQ-${year}`))
          .map(request => {
            const numPart = request.requestNumber.split('-')[1];
            return parseInt(numPart.substring(4)) || 0;
          });

        const nextNumber = Math.max(...existingNumbers, 0) + 1;
        return `REQ-${year}${nextNumber.toString().padStart(3, '0')}`;
      },

      calculateTotalAmount: (requestId) => {
        set((state) => ({
          paymentRequests: state.paymentRequests.map(request => {
            if (request.id === requestId) {
              const totalAmount = request.items.reduce((sum, item) => sum + item.subtotal, 0);
              return {
                ...request,
                totalAmount,
                updatedAt: new Date().toISOString()
              };
            }
            return request;
          })
        }));
      },

      getItemsByCategory: (requestId, category) => {
        const request = get().paymentRequests.find(r => r.id === requestId);
        return request?.items.filter(item => item.category === category) || [];
      },

      // DisbursementOrder CRUD
      createDisbursementOrder: (paymentRequestIds, note) => {
        try {
          const id = generateId();
          const orderNumber = get().generateDisbursementNumber();
          const disbursementDate = get().getNextThursday();
          const now = new Date().toISOString();

          const totalAmount = paymentRequestIds.reduce((sum, requestId) => {
            const request = get().paymentRequests.find(r => r.id === requestId);
            return sum + (request?.totalAmount || 0);
          }, 0);

          const disbursementOrder: DisbursementOrder = {
            id,
            orderNumber,
            disbursementDate,
            paymentRequestIds: [...paymentRequestIds],
            totalAmount,
            status: 'pending',
            note,
            createdBy: '1', // TODO: 使用實際用戶ID
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            disbursementOrders: [...state.disbursementOrders, disbursementOrder],
            paymentRequests: state.paymentRequests.map(request =>
              paymentRequestIds.includes(request.id)
                ? { ...request, status: 'processing' as const, updatedAt: now }
                : request
            )
          }));

          return id;
        } catch (error) {
          console.error('❌ 建立出納單失敗:', error);
          return '';
        }
      },

      updateDisbursementOrder: (id, updates) => {
        try {
          const now = new Date().toISOString();
          set((state) => ({
            disbursementOrders: state.disbursementOrders.map(order =>
              order.id === id
                ? { ...order, ...updates, updatedAt: now }
                : order
            )
          }));
        } catch (error) {
          console.error('❌ 更新出納單失敗:', error);
        }
      },

      confirmDisbursementOrder: (id, confirmedBy) => {
        try {
          const now = new Date().toISOString();
          const order = get().disbursementOrders.find(o => o.id === id);
          if (!order) {
            console.error('❌ 找不到出納單:', id);
            return;
          }

          set((state) => ({
            disbursementOrders: state.disbursementOrders.map(o =>
              o.id === id
                ? {
                    ...o,
                    status: 'confirmed' as const,
                    confirmedBy,
                    confirmedAt: now,
                    updatedAt: now
                  }
                : o
            ),
            paymentRequests: state.paymentRequests.map(request =>
              order.paymentRequestIds.includes(request.id)
                ? { ...request, status: 'confirmed' as const, updatedAt: now }
                : request
            )
          }));
        } catch (error) {
          console.error('❌ 確認出納單失敗:', error);
        }
      },

      addToCurrentDisbursementOrder: (paymentRequestIds) => {
        try {
          const currentOrder = get().getCurrentWeekDisbursementOrder();

          if (currentOrder && currentOrder.status === 'pending') {
            const newPaymentRequestIds = [...currentOrder.paymentRequestIds, ...paymentRequestIds];
            const newTotalAmount = newPaymentRequestIds.reduce((sum, requestId) => {
              const request = get().paymentRequests.find(r => r.id === requestId);
              return sum + (request?.totalAmount || 0);
            }, 0);

            get().updateDisbursementOrder(currentOrder.id, {
              paymentRequestIds: newPaymentRequestIds,
              totalAmount: newTotalAmount
            });
          } else {
            get().createDisbursementOrder(paymentRequestIds);
          }

          const now = new Date().toISOString();
          set((state) => ({
            paymentRequests: state.paymentRequests.map(request =>
              paymentRequestIds.includes(request.id)
                ? { ...request, status: 'processing' as const, updatedAt: now }
                : request
            )
          }));
        } catch (error) {
          console.error('❌ 加入出納單失敗:', error);
        }
      },

      removeFromDisbursementOrder: (disbursementId, paymentRequestId) => {
        try {
          const now = new Date().toISOString();
          const order = get().disbursementOrders.find(o => o.id === disbursementId);

          if (!order || order.status !== 'pending') {
            console.error('❌ 找不到待處理的出納單:', disbursementId);
            return;
          }

          const newPaymentRequestIds = order.paymentRequestIds.filter(id => id !== paymentRequestId);
          const newTotalAmount = newPaymentRequestIds.reduce((sum, requestId) => {
            const request = get().paymentRequests.find(r => r.id === requestId);
            return sum + (request?.totalAmount || 0);
          }, 0);

          set((state) => ({
            disbursementOrders: state.disbursementOrders.map(o =>
              o.id === disbursementId
                ? { ...o, paymentRequestIds: newPaymentRequestIds, totalAmount: newTotalAmount, updatedAt: now }
                : o
            ),
            paymentRequests: state.paymentRequests.map(request =>
              request.id === paymentRequestId
                ? { ...request, status: 'pending' as const, updatedAt: now }
                : request
            )
          }));
        } catch (error) {
          console.error('❌ 從出納單移除失敗:', error);
        }
      },

      getCurrentWeekDisbursementOrder: () => {
        const nextThursday = get().getNextThursday();
        return get().disbursementOrders.find(order =>
          order.disbursementDate === nextThursday && order.status === 'pending'
        ) || null;
      },

      // Utility functions
      generateDisbursementNumber: () => {
        const year = new Date().getFullYear();
        const existingNumbers = get().disbursementOrders
          .filter(order => order.orderNumber.startsWith(`CD-${year}`))
          .map(order => {
            const numPart = order.orderNumber.split('-')[1];
            return parseInt(numPart.substring(4)) || 0;
          });

        const nextNumber = Math.max(...existingNumbers, 0) + 1;
        return `CD-${year}${nextNumber.toString().padStart(3, '0')}`;
      },

      getNextThursday: () => {
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
      },

      getPendingPaymentRequests: () => {
        return get().paymentRequests.filter(request => request.status === 'pending');
      },

      getProcessingPaymentRequests: () => {
        return get().paymentRequests.filter(request => request.status === 'processing');
      },

      createPaymentRequestFromQuote: (tourId, quoteId, requestDate) => {
        try {
          const id = generateId();
          const requestNumber = get().generateRequestNumber();
          const now = new Date().toISOString();

          const request: PaymentRequest = {
            id,
            requestNumber,
            tourId,
            code: 'AUTO-GEN',
            tourName: '自動生成請款單',
            quoteId,
            requestDate,
            items: [],
            totalAmount: 0,
            status: 'pending',
            note: '從報價單自動生成',
            budgetWarning: false,
            createdBy: '1', // TODO: 使用實際用戶ID
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            paymentRequests: [...state.paymentRequests, request]
          }));

          return id;
        } catch (error) {
          console.error('❌ 從報價創建請款單失敗:', error);
          return '';
        }
      }
    }),
    {
      name: 'venturo-payment-store',
      version: 1,
    }
  )
);