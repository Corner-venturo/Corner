import { useOrderStore } from '@/stores/order-store';
import { orderService } from '../services/order.service';
import { Order } from '@/stores/types';

export const useOrders = () => {
  const store = useOrderStore();

  return {
    // ========== 資料 ==========
    orders: store.orders,

    // ========== CRUD 操作 ==========
    createOrder: (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
      return store.addOrder(data);
    },

    updateOrder: (id: string, data: Partial<Order>) => {
      return store.updateOrder(id, data);
    },

    deleteOrder: (id: string) => {
      return store.deleteOrder(id);
    },

    loadOrders: () => {
      return store.loadOrders();
    },

    // ========== 業務方法 ==========
    getOrdersByTour: (tour_id: string) => {
      return orderService.getOrdersByTour(tourId);
    },

    getOrdersByStatus: (status: Order['status']) => {
      return orderService.getOrdersByStatus(status);
    },

    getOrdersByCustomer: (customerId: string) => {
      return orderService.getOrdersByCustomer(customerId);
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
