import { useOrderStore } from '@/stores';
import { orderService } from '../services/order.service';
import { Order } from '@/stores/types';

export const useOrders = () => {
  const store = useOrderStore();

  return {
    // ========== 資料 ==========
    orders: store.items,

    // ========== CRUD 操作 ==========
    createOrder: async (data: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
      return await store.create(data as unknown);
    },

    updateOrder: async (id: string, data: Partial<Order>) => {
      return await store.update(id, data);
    },

    deleteOrder: async (id: string) => {
      return await store.delete(id);
    },

    loadOrders: async () => {
      return await store.fetchAll();
    },

    // ========== 業務方法 ==========
    getOrdersByTour: (tour_id: string) => {
      return orderService.getOrdersByTour(tour_id);
    },

    getOrdersByStatus: (status: string) => {
      // Order 介面沒有 status 欄位
      return orderService.getOrdersByStatus(status as unknown);
    },

    getOrdersByCustomer: (customer_id: string) => {
      return orderService.getOrdersByCustomer(customer_id);
    },

    calculateTotalRevenue: () => {
      return orderService.calculateTotalRevenue();
    },

    getPendingOrders: () => {
      return orderService.getPendingOrders();
    },

    getConfirmedOrders: () => {
      return orderService.getConfirmedOrders();
    },
  };
};
