import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from './types';
import { createPersistentCrudMethods } from '@/lib/persistent-store';

interface OrderState {
  orders: Order[];

  // CRUD 方法
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Order;
  updateOrder: (id: string, order: Partial<Order>) => Order | undefined;
  deleteOrder: (id: string) => boolean;
  loadOrders: () => Order[] | null;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],

      // 使用統一的 CRUD 方法
      ...createPersistentCrudMethods<Order>('orders', 'orders', set, get),
    }),
    {
      name: 'venturo-order-store',
      version: 1,
    }
  )
);
