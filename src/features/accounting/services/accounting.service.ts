import { BaseService, StoreOperations } from '@/core/services/base.service';
import { Account, Transaction } from '@/types/accounting.types';
import { Category } from '@/stores/accounting-types';
import { useAccountingStore } from '@/stores/accounting-store';
import { ValidationError } from '@/core/errors/app-errors';

class AccountingService extends BaseService<Account> {
  protected resourceName = 'accounts';

  protected getStore = (): StoreOperations<Account> => {
    const store = useAccountingStore.getState();
    return {
      getAll: () => store.accounts as any,
      getById: (id: string) => store.accounts.find(a => a.id === id) as any,
      add: async (account: Account) => {
        await store.addAccount(account as any);
        return account;
      },
      update: async (id: string, data: Partial<Account>) => {
        await store.updateAccount(id, data);
      },
      delete: async (id: string) => {
        await store.deleteAccount(id);
      }
    };
  }

  protected validate(data: Partial<Account>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '帳戶名稱不能為空');
    }

    if (data.balance !== undefined && isNaN(data.balance)) {
      throw new ValidationError('balance', '餘額格式錯誤');
    }
  }

  // ========== 業務邏輯方法 ==========

  getAccountBalance(account_id: string): number {
    const store = useAccountingStore.getState();
    return store.getAccountBalance(account_id);
  }

  getCategoryTotal(category_id: string, start_date?: string, end_date?: string): number {
    const store = useAccountingStore.getState();
    return store.getCategoryTotal(category_id, start_date, end_date);
  }

  calculateStats(): void {
    const store = useAccountingStore.getState();
    store.calculateStats();
  }

  getAccountsByType(type: Account['type']): Account[] {
    const store = useAccountingStore.getState();
    return store.accounts.filter(a => a.type === type);
  }

  getTotalAssets(): number {
    const store = useAccountingStore.getState();
    return store.stats.total_assets;
  }

  getMonthlyIncome(): number {
    const store = useAccountingStore.getState();
    return store.stats.monthly_income;
  }

  getMonthlyExpense(): number {
    const store = useAccountingStore.getState();
    return store.stats.monthly_expense;
  }

  getNetWorth(): number {
    const store = useAccountingStore.getState();
    return store.stats.net_worth;
  }

  // Transaction 相關
  addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): string {
    const store = useAccountingStore.getState();
    return store.addTransaction(transaction);
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): void {
    const store = useAccountingStore.getState();
    store.updateTransaction(id, transaction);
  }

  deleteTransaction(id: string): void {
    const store = useAccountingStore.getState();
    store.deleteTransaction(id);
  }

  getTransactionsByAccount(account_id: string): Transaction[] {
    const store = useAccountingStore.getState();
    return store.transactions.filter(t =>
      t.account_id === account_id || t.to_account_id === account_id
    );
  }

  getTransactionsByDateRange(start_date: string, end_date: string): Transaction[] {
    const store = useAccountingStore.getState();
    return store.transactions.filter(t =>
      t.date >= start_date && t.date <= end_date
    );
  }
}

class CategoryService extends BaseService<Category> {
  protected resourceName = 'categories';

  protected getStore = (): StoreOperations<Category> => {
    const store = useAccountingStore.getState();
    return {
      getAll: () => store.categories,
      getById: (id: string) => store.categories.find(c => c.id === id),
      add: async (category: Category) => {
        await store.addCategory(category as any);
        return category;
      },
      update: async (id: string, data: Partial<Category>) => {
        await store.updateCategory(id, data);
      },
      delete: async (id: string) => {
        await store.deleteCategory(id);
      }
    };
  }

  protected validate(data: Partial<Category>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '分類名稱不能為空');
    }
  }

  getCategoriesByType(type: Category['type']): Category[] {
    const store = useAccountingStore.getState();
    return store.categories.filter(c => c.type === type);
  }
}

export const accountingService = new AccountingService();
export const categoryService = new CategoryService();
