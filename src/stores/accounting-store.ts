import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, TransactionCategory, Transaction, Budget, AccountingStats } from '@/types';
import { generateUUID } from '@/lib/utils/uuid';

/**
 * 會計系統 Store (純 localStorage 版本)
 *
 * 說明：會計系統使用 localStorage 持久化，原因：
 * 1. 資料量小 (帳戶、交易記錄)
 * 2. 需要即時計算統計 (不適合 IndexedDB)
 * 3. 暫不同步到 Supabase（待未來擴充）
 */

interface AccountingStore {
  // 資料狀態
  accounts: Account[];
  categories: TransactionCategory[];
  transactions: Transaction[];
  budgets: Budget[];

  // 統計資料
  stats: AccountingStats;

  // 帳戶管理
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Account;
  updateAccount: (id: string, account: Partial<Account>) => Account | undefined;
  deleteAccount: (id: string) => boolean;
  loadAccounts: () => Account[];

  // 分類管理
  addCategory: (category: Omit<TransactionCategory, 'id' | 'created_at' | 'updated_at'>) => TransactionCategory;
  updateCategory: (id: string, category: Partial<TransactionCategory>) => TransactionCategory | undefined;
  deleteCategory: (id: string) => boolean;
  loadCategories: () => TransactionCategory[];

  // 交易記錄
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => string;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // 預算管理
  addBudget: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => Budget;
  updateBudget: (id: string, budget: Partial<Budget>) => Budget | undefined;
  deleteBudget: (id: string) => boolean;

  // 統計計算
  calculateStats: () => void;
  getAccountBalance: (account_id: string) => number;
  getCategoryTotal: (category_id: string, start_date?: string, end_date?: string) => number;

  // 輔助方法
  updateAccountBalances: (transaction: Transaction) => void;
  reverseAccountBalances: (transaction: Transaction) => void;
}

const generateId = () => generateUUID();

export const useAccountingStore = create<AccountingStore>()(
  persist(
    (set, get) => ({
      // 初始資料
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],

      stats: {
        total_assets: 0,
        total_income: 0,
        total_expense: 0,
        monthly_income: 0,
        monthly_expense: 0,
        net_worth: 0,
        category_breakdown: []
      },

      // ===== 帳戶管理 =====
      addAccount: (accountData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const account: Account = {
          ...accountData,
          id,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ accounts: [...state.accounts, account] }));
        get().calculateStats();
        return account;
      },

      updateAccount: (id, accountData) => {
        let updated: Account | undefined;
        set((state) => {
          const account = state.accounts.find(a => a.id === id);
          if (!account) return state;

          updated = { ...account, ...accountData, updated_at: new Date().toISOString() };
          return {
            accounts: state.accounts.map(a => a.id === id ? updated! : a)
          };
        });
        get().calculateStats();
        return updated;
      },

      deleteAccount: (id) => {
        // 先刪除相關交易
        set((state) => ({
          transactions: state.transactions.filter(transaction =>
            transaction.account_id !== id && transaction.to_account_id !== id
          ),
        }));

        set((state) => ({
          accounts: state.accounts.filter(a => a.id !== id)
        }));
        get().calculateStats();
        return true;
      },

      loadAccounts: () => {
        return get().accounts;
      },

      // ===== 分類管理 =====
      addCategory: (categoryData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const category: TransactionCategory = {
          ...categoryData,
          id,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ categories: [...state.categories, category] }));
        return category;
      },

      updateCategory: (id, categoryData) => {
        let updated: TransactionCategory | undefined;
        set((state) => {
          const category = state.categories.find(c => c.id === id);
          if (!category) return state;

          updated = { ...category, ...categoryData, updated_at: new Date().toISOString() };
          return {
            categories: state.categories.map(c => c.id === id ? updated! : c)
          };
        });
        return updated;
      },

      deleteCategory: (id) => {
        // 先刪除該分類的交易
        set((state) => ({
          transactions: state.transactions.filter(transaction => transaction.category_id !== id),
        }));

        set((state) => ({
          categories: state.categories.filter(c => c.id !== id)
        }));
        return true;
      },

      loadCategories: () => {
        return get().categories;
      },

      // ===== 交易記錄 =====
      addTransaction: (transactionData) => {
        const id = generateId();
        const now = new Date().toISOString();

        const transaction: Transaction = {
          ...transactionData,
          id,
          created_at: now,
          updated_at: now,
        };

        set((state) => ({ transactions: [...state.transactions, transaction] }));
        get().updateAccountBalances(transaction);
        get().calculateStats();
        return id;
      },

      updateTransaction: (id, transactionData) => {
        const now = new Date().toISOString();
        const oldTransaction = get().transactions.find(t => t.id === id);

        set((state) => ({
          transactions: state.transactions.map(transaction =>
            transaction.id === id ? { ...transaction, ...transactionData, updated_at: now } : transaction
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
      },

      deleteTransaction: (id) => {
        const transaction = get().transactions.find(t => t.id === id);
        if (transaction) {
          get().reverseAccountBalances(transaction);
        }

        set((state) => ({
          transactions: state.transactions.filter(transaction => transaction.id !== id),
        }));
        get().calculateStats();
      },

      // ===== 預算管理 =====
      addBudget: (budgetData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const budget: Budget = {
          ...budgetData,
          id,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ budgets: [...state.budgets, budget] }));
        return budget;
      },

      updateBudget: (id, budgetData) => {
        let updated: Budget | undefined;
        set((state) => {
          const budget = state.budgets.find(b => b.id === id);
          if (!budget) return state;

          updated = { ...budget, ...budgetData, updated_at: new Date().toISOString() };
          return {
            budgets: state.budgets.map(b => b.id === id ? updated! : b)
          };
        });
        return updated;
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter(b => b.id !== id)
        }));
        return true;
      },

      // ===== 輔助方法 =====
      updateAccountBalances: (transaction: Transaction) => {
        set((state) => ({
          accounts: state.accounts.map(account => {
            if (account.id === transaction.account_id) {
              const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
              const newBalance = account.balance + balanceChange;
              const availableCredit = account.type === 'credit' && account.credit_limit
                ? (account.credit_limit ?? 0) + newBalance
                : account.available_credit;
              return { ...account, balance: newBalance, available_credit: availableCredit };
            }
            if (transaction.to_account_id && account.id === transaction.to_account_id) {
              const newBalance = account.balance + transaction.amount;
              const availableCredit = account.type === 'credit' && account.credit_limit
                ? (account.credit_limit ?? 0) + newBalance
                : account.available_credit;
              return { ...account, balance: newBalance, available_credit: availableCredit };
            }
            return account;
          })
        }));
      },

      reverseAccountBalances: (transaction: Transaction) => {
        set((state) => ({
          accounts: state.accounts.map(account => {
            if (account.id === transaction.account_id) {
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              return { ...account, balance: account.balance + balanceChange };
            }
            if (transaction.to_account_id && account.id === transaction.to_account_id) {
              return { ...account, balance: account.balance - transaction.amount };
            }
            return account;
          })
        }));
      },

      // ===== 統計計算 =====
      calculateStats: () => {
        const { accounts, transactions, categories } = get();
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

        const categoryTotals = new Map<string, number>();

        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const current = categoryTotals.get(t.category_id) || 0;
            categoryTotals.set(t.category_id, current + t.amount);
          });

        const categoryBreakdown = Array.from(categoryTotals.entries())
          .map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            return {
              category_id: categoryId,
              category_name: category?.name || '未知分類',
              amount,
              percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
            };
          })
          .sort((a, b) => b.amount - a.amount);

        set({
          stats: {
            total_assets: totalAssets,
            total_income: totalIncome,
            total_expense: totalExpense,
            monthly_income: monthlyIncome,
            monthly_expense: monthlyExpense,
            net_worth: netWorth,
            category_breakdown: categoryBreakdown
          }
        });
      },

      // 工具方法
      getAccountBalance: (accountId: string) => {
        const account = get().accounts.find(a => a.id === accountId);
        return account?.balance || 0;
      },

      getCategoryTotal: (categoryId: string, start_date?: string, end_date?: string) => {
        const { transactions } = get();
        return transactions
          .filter(t => {
            if (t.category_id !== categoryId) return false;
            if (start_date && t.date < start_date) return false;
            if (end_date && t.date > end_date) return false;
            return true;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      }
    }),
    {
      name: 'venturo-accounting-store',
      version: 2, // 版本升級
    }
  )
);

// 初始化統計資料
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useAccountingStore.getState().calculateStats();
  }, 0);
}
