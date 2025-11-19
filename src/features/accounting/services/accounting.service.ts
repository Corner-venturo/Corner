import { BaseService, StoreOperations } from '@/core/services/base.service'
import { useAccountingStore } from '@/stores/accounting-store'
import type { Account, Transaction, TransactionCategory } from '@/stores/accounting-store'
import { ValidationError } from '@/core/errors/app-errors'

class AccountingService extends BaseService<Account> {
  protected resourceName = 'accounts'

  protected getStore = (): StoreOperations<Account> => {
    const store = useAccountingStore.getState()
    return {
      getAll: () => store.accounts,
      getById: (id: string) => store.accounts.find(a => a.id === id),
      add: async (account: Account) => {
        await store.addAccount(account)
        return account
      },
      update: async (id: string, data: Partial<Account>) => {
        await store.updateAccount(id, data)
      },
      delete: async (id: string) => {
        await store.deleteAccount(id)
      },
    }
  }

  protected validate(data: Partial<Account>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '帳戶名稱不能為空')
    }

    if (data.balance !== undefined && isNaN(data.balance)) {
      throw new ValidationError('balance', '餘額格式錯誤')
    }
  }

  // ========== 業務邏輯方法 ==========

  getAccountBalance(account_id: string): number {
    const store = useAccountingStore.getState()
    const account = store.accounts.find(a => a.id === account_id)
    return account?.balance ?? 0
  }

  getCategoryTotal(category_id: string, start_date?: string, end_date?: string): number {
    const store = useAccountingStore.getState()
    let transactions = store.transactions.filter(t => t.category_id === category_id)

    if (start_date) {
      transactions = transactions.filter(t => t.date >= start_date)
    }
    if (end_date) {
      transactions = transactions.filter(t => t.date <= end_date)
    }

    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  calculateStats(): void {
    const store = useAccountingStore.getState()
    store.calculateStats()
  }

  getAccountsByType(type: Account['type']): Account[] {
    const store = useAccountingStore.getState()
    return store.accounts.filter(a => a.type === type)
  }

  getTotalAssets(): number {
    const store = useAccountingStore.getState()
    return store.stats.total_assets
  }

  getMonthlyIncome(): number {
    const store = useAccountingStore.getState()
    return store.stats.monthly_income
  }

  getMonthlyExpense(): number {
    const store = useAccountingStore.getState()
    return store.stats.monthly_expense
  }

  getNetWorth(): number {
    const store = useAccountingStore.getState()
    return store.stats.net_worth
  }

  // Transaction 相關
  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const store = useAccountingStore.getState()
    const result = await store.addTransaction(transaction)
    return result ?? ''
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): void {
    const store = useAccountingStore.getState()
    store.updateTransaction(id, transaction)
  }

  deleteTransaction(id: string): void {
    const store = useAccountingStore.getState()
    store.deleteTransaction(id)
  }

  getTransactionsByAccount(account_id: string): Transaction[] {
    const store = useAccountingStore.getState()
    return store.transactions.filter(
      t => t.account_id === account_id || t.to_account_id === account_id
    )
  }

  getTransactionsByDateRange(start_date: string, end_date: string): Transaction[] {
    const store = useAccountingStore.getState()
    return store.transactions.filter(t => t.date >= start_date && t.date <= end_date)
  }
}

class CategoryService extends BaseService<TransactionCategory & { updated_at: string }> {
  protected resourceName = 'categories'

  protected getStore = (): StoreOperations<TransactionCategory & { updated_at: string }> => {
    const store = useAccountingStore.getState()
    return {
      getAll: () => store.categories as (TransactionCategory & { updated_at: string })[],
      getById: (id: string) => store.categories.find(c => c.id === id) as (TransactionCategory & { updated_at: string }) | undefined,
      add: async (category: TransactionCategory & { updated_at: string }) => {
        await store.addCategory(category)
        return category
      },
      update: async (id: string, data: Partial<TransactionCategory>) => {
        await store.updateCategory(id, data)
      },
      delete: async (id: string) => {
        await store.deleteCategory(id)
      },
    }
  }

  protected validate(data: Partial<TransactionCategory>): void {
    if (data.name && data.name.trim().length === 0) {
      throw new ValidationError('name', '分類名稱不能為空')
    }
  }

  getCategoriesByType(type: TransactionCategory['type']): TransactionCategory[] {
    const store = useAccountingStore.getState()
    return store.categories.filter(c => c.type === type)
  }
}

export const accountingService = new AccountingService()
export const categoryService = new CategoryService()
