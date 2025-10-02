import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tour, Order, Customer, Payment, Member, TourAddOn } from './types';
import { generateTourCode } from '@/lib/utils';
import { createPersistentCrudMethods } from '@/lib/persistent-store';

interface TourState {
  tours: Tour[];
  orders: Order[];
  customers: Customer[];
  payments: Payment[];
  members: Member[];
  tourAddOns: TourAddOn[];
  selectedTour: Tour | null;

  // Tours CRUD
  addTour: (tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tour>;
  updateTour: (id: string, tour: Partial<Tour>) => Promise<Tour>;
  deleteTour: (id: string) => Promise<void>;
  loadTours: () => Promise<Tour[]>;
  setSelectedTour: (tour: Tour | null) => void;
  createTourFromQuote: (quoteId: string, tourData: Partial<Tour>) => string;

  // Orders CRUD
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  loadOrders: () => Promise<Order[]>;
  updateOrderMemberCount: (orderId: string) => void;

  // Customers CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomers: () => Promise<Customer[]>;

  // Payments CRUD
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Payment>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  loadPayments: () => Promise<Payment[]>;

  // Members CRUD
  addMember: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMember: (id: string, member: Partial<Member>) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  loadMembers: () => Promise<Member[]>;

  // Tour Add-ons CRUD
  addTourAddOn: (addOn: Omit<TourAddOn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTourAddOn: (id: string, addOn: Partial<TourAddOn>) => Promise<TourAddOn>;
  deleteTourAddOn: (id: string) => Promise<void>;
  loadTourAddOns: () => Promise<TourAddOn[]>;
}

export const useTourStore = create<TourState>(
  persist(
    (set, get) => ({
      tours: [],
      orders: [],
      customers: [],
      payments: [],
      members: [],
      tourAddOns: [],
      selectedTour: null,

      // 使用 CRUD 方法
      ...createPersistentCrudMethods<Tour>('tours', 'tours', set, get),
      ...createPersistentCrudMethods<Order>('orders', 'orders', set, get),
      ...createPersistentCrudMethods<Customer>('customers', 'customers', set, get),
      ...createPersistentCrudMethods<Payment>('payments', 'payments', set, get),
      ...createPersistentCrudMethods<Member>('members', 'members', set, get),
      ...createPersistentCrudMethods<TourAddOn>('tour_addons', 'tourAddOns', set, get),

      // 自定義方法
      setSelectedTour: (tour) => set({ selectedTour: tour }),

      createTourFromQuote: (quoteId, tourData) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();
        const code = generateTourCode(tourData.location || '', tourData.departureDate || '');

        const tour: Tour = {
          id,
          code,
          name: tourData.name || '',
          departureDate: tourData.departureDate || '',
          returnDate: tourData.returnDate || '',
          status: '提案',
          location: tourData.location || '',
          price: tourData.price || 0,
          maxParticipants: tourData.maxParticipants || 20,
          contractStatus: '未簽署',
          totalRevenue: 0,
          totalCost: 0,
          profit: 0,
          quoteId,
          quoteCostStructure: undefined,
          createdAt: now,
          updatedAt: now,
          ...tourData
        };

        set((state) => ({
          tours: [...state.tours, tour]
        }));

        return id;
      },

      updateOrderMemberCount: (orderId) => set((state) => {
        const memberCount = state.members.filter(member => member.orderId === orderId).length;
        return {
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, memberCount, updatedAt: new Date().toISOString() }
              : order
          )
        };
      })
    }),
    {
      name: 'tour-storage',
      // 當表格準備好時，可以啟用自動同步
      partialize: (state) => ({
        tours: state.tours,
        orders: state.orders,
        customers: state.customers,
        payments: state.payments,
        members: state.members,
        tourAddOns: state.tourAddOns,
        selectedTour: state.selectedTour
      })
    }
  )
);