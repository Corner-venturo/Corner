/**
 * useOrders - 訂單業務邏輯 Hook
 */

import { useMemo } from 'react';

import { useOrderStore, useMemberStore } from '@/stores';
import { Order, Member, CreateOrderData, UpdateOrderData, OrderStatus, PaymentStatus } from '@/types';

export function useOrders() {
  const orderStore = useOrderStore();
  const memberStore = useMemberStore();

  // ============================================
  // 資料驗證
  // ============================================

  const validateOrderData = (data: Partial<Order>): void => {
    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new Error('總金額不能為負數');
    }

    if (data.number_of_people !== undefined && data.number_of_people < 1) {
      throw new Error('人數必須大於 0');
    }

    if (data.paid_amount !== undefined && data.total_amount !== undefined) {
      if (data.paid_amount > data.total_amount) {
        throw new Error('已付金額不能大於總金額');
      }
    }
  };

  // ============================================
  // 業務邏輯
  // ============================================

  const calculateRemainingAmount = (order: Order): number => {
    return Math.max(0, order.total_amount - order.paid_amount);
  };

  const canEditOrder = (order: Order): boolean => {
    return order.status === 'pending' || order.status === 'confirmed';
  };

  const canCancelOrder = (order: Order): boolean => {
    return order.status !== 'completed' && order.status !== 'cancelled';
  };

  const getPaymentProgress = (order: Order): number => {
    if (order.total_amount === 0) return 0;
    return Math.round((order.paid_amount / order.total_amount) * 100);
  };

  const updatePaymentStatus = (order: Order): PaymentStatus => {
    if (order.paid_amount === 0) return 'unpaid';
    if (order.paid_amount < order.total_amount) return 'partial';
    if (order.paid_amount >= order.total_amount) return 'paid';
    return 'unpaid';
  };

  // ============================================
  // CRUD 操作
  // ============================================

  const createOrder = async (data: Omit<CreateOrderData, 'id' | 'code'>): Promise<Order> => {
    validateOrderData(data);

    const remainingAmount = data.total_amount - (data.paid_amount || 0);
    const orderData = {
      ...data,
      remainingAmount,
      paymentStatus: updatePaymentStatus(data as Order),
    };

    return await orderStore.create(orderData as Order);
  };

  const updateOrder = async (id: string, data: UpdateOrderData): Promise<Order> => {
    const existing = await orderStore.fetchById(id);
    if (!existing) throw new Error('訂單不存在');
    if (!canEditOrder(existing)) throw new Error('此訂單無法編輯');

    validateOrderData(data);

    // 重新計算付款狀態
    if (data.total_amount !== undefined || data.paid_amount !== undefined) {
      const updated = { ...existing, ...data };
      data.remaining_amount = calculateRemainingAmount(updated);
      data.payment_status = updatePaymentStatus(updated);
    }

    return await orderStore.update(id, data);
  };

  const cancelOrder = async (id: string): Promise<Order> => {
    const order = await orderStore.fetchById(id);
    if (!order) throw new Error('訂單不存在');
    if (!canCancelOrder(order)) throw new Error('此訂單無法取消');

    return await orderStore.update(id, { status: 'cancelled' });
  };

  // ============================================
  // 團員管理
  // ============================================

  const getOrderMembers = async (order_id: string): Promise<Member[]> => {
    await memberStore.fetchAll();
    return memberStore.findByField('orderId', orderId);
  };

  const addMember = async (orderData: Member): Promise<Member> => {
    const member = await memberStore.create(orderData);

    // 更新訂單人數
    const order = await orderStore.fetchById(orderData.order_id);
    if (order) {
      const members = await getOrderMembers(orderData.order_id);
      await orderStore.update(orderData.order_id, {
        numberOfPeople: members.length,
      });
    }

    return member;
  };

  // ============================================
  // 查詢方法
  // ============================================

  const getPendingOrders = useMemo(() => {
    return orderStore.items.filter(o => o.status === 'pending' && o.is_active);
  }, [orderStore.items]);

  const getUnpaidOrders = useMemo(() => {
    return orderStore.items.filter(o =>
      (o.payment_status === 'unpaid' || o.payment_status === 'partial') && o.is_active
    );
  }, [orderStore.items]);

  const getOrdersByTour = (tour_id: string): Order[] => {
    return orderStore.items.filter(o => o.tour_id === tourId);
  };

  return {
    orders: orderStore.items,
    loading: orderStore.loading,
    error: orderStore.error,

    fetchAll: orderStore.fetchAll,
    fetchById: orderStore.fetchById,
    createOrder,
    updateOrder,
    deleteOrder: orderStore.delete,
    cancelOrder,

    canEditOrder,
    canCancelOrder,
    calculateRemainingAmount,
    getPaymentProgress,

    getOrderMembers,
    addMember,

    pendingOrders: getPendingOrders,
    unpaidOrders: getUnpaidOrders,
    getOrdersByTour,
  };
}
