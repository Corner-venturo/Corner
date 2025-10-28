import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAccountingStore } from '@/stores/accounting-store';
import {
  useAccountBalance,
  useCategoryTotalsMap,
  useMonthlyTransactions,
} from '../accounting-selectors';

// Mock the accounting store
vi.mock('@/stores/accounting-store', () => ({
  useAccountingStore: vi.fn(),
}));

describe('accounting-selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAccountBalance', () => {
    it('should return account balance for valid account', () => {
      const mockAccounts = [
        { id: 'acc-1', name: 'Cash', balance: 10000 },
        { id: 'acc-2', name: 'Bank', balance: 50000 },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) =>
        selector({ accounts: mockAccounts })
      );

      const { result } = renderHook(() => useAccountBalance('acc-1'));

      expect(result.current).toBe(10000);
    });

    it('should return 0 for non-existent account', () => {
      const mockAccounts = [
        { id: 'acc-1', name: 'Cash', balance: 10000 },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) =>
        selector({ accounts: mockAccounts })
      );

      const { result } = renderHook(() => useAccountBalance('non-existent'));

      expect(result.current).toBe(0);
    });

    it('should return 0 for empty accounts', () => {
      (useAccountingStore as any).mockImplementation((selector: any) =>
        selector({ accounts: [] })
      );

      const { result } = renderHook(() => useAccountBalance('acc-1'));

      expect(result.current).toBe(0);
    });
  });

  describe('useCategoryTotalsMap', () => {
    it('should calculate category totals correctly', () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Transport', type: 'expense' },
        { id: 'cat-2', name: 'Hotel', type: 'expense' },
      ];

      const mockTransactions = [
        { id: 't-1', category_id: 'cat-1', amount: 1000, date: '2025-10-20' },
        { id: 't-2', category_id: 'cat-1', amount: 2000, date: '2025-10-21' },
        { id: 't-3', category_id: 'cat-2', amount: 5000, date: '2025-10-22' },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) => {
        const state = {
          categories: mockCategories,
          transactions: mockTransactions,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useCategoryTotalsMap());

      expect(result.current.get('cat-1')).toBe(3000);
      expect(result.current.get('cat-2')).toBe(5000);
    });

    it('should filter transactions by date range', () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Transport', type: 'expense' },
      ];

      const mockTransactions = [
        { id: 't-1', category_id: 'cat-1', amount: 1000, date: '2025-10-20' },
        { id: 't-2', category_id: 'cat-1', amount: 2000, date: '2025-10-25' },
        { id: 't-3', category_id: 'cat-1', amount: 3000, date: '2025-10-30' },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) => {
        const state = {
          categories: mockCategories,
          transactions: mockTransactions,
        };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useCategoryTotalsMap('2025-10-22', '2025-10-28')
      );

      // Only t-2 (2025-10-25) should be included
      expect(result.current.get('cat-1')).toBe(2000);
    });

    it('should initialize categories with 0 when no transactions', () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Transport', type: 'expense' },
        { id: 'cat-2', name: 'Hotel', type: 'expense' },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) => {
        const state = {
          categories: mockCategories,
          transactions: [],
        };
        return selector(state);
      });

      const { result } = renderHook(() => useCategoryTotalsMap());

      expect(result.current.get('cat-1')).toBe(0);
      expect(result.current.get('cat-2')).toBe(0);
    });
  });

  describe('useMonthlyTransactions', () => {
    it('should filter transactions by year and month', () => {
      const mockTransactions = [
        { id: 't-1', date: '2025-10-15', amount: 1000 },
        { id: 't-2', date: '2025-11-20', amount: 2000 },
        { id: 't-3', date: '2025-10-25', amount: 3000 },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) =>
        selector({ transactions: mockTransactions })
      );

      const { result } = renderHook(() => useMonthlyTransactions(2025, 10));

      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('t-1');
      expect(result.current[1].id).toBe('t-3');
    });

    it('should return empty array for month with no transactions', () => {
      const mockTransactions = [
        { id: 't-1', date: '2025-10-15', amount: 1000 },
      ];

      (useAccountingStore as any).mockImplementation((selector: any) =>
        selector({ transactions: mockTransactions })
      );

      const { result } = renderHook(() => useMonthlyTransactions(2025, 12));

      expect(result.current).toHaveLength(0);
    });
  });
});
