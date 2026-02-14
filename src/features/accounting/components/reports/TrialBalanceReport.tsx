'use client'
/**
 * 試算表 (Trial Balance Report)
 * 驗證借貸平衡，列出所有科目餘額
 */


import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Scale, Download, Calendar, Search, CheckCircle, AlertCircle } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { CurrencyCell } from '@/components/table-cells'
import { useAccountingReports, type TrialBalanceEntry } from '../../hooks/useAccountingReports'
import { formatDate } from '@/lib/utils/format-date'
import { logger } from '@/lib/utils/logger'
import { ACCOUNTING_REPORT_LABELS } from '../../constants/labels'
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: ACCOUNTING_REPORT_LABELS.TYPE_ASSET,
  liability: ACCOUNTING_REPORT_LABELS.TYPE_LIABILITY,
  revenue: ACCOUNTING_REPORT_LABELS.TYPE_REVENUE,
  expense: ACCOUNTING_REPORT_LABELS.TYPE_EXPENSE,
  cost: ACCOUNTING_REPORT_LABELS.TYPE_COST,
}

export function TrialBalanceReport() {
  const { loading, error, fetchTrialBalance } = useAccountingReports()

  // 篩選條件
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()))

  // 資料
  const [entries, setEntries] = useState<TrialBalanceEntry[]>([])

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!endDate) return
    try {
      const data = await fetchTrialBalance(endDate)
      setEntries(data)
    } catch (err) {
      logger.error('試算表查詢失敗:', err)
    }
  }, [endDate, fetchTrialBalance])

  // 初次載入時查詢
  useEffect(() => {
    if (endDate) {
      handleSearch()
    }
     
  }, [])

  // 計算合計
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        debit_total: acc.debit_total + e.debit_total,
        credit_total: acc.credit_total + e.credit_total,
        debit_balance: acc.debit_balance + e.debit_balance,
        credit_balance: acc.credit_balance + e.credit_balance,
      }),
      { debit_total: 0, credit_total: 0, debit_balance: 0, credit_balance: 0 }
    )
  }, [entries])

  // 借貸是否平衡
  const isBalanced = Math.abs(totals.debit_balance - totals.credit_balance) < 0.01

  // 匯出 CSV
  const handleExport = () => {
    if (entries.length === 0) return

    const headers = [ACCOUNTING_REPORT_LABELS.TB_COL_CODE, ACCOUNTING_REPORT_LABELS.TB_COL_NAME, ACCOUNTING_REPORT_LABELS.TB_COL_TYPE, ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_AMOUNT, ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_AMOUNT, ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_BALANCE, ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_BALANCE]
    const rows = entries.map(e => [
      e.account_code,
      e.account_name,
      ACCOUNT_TYPE_LABELS[e.account_type] || e.account_type,
      e.debit_total.toString(),
      e.credit_total.toString(),
      e.debit_balance.toString(),
      e.credit_balance.toString(),
    ])

    // 加入合計列
    rows.push([
      '',
      ACCOUNTING_REPORT_LABELS.TOTAL,
      '',
      totals.debit_total.toString(),
      totals.credit_total.toString(),
      totals.debit_balance.toString(),
      totals.credit_balance.toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `試算表_${endDate}.csv`
    link.click()
  }

  // 表格欄位
  const columns: Column<TrialBalanceEntry>[] = [
    {
      key: 'account_code',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_CODE,
      width: '120px',
      render: (_, row) => (
        <span className="font-mono text-morandi-gold">{row.account_code}</span>
      ),
    },
    {
      key: 'account_name',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_NAME,
      width: '200px',
      render: (_, row) => (
        <span className="text-morandi-primary">{row.account_name}</span>
      ),
    },
    {
      key: 'account_type',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_TYPE,
      width: '80px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          row.account_type === 'asset' ? 'bg-blue-100 text-blue-700' :
          row.account_type === 'liability' ? 'bg-purple-100 text-purple-700' :
          row.account_type === 'revenue' ? 'bg-green-100 text-green-700' :
          row.account_type === 'expense' ? 'bg-red-100 text-red-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {ACCOUNT_TYPE_LABELS[row.account_type] || row.account_type}
        </span>
      ),
    },
    {
      key: 'debit_total',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_AMOUNT,
      width: '140px',
      align: 'right',
      render: (_, row) => (
        row.debit_total > 0 ? <CurrencyCell amount={row.debit_total} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'credit_total',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_AMOUNT,
      width: '140px',
      align: 'right',
      render: (_, row) => (
        row.credit_total > 0 ? <CurrencyCell amount={row.credit_total} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'debit_balance',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_BALANCE,
      width: '140px',
      align: 'right',
      render: (_, row) => (
        row.debit_balance > 0 ? <CurrencyCell amount={row.debit_balance} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'credit_balance',
      label: ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_BALANCE,
      width: '140px',
      align: 'right',
      render: (_, row) => (
        row.credit_balance > 0 ? <CurrencyCell amount={row.credit_balance} /> : <span className="text-morandi-muted">-</span>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={ACCOUNTING_REPORT_LABELS.TB_TITLE}
        icon={Scale}
        breadcrumb={[
          { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_HOME, href: '/' },
          { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_ACCOUNTING, href: '/erp-accounting' },
          { label: ACCOUNTING_REPORT_LABELS.TB_TITLE, href: '/erp-accounting/reports/trial-balance' },
        ]}
        actions={
          <Button
            onClick={handleExport}
            disabled={entries.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download size={16} />
            {ACCOUNTING_REPORT_LABELS.EXPORT_CSV}
          </Button>
        }
      />

      {/* 篩選區 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <span className="text-sm text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.END_DATE}</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder={ACCOUNTING_REPORT_LABELS.SELECT_DATE}
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Search size={16} />
            {ACCOUNTING_REPORT_LABELS.QUERY}
          </Button>

          {/* 平衡狀態指示 */}
          {entries.length > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isBalanced ? 'bg-morandi-green/10 text-morandi-green' : 'bg-morandi-red/10 text-morandi-red'
            }`}>
              {isBalanced ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm font-medium">
                {isBalanced ? ACCOUNTING_REPORT_LABELS.TB_BALANCED : ACCOUNTING_REPORT_LABELS.TB_UNBALANCED}
              </span>
            </div>
          )}
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
        {entries.length > 0 ? (
          <>
            <EnhancedTable
              data={entries}
              columns={columns}
              loading={loading}
            />

            {/* 合計列 */}
            <div className="mt-4 p-4 bg-morandi-container/30 rounded-lg border border-border">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                  <span className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.TOTAL}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_AMOUNT}</span>
                  <span className="font-mono font-medium text-morandi-primary">
                    NT$ {totals.debit_total.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_AMOUNT}</span>
                  <span className="font-mono font-medium text-morandi-primary">
                    NT$ {totals.credit_total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-border">
                <div className="col-span-2">
                  <span className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.TB_BALANCE_TOTAL}</span>
                </div>
                <div />
                <div className="text-right">
                  <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.TB_COL_DEBIT_BALANCE}</span>
                  <span className="font-mono font-medium text-morandi-primary">
                    NT$ {totals.debit_balance.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.TB_COL_CREDIT_BALANCE}</span>
                  <span className="font-mono font-medium text-morandi-primary">
                    NT$ {totals.credit_balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {!isBalanced && (
                <div className="mt-4 p-3 bg-morandi-red/10 rounded-lg flex items-center gap-2 text-morandi-red">
                  <AlertCircle size={16} />
                  <span>
                    差額: NT$ {Math.abs(totals.debit_balance - totals.credit_balance).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Scale size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.TB_EMPTY}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
