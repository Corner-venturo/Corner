/**
 * Accounting Store Selectors
 * 優化的 selector 函數，避免不必要的重新計算
 */

import { useAccountingStore } from '../accounting-store'
import { useMemo } from 'react'

/**
 * 使用 memoized stats selector
 * 只有當 stats 物件改變時才重新渲染
 */
export function useAccountingStats() {
  return useAccountingStore(state => state.stats)
}

/**
 * 使用 memoized account balance selector
 * 避免在每次渲染時重新查找帳戶
 */
export function useAccountBalance(accountId: string) {
  return useAccountingStore(state => {
    const account = state.accounts.find(a => a.id === accountId)
    return account?.balance || 0
  })
}

/**
 * 使用 memoized category total selector
 * 建立查找 Map 避免重複過濾
 */
export function useCategoryTotal(categoryId: string, startDate?: string, endDate?: string) {
  const transactions = useAccountingStore(state => state.transactions)

  return useMemo(() => {
    return transactions
      .filter(t => {
        if (t.category_id !== categoryId) return false
        if (startDate && t.date < startDate) return false
        if (endDate && t.date > endDate) return false
        return true
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions, categoryId, startDate, endDate])
}

/**
 * 取得所有帳戶的餘額 Map
 * 避免多次查找時的 O(n) 複雜度
 */
export function useAccountBalanceMap() {
  return useAccountingStore(state => {
    const map = new Map<string, number>()
    state.accounts.forEach(account => {
      map.set(account.id, account.balance)
    })
    return map
  })
}

/**
 * 取得分類總計的 Map (優化版本)
 * 一次計算所有分類，避免重複過濾
 */
export function useCategoryTotalsMap(startDate?: string, endDate?: string) {
  const transactions = useAccountingStore(state => state.transactions)
  const categories = useAccountingStore(state => state.categories)

  return useMemo(() => {
    const map = new Map<string, number>()

    // 初始化所有分類為 0
    categories.forEach(cat => map.set(cat.id, 0))

    // 過濾並累加交易
    transactions.forEach(t => {
      if (startDate && t.date < startDate) return
      if (endDate && t.date > endDate) return

      const current = map.get(t.category_id || '') || 0
      map.set(t.category_id || '', current + t.amount)
    })

    return map
  }, [transactions, categories, startDate, endDate])
}

/**
 * 取得帳戶列表 (按類型過濾)
 */
export function useAccountsByType(type: 'asset' | 'liability' | 'all' = 'all') {
  return useAccountingStore(state => {
    if (type === 'all') return state.accounts
    return state.accounts.filter(a => (a as any).type === type)
  })
}

/**
 * 取得月度交易
 */
export function useMonthlyTransactions(year: number, month: number) {
  return useAccountingStore(state => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    return state.transactions.filter(t => t.date >= startDate && t.date <= endDate)
  })
}
