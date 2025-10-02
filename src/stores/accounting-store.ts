import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Category, Transaction, Budget, AccountingStats } from './accounting-types';
import { createPersistentCrudMethods, generateId } from '@/lib/persistent-store';

interface AccountingStore {
  // 資料狀態
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];

  // 統計資料
  stats: AccountingStats;

  // 帳戶管理（統一方法）
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<Account | undefined>;
  deleteAccount: (id: string) => Promise<boolean>;
  loadAccounts: () => Promise<Account[] | null>;

  // 分類管理（統一方法）
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category | undefined>;
  deleteCategory: (id: string) => Promise<boolean>;
  loadCategories: () => Promise<Category[] | null>;

  // 交易記錄（保留自定義，因為有餘額計算）
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // 統計計算
  calculateStats: () => void;
  getAccountBalance: (accountId: string) => number;
  getCategoryTotal: (categoryId: string, startDate?: string, endDate?: string) => number;
}

export const useAccountingStore = create<AccountingStore>()(
  persist(
    (set, get) => ({
      // 初始資料
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],

      stats: {
        totalAssets: 0,
        totalIncome: 0,
        totalExpense: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        netWorth: 0,
        categoryBreakdown: []
      },

      // 帳戶管理（使用統一方法，加上計算邏輯）
      ...createPersistentCrudMethods<Account>('accounts', 'accounts', set, get),
      ...createPersistentCrudMethods<Category>('categories', 'categories', set, get),

      addAccount: (accountData) => {
        try {
          const methods = createPersistentCrudMethods<Account>('accounts', 'accounts', set, get);
          const account = methods.addAccount(accountData);
          get().calculateStats();
          return account;
        } catch (error) {
          console.error('❌ 新增帳戶失敗:', error);
          throw error;
        }
      },

      updateAccount: (id, accountData) => {
        try {
          const methods = createPersistentCrudMethods<Account>('accounts', 'accounts', set, get);
          const account = methods.updateAccount(id, accountData);
          get().calculateStats();
          return account;
        } catch (error) {
          console.error('❌ 更新帳戶失敗:', error);
          return undefined;
        }
      },

      deleteAccount: (id) => {
        try {
          // 先刪除相關交易
          set((state) => ({
            transactions: state.transactions.filter(transaction =>
              transaction.accountId !== id && transaction.toAccountId !== id
            ),
          }));

          const methods = createPersistentCrudMethods<Account>('accounts', 'accounts', set, get);
          const success = methods.deleteAccount(id);
          get().calculateStats();
          return success;
        } catch (error) {
          console.error('❌ 刪除帳戶失敗:', error);
          return false;
        }
      },

      loadAccounts: async () => {
        const methods = createPersistentCrudMethods<Account>('accounts', 'accounts', set, get);
        return methods.loadAccounts();
      },

      // 分類管理（使用統一方法）
      addCategory: (categoryData) => {
        try {
          const methods = createPersistentCrudMethods<Category>('categories', 'categories', set, get);
          return methods.addCategory(categoryData);
        } catch (error) {
          console.error('❌ 新增分類失敗:', error);
          throw error;
        }
      },

      updateCategory: (id, categoryData) => {
        try {
          const methods = createPersistentCrudMethods<Category>('categories', 'categories', set, get);
          return methods.updateCategory(id, categoryData);
        } catch (error) {
          console.error('❌ 更新分類失敗:', error);
          return undefined;
        }
      },

      deleteCategory: (id) => {
        try {
          // 先刪除該分類的交易
          set((state) => ({
            transactions: state.transactions.filter(transaction => transaction.categoryId !== id),
          }));

          const methods = createPersistentCrudMethods<Category>('categories', 'categories', set, get);
          return methods.deleteCategory(id);
        } catch (error) {
          console.error('❌ 刪除分類失敗:', error);
          return false;
        }
      },

      loadCategories: async () => {
        const methods = createPersistentCrudMethods<Category>('categories', 'categories', set, get);
        return methods.loadCategories();
      },

      // 交易記錄（保留自定義邏輯，因為需要更新帳戶餘額）
      addTransaction: (transactionData) => {
        try {
          const id = generateId();
          const now = new Date().toISOString();

          const transaction: Transaction = {
            ...transactionData,
            id,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({ transactions: [...state.transactions, transaction] }));
          get().updateAccountBalances(transaction);
          get().calculateStats();
          return id;
        } catch (error) {
          console.error('❌ 新增交易失敗:', error);
          return '';
        }
      },

      updateTransaction: (id, transactionData) => {
        try {
          const now = new Date().toISOString();
          const oldTransaction = get().transactions.find(t => t.id === id);

          set((state) => ({
            transactions: state.transactions.map(transaction =>
              transaction.id === id ? { ...transaction, ...transactionData, updatedAt: now } : transaction
            ),
          }));

          if (oldTransaction) {
            get().reverseAccountBalances(oldTransaction);
          }
          const newTransaction = get().transactions.find(t => t.id === id);
          if (newTransaction) {
            get().updateAccountBalances(newTransaction);
          }
          get().calculateStats();
        } catch (error) {
          console.error('❌ 更新交易失敗:', error);
        }
      },

      deleteTransaction: (id) => {
        try {
          const transaction = get().transactions.find(t => t.id === id);
          if (transaction) {
            get().reverseAccountBalances(transaction);
          }

          set((state) => ({
            transactions: state.transactions.filter(transaction => transaction.id !== id),
          }));
          get().calculateStats();
        } catch (error) {
          console.error('❌ 刪除交易失敗:', error);
        }
      },

      // 輔助方法：更新帳戶餘額
      updateAccountBalances: (transaction: Transaction) => {
        set((state) => ({
          accounts: state.accounts.map(account => {
            if (account.id === transaction.accountId) {
              const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
              const newBalance = account.balance + balanceChange;
              const availableCredit = account.type === 'credit' && account.creditLimit
                ? account.creditLimit + newBalance
                : account.availableCredit;
              return { ...account, balance: newBalance, availableCredit };
            }
            if (transaction.toAccountId && account.id === transaction.toAccountId) {
              const newBalance = account.balance + transaction.amount;
              const availableCredit = account.type === 'credit' && account.creditLimit
                ? account.creditLimit + newBalance
                : account.availableCredit;
              return { ...account, balance: newBalance, availableCredit };
            }
            return account;
          })
        }));
      },

      // 輔助方法：反向更新帳戶餘額（用於刪除或修改交易）
      reverseAccountBalances: (transaction: Transaction) => {
        set((state) => ({
          accounts: state.accounts.map(account => {
            if (account.id === transaction.accountId) {
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              return { ...account, balance: account.balance + balanceChange };
            }
            if (transaction.toAccountId && account.id === transaction.toAccountId) {
              return { ...account, balance: account.balance - transaction.amount };
            }
            return account;
          })
        }));
      },

      // 統計計算
      calculateStats: () => {
        const { accounts, transactions } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const totalAssets = accounts
          .filter(account => account.balance > 0)
          .reduce((sum, account) => sum + account.balance, 0);

        const totalDebt = accounts
          .filter(account => account.balance < 0)
          .reduce((sum, account) => sum + Math.abs(account.balance), 0);

        const netWorth = totalAssets - totalDebt;

        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlyIncome = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'income' &&
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpense = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' &&
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const { categories } = get();
        const categoryTotals = new Map<string, number>();

        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const current = categoryTotals.get(t.categoryId) || 0;
            categoryTotals.set(t.categoryId, current + t.amount);
          });

        const categoryBreakdown = Array.from(categoryTotals.entries())
          .map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            return {
              categoryId,
              categoryName: category?.name || '未知分類',
              amount,
              percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
            };
          })
          .sort((a, b) => b.amount - a.amount);

        set({
          stats: {
            totalAssets,
            totalIncome,
            totalExpense,
            monthlyIncome,
            monthlyExpense,
            netWorth,
            categoryBreakdown
          }
        });
      },

      // 工具方法
      getAccountBalance: (accountId: string) => {
        const account = get().accounts.find(a => a.id === accountId);
        return account?.balance || 0;
      },

      getCategoryTotal: (categoryId: string, startDate?: string, endDate?: string) => {
        const { transactions } = get();
        return transactions
          .filter(t => {
            if (t.categoryId !== categoryId) return false;
            if (startDate && t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      }
    }),
    {
      name: 'venturo-accounting-store',
      version: 1,
    }
  )
);

// 初始化統計資料
setTimeout(() => {
  useAccountingStore.getState().calculateStats();
}, 0);