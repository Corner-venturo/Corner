'use client'
/**
 * 損益表 (Income Statement Report)
 * 顯示收入與費用，計算本期損益
 */


import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Download, Calendar, Search, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useAccountingReports, type IncomeStatementResult } from '../../hooks/useAccountingReports'
import { formatDate } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import { logger } from '@/lib/utils/logger'
import { ACCOUNTING_REPORT_LABELS } from '../../constants/labels'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function IncomeStatementReport() {
  const { loading, error, fetchIncomeStatement } = useAccountingReports()

  // 篩選條件
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1) // 本月第一天
    return formatDate(date)
  })
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()))

  // 資料
  const [data, setData] = useState<IncomeStatementResult | null>(null)

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) return
    try {
      const result = await fetchIncomeStatement(startDate, endDate)
      setData(result)
    } catch (err) {
      logger.error('損益表查詢失敗:', err)
    }
  }, [startDate, endDate, fetchIncomeStatement])

  // 初次載入時查詢
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch()
    }
     
  }, [])

  // 匯出 CSV
  const handleExport = () => {
    if (!data) return

    const rows: string[][] = []

    // 收入
    rows.push([ACCOUNTING_REPORT_LABELS.IS_REVENUE_SECTION, '', ''])
    data.revenue.forEach(e => {
      rows.push([`  ${e.account_code} ${e.account_name}`, e.amount.toString(), formatPercent(e.percentage)])
    })
    rows.push([ACCOUNTING_REPORT_LABELS.IS_REVENUE_TOTAL, data.total_revenue.toString(), '100%'])
    rows.push(['', '', ''])

    // 成本
    rows.push([ACCOUNTING_REPORT_LABELS.IS_COST_SECTION, '', ''])
    data.cost.forEach(e => {
      rows.push([`  ${e.account_code} ${e.account_name}`, e.amount.toString(), formatPercent(e.percentage)])
    })
    rows.push([ACCOUNTING_REPORT_LABELS.IS_COST_TOTAL, data.total_cost.toString(), formatPercent((data.total_cost / data.total_revenue) * 100)])
    rows.push(['', '', ''])

    // 毛利
    rows.push([ACCOUNTING_REPORT_LABELS.IS_GROSS_PROFIT, data.gross_profit.toString(), formatPercent((data.gross_profit / data.total_revenue) * 100)])
    rows.push(['', '', ''])

    // 費用
    rows.push([ACCOUNTING_REPORT_LABELS.IS_EXPENSE_SECTION, '', ''])
    data.expense.forEach(e => {
      rows.push([`  ${e.account_code} ${e.account_name}`, e.amount.toString(), formatPercent(e.percentage)])
    })
    rows.push([ACCOUNTING_REPORT_LABELS.IS_EXPENSE_TOTAL, data.total_expense.toString(), formatPercent((data.total_expense / data.total_revenue) * 100)])
    rows.push(['', '', ''])

    // 淨利
    rows.push([ACCOUNTING_REPORT_LABELS.IS_OPERATING_INCOME, data.operating_income.toString(), formatPercent((data.operating_income / data.total_revenue) * 100)])

    const csvContent = [
      [ACCOUNTING_REPORT_LABELS.IS_CSV_ITEM, ACCOUNTING_REPORT_LABELS.IS_CSV_AMOUNT, ACCOUNTING_REPORT_LABELS.IS_CSV_RATIO].join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `損益表_${startDate}_${endDate}.csv`
    link.click()
  }

  return (
    <ContentPageLayout
      title={ACCOUNTING_REPORT_LABELS.IS_TITLE}
      icon={TrendingUp}
      breadcrumb={[
        { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_HOME, href: '/' },
        { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_ACCOUNTING, href: '/erp-accounting' },
        { label: ACCOUNTING_REPORT_LABELS.IS_TITLE, href: '/erp-accounting/reports/income-statement' },
      ]}
      headerActions={
        <Button
          onClick={handleExport}
          disabled={!data}
          variant="outline"
          className="gap-2"
        >
          <Download size={16} />
          {ACCOUNTING_REPORT_LABELS.EXPORT_CSV}
        </Button>
      }
    >

      {/* 篩選區 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <div className="flex items-center gap-2">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder={ACCOUNTING_REPORT_LABELS.IS_START_DATE}
              />
              <span className="text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.IS_TO}</span>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder={ACCOUNTING_REPORT_LABELS.IS_END_DATE}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Search size={16} />
            {ACCOUNTING_REPORT_LABELS.QUERY}
          </Button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-morandi-red/10 border border-morandi-red/30 rounded-lg text-morandi-red">
          {error}
        </div>
      )}

      {/* 報表內容 */}
      <div className="flex-1 overflow-auto p-4">
        {data ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 摘要卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <ArrowUp size={16} className="text-morandi-green" />
                  <span>{ACCOUNTING_REPORT_LABELS.IS_REVENUE_LABEL}</span>
                </div>
                <div className="text-2xl font-bold text-morandi-green">
                  {formatCurrency(data.total_revenue)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <ArrowDown size={16} className="text-morandi-red" />
                  <span>{ACCOUNTING_REPORT_LABELS.IS_TOTAL_EXPENDITURE}</span>
                </div>
                <div className="text-2xl font-bold text-morandi-red">
                  {formatCurrency(data.total_cost + data.total_expense)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <Minus size={16} className={data.operating_income >= 0 ? 'text-morandi-green' : 'text-morandi-red'} />
                  <span>{ACCOUNTING_REPORT_LABELS.IS_OPERATING_INCOME}</span>
                </div>
                <div className={`text-2xl font-bold ${data.operating_income >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                  {formatCurrency(data.operating_income)}
                </div>
              </div>
            </div>

            {/* 詳細報表 */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* 一、營業收入 */}
              <div className="border-b border-border">
                <div className="p-4 bg-morandi-container/30">
                  <h3 className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.IS_REVENUE_SECTION}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.revenue.map(item => (
                    <div key={item.account_id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-morandi-secondary">{item.account_code}</span>
                        <span className="ml-2 text-morandi-primary">{item.account_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-morandi-primary">{formatCurrency(item.amount)}</span>
                        <span className="text-sm text-morandi-secondary w-16 text-right">{formatPercent(item.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-green-50 flex items-center justify-between font-medium">
                  <span>{ACCOUNTING_REPORT_LABELS.IS_REVENUE_TOTAL}</span>
                  <span className="font-mono text-morandi-green">{formatCurrency(data.total_revenue)}</span>
                </div>
              </div>

              {/* 二、營業成本 */}
              <div className="border-b border-border">
                <div className="p-4 bg-morandi-container/30">
                  <h3 className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.IS_COST_SECTION}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.cost.map(item => (
                    <div key={item.account_id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-morandi-secondary">{item.account_code}</span>
                        <span className="ml-2 text-morandi-primary">{item.account_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-morandi-primary">{formatCurrency(item.amount)}</span>
                        <span className="text-sm text-morandi-secondary w-16 text-right">{formatPercent(item.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-orange-50 flex items-center justify-between font-medium">
                  <span>{ACCOUNTING_REPORT_LABELS.IS_COST_TOTAL}</span>
                  <span className="font-mono text-orange-600">{formatCurrency(data.total_cost)}</span>
                </div>
              </div>

              {/* 三、營業毛利 */}
              <div className="p-4 bg-blue-50 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-blue-800">{ACCOUNTING_REPORT_LABELS.IS_GROSS_PROFIT}</h3>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-blue-800">{formatCurrency(data.gross_profit)}</span>
                    <span className="text-sm text-blue-600 w-16 text-right">
                      {data.total_revenue > 0 ? formatPercent((data.gross_profit / data.total_revenue) * 100) : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 四、營業費用 */}
              <div className="border-b border-border">
                <div className="p-4 bg-morandi-container/30">
                  <h3 className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.IS_EXPENSE_SECTION}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.expense.map(item => (
                    <div key={item.account_id} className="p-4 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-morandi-secondary">{item.account_code}</span>
                        <span className="ml-2 text-morandi-primary">{item.account_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-morandi-primary">{formatCurrency(item.amount)}</span>
                        <span className="text-sm text-morandi-secondary w-16 text-right">{formatPercent(item.percentage)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-red-50 flex items-center justify-between font-medium">
                  <span>{ACCOUNTING_REPORT_LABELS.IS_EXPENSE_TOTAL}</span>
                  <span className="font-mono text-morandi-red">{formatCurrency(data.total_expense)}</span>
                </div>
              </div>

              {/* 五、營業淨利 */}
              <div className={`p-6 ${data.operating_income >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${data.operating_income >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {ACCOUNTING_REPORT_LABELS.IS_OPERATING_INCOME_LOSS}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-2xl font-bold ${data.operating_income >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {formatCurrency(data.operating_income)}
                    </span>
                    <span className={`text-sm ${data.operating_income >= 0 ? 'text-green-600' : 'text-red-600'} w-16 text-right`}>
                      {data.total_revenue > 0 ? formatPercent((data.operating_income / data.total_revenue) * 100) : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <TrendingUp size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.IS_EMPTY}</p>
          </div>
        ) : null}
      </div>
    </ContentPageLayout>
  )
}
