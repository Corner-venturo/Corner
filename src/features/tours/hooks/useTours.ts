import { useTourStore } from '@/stores/tour-store';
import { tourService } from '../services/tour.service';
import { Tour, Order, Customer, Payment, Member } from '@/stores/types';

/**
 * 簡化版 Tours Hook（與其他模組接口統一）
 *
 * 使用範例：
 * const { tours, orders, createTour, updateTour } = useTours();
 */
export const useTours = () => {
  const store = useTourStore();

  return {
    // ========== 資料 ==========
    tours: store.tours,
    orders: store.orders,
    customers: store.customers,
    payments: store.payments,
    members: store.members,
    tourAddOns: store.tourAddOns,
    selectedTour: store.selectedTour,

    // ========== Tour CRUD 操作 ==========
    createTour: async (data: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addTour(data);
    },

    updateTour: async (id: string, data: Partial<Tour>) => {
      return await store.updateTour(id, data);
    },

    deleteTour: async (id: string) => {
      return await store.deleteTour(id);
    },

    loadTours: async () => {
      return await store.loadTours();
    },

    setSelectedTour: (tour: Tour | null) => {
      store.setSelectedTour(tour);
    },

    createTourFromQuote: (quote_id: string, tourData: Partial<Tour>) => {
      return store.createTourFromQuote(quoteId, tourData);
    },

    // ========== Order CRUD 操作 ==========
    createOrder: async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addOrder(data);
    },

    updateOrder: async (id: string, data: Partial<Order>) => {
      return await store.updateOrder(id, data);
    },

    deleteOrder: async (id: string) => {
      return await store.deleteOrder(id);
    },

    loadOrders: async () => {
      return await store.loadOrders();
    },

    updateOrderMemberCount: (order_id: string) => {
      store.updateOrderMemberCount(orderId);
    },

    // ========== Customer CRUD 操作 ==========
    createCustomer: async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addCustomer(data);
    },

    updateCustomer: async (id: string, data: Partial<Customer>) => {
      return await store.updateCustomer(id, data);
    },

    deleteCustomer: async (id: string) => {
      return await store.deleteCustomer(id);
    },

    loadCustomers: async () => {
      return await store.loadCustomers();
    },

    // ========== Payment CRUD 操作 ==========
    createPayment: async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addPayment(data);
    },

    updatePayment: async (id: string, data: Partial<Payment>) => {
      return await store.updatePayment(id, data);
    },

    deletePayment: async (id: string) => {
      return await store.deletePayment(id);
    },

    loadPayments: async () => {
      return await store.loadPayments();
    },

    // ========== Member CRUD 操作 ==========
    createMember: async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addMember(data);
    },

    updateMember: async (id: string, data: Partial<Member>) => {
      return await store.updateMember(id, data);
    },

    deleteMember: async (id: string) => {
      return await store.deleteMember(id);
    },

    loadMembers: async () => {
      return await store.loadMembers();
    },

    // ========== 業務方法（來自 Service） ==========
    generateTourCode: async (location: string, date: Date, isSpecial?: boolean) => {
      return await tourService.generateTourCode(location, date, isSpecial);
    },

    isTourCodeExists: async (code: string) => {
      return await tourService.isTourCodeExists(code);
    },

    calculateFinancialSummary: async (tour_id: string) => {
      return await tourService.calculateFinancialSummary(tourId);
    },

    updateTourStatus: async (tour_id: string, status: Tour['status'], reason?: string) => {
      return await tourService.updateTourStatus(tourId, status, reason);
    },
  };
};
