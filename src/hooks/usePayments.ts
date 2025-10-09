/**
 * usePayments - 付款業務邏輯 Hook
 */

import { useMemo } from 'react';

import { usePaymentStore } from '@/stores';
import { Payment, CreatePaymentData, PaymentMethod } from '@/types';

export function usePayments() {
  const store = usePaymentStore();

  const validatePaymentData = (data: Partial<Payment>): void => {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('付款金額必須大於 0');
    }
  };

  const createPayment = async (data: Omit<CreatePaymentData, 'id' | 'code'>): Promise<Payment> => {
    validatePaymentData(data);
    return await store.create(data as Payment);
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      cash: '現金',
      credit_card: '信用卡',
      debit_card: '金融卡',
      bank_transfer: '銀行轉帳',
      check: '支票',
      mobile_payment: '行動支付',
      other: '其他',
    };
    return labels[method];
  };

  const getPaymentsByOrder = (order_id: string): Payment[] => {
    return store.items.filter(p => p.order_id === orderId);
  };

  const getTotalPaidByOrder = (order_id: string): number => {
    return getPaymentsByOrder(orderId).reduce((sum, p) => sum + p.amount, 0);
  };

  const pendingPayments = useMemo(() => {
    return store.items.filter(p => p.status === 'pending');
  }, [store.items]);

  return {
    payments: store.items,
    loading: store.loading,
    error: store.error,
    fetchAll: store.fetchAll,
    createPayment,
    deletePayment: store.delete,
    getPaymentsByOrder,
    getTotalPaidByOrder,
    getPaymentMethodLabel,
    pendingPayments,
  };
}
