/**
 * useCustomers - 客戶業務邏輯 Hook
 */

import { useMemo } from 'react';

import { useCustomerStore } from '@/stores';
import { Customer, CreateCustomerData, UpdateCustomerData, VipLevel } from '@/types';

export function useCustomers() {
  const store = useCustomerStore();

  const validateCustomerData = (data: Partial<Customer>): void => {
    if (data.phone && !/^[0-9-+()]{8,15}$/.test(data.phone)) {
      throw new Error('電話格式錯誤');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Email 格式錯誤');
    }
  };

  const getVipDiscount = (level?: VipLevel): number => {
    const discounts: Record<VipLevel, number> = {
      bronze: 0.05,
      silver: 0.1,
      gold: 0.15,
      platinum: 0.2,
      diamond: 0.25,
    };
    return level ? discounts[level] : 0;
  };

  const createCustomer = async (data: Omit<CreateCustomerData, 'id' | 'code'>): Promise<Customer> => {
    validateCustomerData(data);
    return await store.create(data as Customer);
  };

  const updateCustomer = async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    validateCustomerData(data);
    return await store.update(id, data);
  };

  const vipCustomers = useMemo(() => {
    return store.items.filter(c => c.is_vip && c.is_active);
  }, [store.items]);

  const searchCustomers = (keyword: string): Customer[] => {
    const k = keyword.toLowerCase();
    return store.items.filter(c =>
      c.name.toLowerCase().includes(k) ||
      c.phone.includes(k) ||
      c.email?.toLowerCase().includes(k)
    );
  };

  return {
    customers: store.items,
    loading: store.loading,
    error: store.error,
    fetchAll: store.fetchAll,
    createCustomer,
    updateCustomer,
    deleteCustomer: store.delete,
    vipCustomers,
    searchCustomers,
    getVipDiscount,
  };
}
