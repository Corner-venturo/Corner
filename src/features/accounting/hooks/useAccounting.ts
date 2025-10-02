import { useAccountingStore } from '@/stores/accounting-store';
import { accountingService, categoryService } from '../services/accounting.service';
import { Account, Category, Transaction } from '@/stores/accounting-types';

export const useAccounting = () => {
  const store = useAccountingStore();

  return {
    // ========== 資料 ==========
    accounts: store.accounts,
    categories: store.categories,
    transactions: store.transactions,
    budgets: store.budgets,
    stats: store.stats,

    // ========== Account 操作 ==========
    createAccount: async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addAccount(data);
    },

    updateAccount: async (id: string, data: Partial<Account>) => {
      return await store.updateAccount(id, data);
    },

    deleteAccount: async (id: string) => {
      return await store.deleteAccount(id);
    },

    loadAccounts: async () => {
      return await store.loadAccounts();
    },

    getAccountsByType: (type: Account['type']) => {
      return accountingService.getAccountsByType(type);
    },

    getAccountBalance: (accountId: string) => {
      return accountingService.getAccountBalance(accountId);
    },

    // ========== Category 操作 ==========
    createCategory: async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await store.addCategory(data);
    },

    updateCategory: async (id: string, data: Partial<Category>) => {
      return await store.updateCategory(id, data);
    },

    deleteCategory: async (id: string) => {
      return await store.deleteCategory(id);
    },

    loadCategories: async () => {
      return await store.loadCategories();
    },

    getCategoriesByType: (type: Category['type']) => {
      return categoryService.getCategoriesByType(type);
    },

    getCategoryTotal: (categoryId: string, startDate?: string, endDate?: string) => {
      return accountingService.getCategoryTotal(categoryId, startDate, endDate);
    },

    // ========== Transaction 操作 ==========
    createTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      return accountingService.addTransaction(data);
    },

    updateTransaction: (id: string, data: Partial<Transaction>) => {
      accountingService.updateTransaction(id, data);
    },

    deleteTransaction: (id: string) => {
      accountingService.deleteTransaction(id);
    },

    getTransactionsByAccount: (accountId: string) => {
      return accountingService.getTransactionsByAccount(accountId);
    },

    getTransactionsByDateRange: (startDate: string, endDate: string) => {
      return accountingService.getTransactionsByDateRange(startDate, endDate);
    },

    // ========== 統計方法 ==========
    calculateStats: () => {
      accountingService.calculateStats();
    },

    getTotalAssets: () => {
      return accountingService.getTotalAssets();
    },

    getMonthlyIncome: () => {
      return accountingService.getMonthlyIncome();
    },

    getMonthlyExpense: () => {
      return accountingService.getMonthlyExpense();
    },

    getNetWorth: () => {
      return accountingService.getNetWorth();
    },
  };
};
