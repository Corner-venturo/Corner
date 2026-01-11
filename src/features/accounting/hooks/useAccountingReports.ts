/**
 * 會計報表 Hook
 * 提供總帳、試算表、損益表、資產負債表、現金流量表等報表資料
 */

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import type { AccountType } from '@/types/accounting.types'

// ============================================
// 類型定義
// ============================================

/** 總帳明細項目 */
export interface GeneralLedgerEntry {
  id: string
  date: string
  voucher_no: string
  voucher_id: string
  description: string | null
  debit_amount: number
  credit_amount: number
  balance: number // 累計餘額
  account_id: string
  account_code: string
  account_name: string
}

/** 試算表項目 */
export interface TrialBalanceEntry {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  debit_total: number
  credit_total: number
  debit_balance: number
  credit_balance: number
}

/** 損益表項目 */
export interface IncomeStatementEntry {
  account_id: string
  account_code: string
  account_name: string
  account_type: 'revenue' | 'expense' | 'cost'
  amount: number
  percentage: number
}

/** 損益表結果 */
export interface IncomeStatementResult {
  revenue: IncomeStatementEntry[]
  cost: IncomeStatementEntry[]
  expense: IncomeStatementEntry[]
  total_revenue: number
  total_cost: number
  total_expense: number
  gross_profit: number // 營業毛利 = 收入 - 成本
  operating_income: number // 營業淨利 = 毛利 - 費用
}

/** 資產負債表項目 */
export interface BalanceSheetEntry {
  account_id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability'
  amount: number
}

/** 資產負債表結果 */
export interface BalanceSheetResult {
  assets: BalanceSheetEntry[]
  liabilities: BalanceSheetEntry[]
  total_assets: number
  total_liabilities: number
  equity: number // 權益 = 資產 - 負債
}

/** 現金流量表項目 */
export interface CashFlowEntry {
  description: string
  amount: number
  category: 'operating' | 'investing' | 'financing'
}

/** 現金流量表結果 */
export interface CashFlowResult {
  operating_activities: CashFlowEntry[]
  investing_activities: CashFlowEntry[]
  financing_activities: CashFlowEntry[]
  net_operating: number
  net_investing: number
  net_financing: number
  net_change: number
  opening_cash: number
  closing_cash: number
}

// ============================================
// Hook 實作
// ============================================

export function useAccountingReports() {
  const user = useAuthStore(state => state.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 取得總帳報表
   * @param accountId 會計科目 ID（可選，不指定則取得所有科目）
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  const fetchGeneralLedger = useCallback(async (
    startDate: string,
    endDate: string,
    accountId?: string
  ): Promise<GeneralLedgerEntry[]> => {
    if (!user?.workspace_id) return []

    setLoading(true)
    setError(null)

    try {
      // 查詢傳票分錄
      let query = supabase
        .from('journal_lines')
        .select(`
          id,
          description,
          debit_amount,
          credit_amount,
          account_id,
          voucher:journal_vouchers!inner(
            id,
            voucher_no,
            voucher_date,
            status,
            workspace_id
          ),
          account:chart_of_accounts(
            id,
            code,
            name
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .gte('voucher.voucher_date', startDate)
        .lte('voucher.voucher_date', endDate)
        .order('voucher.voucher_date', { ascending: true })

      if (accountId) {
        query = query.eq('account_id', accountId)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        logger.error('查詢總帳失敗:', queryError)
        throw queryError
      }

      // 計算累計餘額
      let runningBalance = 0
      const entries: GeneralLedgerEntry[] = (data || []).map((item) => {
        const debit = Number(item.debit_amount) || 0
        const credit = Number(item.credit_amount) || 0
        runningBalance += debit - credit

        // 安全地取得 voucher 和 account 資料
        const voucher = item.voucher as { id: string; voucher_no: string; voucher_date: string } | null
        const account = item.account as { id: string; code: string; name: string } | null

        return {
          id: item.id,
          date: voucher?.voucher_date || '',
          voucher_no: voucher?.voucher_no || '',
          voucher_id: voucher?.id || '',
          description: item.description,
          debit_amount: debit,
          credit_amount: credit,
          balance: runningBalance,
          account_id: item.account_id,
          account_code: account?.code || '',
          account_name: account?.name || '',
        }
      })

      return entries
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢總帳失敗'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  /**
   * 取得試算表
   * @param endDate 截止日期
   */
  const fetchTrialBalance = useCallback(async (
    endDate: string
  ): Promise<TrialBalanceEntry[]> => {
    if (!user?.workspace_id) return []

    setLoading(true)
    setError(null)

    try {
      // 先取得所有會計科目
      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name, account_type')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (accountsError) throw accountsError

      // 取得各科目的借貸合計
      const { data: lines, error: linesError } = await supabase
        .from('journal_lines')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          voucher:journal_vouchers!inner(
            status,
            voucher_date,
            workspace_id
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .lte('voucher.voucher_date', endDate)

      if (linesError) throw linesError

      // 計算各科目餘額
      const balanceMap = new Map<string, { debit: number; credit: number }>()

      for (const line of (lines || [])) {
        const accountId = line.account_id
        const current = balanceMap.get(accountId) || { debit: 0, credit: 0 }
        current.debit += Number(line.debit_amount) || 0
        current.credit += Number(line.credit_amount) || 0
        balanceMap.set(accountId, current)
      }

      // 組合結果
      const entries: TrialBalanceEntry[] = (accounts || []).map(account => {
        const balance = balanceMap.get(account.id) || { debit: 0, credit: 0 }
        const netBalance = balance.debit - balance.credit

        return {
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_type as AccountType,
          debit_total: balance.debit,
          credit_total: balance.credit,
          // 資產/費用/成本科目：借餘；負債/收入科目：貸餘
          debit_balance: netBalance > 0 ? netBalance : 0,
          credit_balance: netBalance < 0 ? Math.abs(netBalance) : 0,
        }
      }).filter(e => e.debit_total > 0 || e.credit_total > 0)

      return entries
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢試算表失敗'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  /**
   * 取得損益表
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  const fetchIncomeStatement = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<IncomeStatementResult> => {
    const emptyResult: IncomeStatementResult = {
      revenue: [],
      cost: [],
      expense: [],
      total_revenue: 0,
      total_cost: 0,
      total_expense: 0,
      gross_profit: 0,
      operating_income: 0,
    }

    if (!user?.workspace_id) return emptyResult

    setLoading(true)
    setError(null)

    try {
      // 取得收入、成本、費用科目
      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name, account_type')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .in('account_type', ['revenue', 'cost', 'expense'])
        .order('code', { ascending: true })

      if (accountsError) throw accountsError

      // 取得期間內的借貸合計
      const { data: lines, error: linesError } = await supabase
        .from('journal_lines')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          voucher:journal_vouchers!inner(
            status,
            voucher_date,
            workspace_id
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .gte('voucher.voucher_date', startDate)
        .lte('voucher.voucher_date', endDate)

      if (linesError) throw linesError

      // 計算各科目金額
      const amountMap = new Map<string, number>()

      for (const line of (lines || [])) {
        const accountId = line.account_id
        const account = (accounts || []).find(a => a.id === accountId)
        if (!account) continue

        const current = amountMap.get(accountId) || 0
        // 收入科目：貸方 - 借方
        // 成本/費用科目：借方 - 貸方
        if (account.account_type === 'revenue') {
          amountMap.set(accountId, current + (Number(line.credit_amount) || 0) - (Number(line.debit_amount) || 0))
        } else {
          amountMap.set(accountId, current + (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0))
        }
      }

      // 分類整理
      const revenue: IncomeStatementEntry[] = []
      const cost: IncomeStatementEntry[] = []
      const expense: IncomeStatementEntry[] = []
      let totalRevenue = 0
      let totalCost = 0
      let totalExpense = 0

      for (const account of (accounts || [])) {
        const amount = amountMap.get(account.id) || 0
        if (amount === 0) continue

        const entry: IncomeStatementEntry = {
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_type as 'revenue' | 'expense' | 'cost',
          amount,
          percentage: 0, // 稍後計算
        }

        switch (account.account_type) {
          case 'revenue':
            revenue.push(entry)
            totalRevenue += amount
            break
          case 'cost':
            cost.push(entry)
            totalCost += amount
            break
          case 'expense':
            expense.push(entry)
            totalExpense += amount
            break
        }
      }

      // 計算百分比
      revenue.forEach(e => { e.percentage = totalRevenue > 0 ? (e.amount / totalRevenue) * 100 : 0 })
      cost.forEach(e => { e.percentage = totalRevenue > 0 ? (e.amount / totalRevenue) * 100 : 0 })
      expense.forEach(e => { e.percentage = totalRevenue > 0 ? (e.amount / totalRevenue) * 100 : 0 })

      const grossProfit = totalRevenue - totalCost
      const operatingIncome = grossProfit - totalExpense

      return {
        revenue,
        cost,
        expense,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_expense: totalExpense,
        gross_profit: grossProfit,
        operating_income: operatingIncome,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢損益表失敗'
      setError(message)
      return emptyResult
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  /**
   * 取得資產負債表
   * @param asOfDate 報表日期
   */
  const fetchBalanceSheet = useCallback(async (
    asOfDate: string
  ): Promise<BalanceSheetResult> => {
    const emptyResult: BalanceSheetResult = {
      assets: [],
      liabilities: [],
      total_assets: 0,
      total_liabilities: 0,
      equity: 0,
    }

    if (!user?.workspace_id) return emptyResult

    setLoading(true)
    setError(null)

    try {
      // 取得資產、負債科目
      const { data: accounts, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name, account_type')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .in('account_type', ['asset', 'liability'])
        .order('code', { ascending: true })

      if (accountsError) throw accountsError

      // 取得截止日期前的借貸合計
      const { data: lines, error: linesError } = await supabase
        .from('journal_lines')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          voucher:journal_vouchers!inner(
            status,
            voucher_date,
            workspace_id
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .lte('voucher.voucher_date', asOfDate)

      if (linesError) throw linesError

      // 計算各科目餘額
      const balanceMap = new Map<string, number>()

      for (const line of (lines || [])) {
        const accountId = line.account_id
        const account = (accounts || []).find(a => a.id === accountId)
        if (!account) continue

        const current = balanceMap.get(accountId) || 0
        // 資產科目：借方 - 貸方
        // 負債科目：貸方 - 借方
        if (account.account_type === 'asset') {
          balanceMap.set(accountId, current + (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0))
        } else {
          balanceMap.set(accountId, current + (Number(line.credit_amount) || 0) - (Number(line.debit_amount) || 0))
        }
      }

      // 分類整理
      const assets: BalanceSheetEntry[] = []
      const liabilities: BalanceSheetEntry[] = []
      let totalAssets = 0
      let totalLiabilities = 0

      for (const account of (accounts || [])) {
        const amount = balanceMap.get(account.id) || 0
        if (amount === 0) continue

        const entry: BalanceSheetEntry = {
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_type as 'asset' | 'liability',
          amount,
        }

        if (account.account_type === 'asset') {
          assets.push(entry)
          totalAssets += amount
        } else {
          liabilities.push(entry)
          totalLiabilities += amount
        }
      }

      return {
        assets,
        liabilities,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        equity: totalAssets - totalLiabilities,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢資產負債表失敗'
      setError(message)
      return emptyResult
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  /**
   * 取得現金流量表
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  const fetchCashFlowStatement = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<CashFlowResult> => {
    const emptyResult: CashFlowResult = {
      operating_activities: [],
      investing_activities: [],
      financing_activities: [],
      net_operating: 0,
      net_investing: 0,
      net_financing: 0,
      net_change: 0,
      opening_cash: 0,
      closing_cash: 0,
    }

    if (!user?.workspace_id) return emptyResult

    setLoading(true)
    setError(null)

    try {
      // 取得銀行帳戶科目（現金科目）
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('account_id')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)

      if (bankError) throw bankError

      const cashAccountIds = (bankAccounts || [])
        .map(b => b.account_id)
        .filter((id): id is string => id !== null)

      if (cashAccountIds.length === 0) {
        return emptyResult
      }

      // 計算期初現金餘額（startDate 之前的餘額）
      const { data: openingLines, error: openingError } = await supabase
        .from('journal_lines')
        .select(`
          debit_amount,
          credit_amount,
          voucher:journal_vouchers!inner(
            status,
            voucher_date,
            workspace_id
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .lt('voucher.voucher_date', startDate)
        .in('account_id', cashAccountIds)

      if (openingError) throw openingError

      const openingCash = (openingLines || []).reduce((sum, line) => {
        return sum + (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0)
      }, 0)

      // 計算期間內現金變動
      const { data: periodLines, error: periodError } = await supabase
        .from('journal_lines')
        .select(`
          debit_amount,
          credit_amount,
          description,
          voucher:journal_vouchers!inner(
            status,
            voucher_date,
            workspace_id,
            description
          )
        `)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .gte('voucher.voucher_date', startDate)
        .lte('voucher.voucher_date', endDate)
        .in('account_id', cashAccountIds)

      if (periodError) throw periodError

      // 簡化版：將所有現金變動歸類為營業活動
      // 完整版應根據對應科目分類
      const operatingActivities: CashFlowEntry[] = []
      let netOperating = 0

      for (const line of (periodLines || [])) {
        const amount = (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0)
        netOperating += amount

        const voucher = line.voucher as { description: string | null } | null
        const desc = line.description || voucher?.description || '現金交易'

        operatingActivities.push({
          description: desc,
          amount,
          category: 'operating',
        })
      }

      const closingCash = openingCash + netOperating

      return {
        operating_activities: operatingActivities,
        investing_activities: [],
        financing_activities: [],
        net_operating: netOperating,
        net_investing: 0,
        net_financing: 0,
        net_change: netOperating,
        opening_cash: openingCash,
        closing_cash: closingCash,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢現金流量表失敗'
      setError(message)
      return emptyResult
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  return {
    loading,
    error,
    fetchGeneralLedger,
    fetchTrialBalance,
    fetchIncomeStatement,
    fetchBalanceSheet,
    fetchCashFlowStatement,
  }
}
