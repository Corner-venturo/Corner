/**
 * 期末結轉 Hook
 * 提供期末結轉相關操作
 */

'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'

// ============================================
// 類型定義
// ============================================

/** 結轉期間類型 */
export type PeriodType = 'month' | 'quarter' | 'year'

/** 期間資訊 */
export interface PeriodInfo {
  type: PeriodType
  year: number
  month?: number    // 月結時使用
  quarter?: number  // 季結時使用
  startDate: string
  endDate: string
  label: string
}

/** 結轉預覽項目 */
export interface ClosingPreviewItem {
  account_id: string
  account_code: string
  account_name: string
  account_type: 'revenue' | 'expense' | 'cost'
  amount: number
  closing_entry: 'debit' | 'credit' // 結轉分錄的方向
}

/** 結轉預覽結果 */
export interface ClosingPreview {
  period: PeriodInfo
  revenue_items: ClosingPreviewItem[]
  cost_items: ClosingPreviewItem[]
  expense_items: ClosingPreviewItem[]
  total_revenue: number
  total_cost: number
  total_expense: number
  gross_profit: number    // 營業毛利 = 收入 - 成本
  net_income: number      // 營業淨利 = 毛利 - 費用
  is_profit: boolean      // 是否盈利
  already_closed: boolean // 是否已結轉
}

/** 結轉歷史記錄 */
export interface ClosingHistory {
  id: string
  period_type: PeriodType
  period_start: string
  period_end: string
  net_income: number
  closing_voucher_id: string | null
  closed_by: string | null
  closed_at: string | null
  created_at: string
}

// ============================================
// Hook 實作
// ============================================

export function usePeriodClosing() {
  const user = useAuthStore(state => state.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 取得期間資訊
   */
  const getPeriodInfo = useCallback((type: PeriodType, year: number, periodNum?: number): PeriodInfo => {
    let startDate: string
    let endDate: string
    let label: string

    switch (type) {
      case 'month':
        const month = periodNum || 1
        startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
        label = `${year} 年 ${month} 月`
        return { type, year, month, startDate, endDate, label }

      case 'quarter':
        const quarter = periodNum || 1
        const quarterStartMonth = (quarter - 1) * 3 + 1
        const quarterEndMonth = quarter * 3
        startDate = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`
        const qLastDay = new Date(year, quarterEndMonth, 0).getDate()
        endDate = `${year}-${String(quarterEndMonth).padStart(2, '0')}-${qLastDay}`
        label = `${year} 年 Q${quarter}`
        return { type, year, quarter, startDate, endDate, label }

      case 'year':
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        label = `${year} 年度`
        return { type, year, startDate, endDate, label }
    }
  }, [])

  /**
   * 檢查期間是否已結轉
   */
  const checkAlreadyClosed = useCallback(async (
    periodStart: string,
    periodEnd: string
  ): Promise<boolean> => {
    if (!user?.workspace_id) return false

    const { data } = await supabase
      .from('accounting_period_closings')
      .select('id')
      .eq('workspace_id', user.workspace_id)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    return !!data
  }, [user?.workspace_id])

  /**
   * 預覽結轉
   */
  const previewClosing = useCallback(async (
    periodType: PeriodType,
    year: number,
    periodNum?: number
  ): Promise<ClosingPreview | null> => {
    if (!user?.workspace_id) return null

    setLoading(true)
    setError(null)

    try {
      const period = getPeriodInfo(periodType, year, periodNum)

      // 檢查是否已結轉
      const alreadyClosed = await checkAlreadyClosed(period.startDate, period.endDate)

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
        .gte('voucher.voucher_date', period.startDate)
        .lte('voucher.voucher_date', period.endDate)

      if (linesError) throw linesError

      // 計算各科目金額
      const amountMap = new Map<string, number>()

      for (const line of (lines || [])) {
        const accountId = line.account_id
        if (!accountId) continue
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
      const revenueItems: ClosingPreviewItem[] = []
      const costItems: ClosingPreviewItem[] = []
      const expenseItems: ClosingPreviewItem[] = []
      let totalRevenue = 0
      let totalCost = 0
      let totalExpense = 0

      for (const account of (accounts || [])) {
        const amount = amountMap.get(account.id) || 0
        if (amount === 0) continue

        const item: ClosingPreviewItem = {
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_type as 'revenue' | 'expense' | 'cost',
          amount,
          // 結轉方向：收入科目借方結清，成本/費用科目貸方結清
          closing_entry: account.account_type === 'revenue' ? 'debit' : 'credit',
        }

        switch (account.account_type) {
          case 'revenue':
            revenueItems.push(item)
            totalRevenue += amount
            break
          case 'cost':
            costItems.push(item)
            totalCost += amount
            break
          case 'expense':
            expenseItems.push(item)
            totalExpense += amount
            break
        }
      }

      const grossProfit = totalRevenue - totalCost
      const netIncome = grossProfit - totalExpense

      return {
        period,
        revenue_items: revenueItems,
        cost_items: costItems,
        expense_items: expenseItems,
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_expense: totalExpense,
        gross_profit: grossProfit,
        net_income: netIncome,
        is_profit: netIncome >= 0,
        already_closed: alreadyClosed,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '預覽結轉失敗'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id, getPeriodInfo, checkAlreadyClosed])

  /**
   * 執行結轉
   */
  const executeClosing = useCallback(async (
    preview: ClosingPreview
  ): Promise<{ success: boolean; voucherId?: string }> => {
    if (!user?.workspace_id || !user.id) {
      return { success: false }
    }

    if (preview.already_closed) {
      setError('此期間已結轉')
      return { success: false }
    }

    setLoading(true)
    setError(null)

    try {
      // 1. 生成傳票編號
      const voucherDate = preview.period.endDate
      const yearMonth = voucherDate.substring(0, 7).replace('-', '')

      // 查詢當月最大序號
      const { data: existingVouchers } = await supabase
        .from('journal_vouchers')
        .select('voucher_no')
        .eq('workspace_id', user.workspace_id)
        .like('voucher_no', `JV${yearMonth}%`)
        .order('voucher_no', { ascending: false })
        .limit(1)

      let nextSeq = 1
      if (existingVouchers && existingVouchers.length > 0) {
        const lastNo = existingVouchers[0].voucher_no
        const lastSeq = parseInt(lastNo.slice(-4), 10)
        nextSeq = lastSeq + 1
      }
      const voucherNo = `JV${yearMonth}${String(nextSeq).padStart(4, '0')}`

      // 2. 建立結轉傳票
      const { data: voucher, error: voucherError } = await supabase
        .from('journal_vouchers')
        .insert({
          workspace_id: user.workspace_id,
          voucher_no: voucherNo,
          voucher_date: voucherDate,
          memo: `${preview.period.label} 期末結轉`,
          status: 'posted',
          total_debit: preview.total_revenue + (preview.net_income < 0 ? Math.abs(preview.net_income) : 0),
          total_credit: preview.total_cost + preview.total_expense + (preview.net_income >= 0 ? preview.net_income : 0),
          created_by: user.id,
        })
        .select('id')
        .single()

      if (voucherError) throw voucherError

      // 3. 建立結轉分錄
      const journalLines: {
        voucher_id: string
        account_id: string
        description: string
        debit_amount: number
        credit_amount: number
        line_no: number
      }[] = []

      let lineNo = 1

      // 收入科目 - 借方結清
      for (const item of preview.revenue_items) {
        journalLines.push({
          voucher_id: voucher.id,
          account_id: item.account_id,
          description: `結轉 ${item.account_name}`,
          debit_amount: item.amount,
          credit_amount: 0,
          line_no: lineNo++,
        })
      }

      // 成本科目 - 貸方結清
      for (const item of preview.cost_items) {
        journalLines.push({
          voucher_id: voucher.id,
          account_id: item.account_id,
          description: `結轉 ${item.account_name}`,
          debit_amount: 0,
          credit_amount: item.amount,
          line_no: lineNo++,
        })
      }

      // 費用科目 - 貸方結清
      for (const item of preview.expense_items) {
        journalLines.push({
          voucher_id: voucher.id,
          account_id: item.account_id,
          description: `結轉 ${item.account_name}`,
          debit_amount: 0,
          credit_amount: item.amount,
          line_no: lineNo++,
        })
      }

      // 本期損益科目（需要有保留盈餘科目）
      // 這裡簡化處理，直接用差額表示
      // 實際應用中應該轉入「保留盈餘」或「本期損益」科目

      const { error: linesError } = await supabase
        .from('journal_lines')
        .insert(journalLines)

      if (linesError) throw linesError

      // 4. 記錄結轉歷史
      const { error: closingError } = await supabase
        .from('accounting_period_closings')
        .insert({
          workspace_id: user.workspace_id,
          period_type: preview.period.type,
          period_start: preview.period.startDate,
          period_end: preview.period.endDate,
          net_income: preview.net_income,
          closing_voucher_id: voucher.id,
          closed_by: user.id,
          closed_at: new Date().toISOString(),
        })

      if (closingError) throw closingError

      return { success: true, voucherId: voucher.id }
    } catch (err) {
      const message = err instanceof Error ? err.message : '執行結轉失敗'
      setError(message)
      logger.error('執行結轉失敗:', err)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id, user?.id])

  /**
   * 取得結轉歷史
   */
  const fetchClosingHistory = useCallback(async (): Promise<ClosingHistory[]> => {
    if (!user?.workspace_id) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('accounting_period_closings')
        .select('*')
        .eq('workspace_id', user.workspace_id)
        .order('period_end', { ascending: false })

      if (queryError) throw queryError

      return (data || []).map(item => ({
        id: item.id,
        period_type: item.period_type as PeriodType,
        period_start: item.period_start,
        period_end: item.period_end,
        net_income: Number(item.net_income) || 0,
        closing_voucher_id: item.closing_voucher_id,
        closed_by: item.closed_by,
        closed_at: item.closed_at,
        created_at: item.created_at!,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢結轉歷史失敗'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user?.workspace_id])

  return {
    loading,
    error,
    getPeriodInfo,
    previewClosing,
    executeClosing,
    fetchClosingHistory,
  }
}
