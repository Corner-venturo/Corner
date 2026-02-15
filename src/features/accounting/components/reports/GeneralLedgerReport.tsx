'use client'
/**
 * 總帳報表 (General Ledger Report)
 * 顯示每個會計科目的所有交易明細
 */


import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, Download, Calendar, Filter, Search } from 'lucide-react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { useAccountingReports, type GeneralLedgerEntry } from '../../hooks/useAccountingReports'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate } from '@/lib/utils/format-date'
import { logger } from '@/lib/utils/logger'
import { ACCOUNTING_REPORT_LABELS } from '../../constants/labels'
interface AccountOption {
  id: string
  code: string
  name: string
}

export function GeneralLedgerReport() {
  const user = useAuthStore(state => state.user)
  const { loading, error, fetchGeneralLedger } = useAccountingReports()

  // 篩選條件
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1) // 本月第一天
    return formatDate(date)
  })
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()))
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // 資料
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  // 載入會計科目
  useEffect(() => {
    async function loadAccounts() {
      if (!user?.workspace_id) return

      setAccountsLoading(true)
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (data) {
        setAccounts(data)
      }
      setAccountsLoading(false)
    }

    loadAccounts().catch((err) => logger.error('[loadAccounts]', err))
  }, [user?.workspace_id])

  // 科目下拉選項
  const accountOptions: ComboboxOption<AccountOption>[] = useMemo(() => {
    return accounts.map(acc => ({
      value: acc.id,
      label: `${acc.code} ${acc.name}`,
      data: acc,
    }))
  }, [accounts])

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) return
    try {
      const data = await fetchGeneralLedger(startDate, endDate, selectedAccountId || undefined)
      setEntries(data)
    } catch (err) {
      logger.error('總分類帳查詢失敗:', err)
    }
  }, [startDate, endDate, selectedAccountId, fetchGeneralLedger])

  // 初次載入時查詢
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch()
    }
     
  }, [])

  // 匯出 CSV
  const handleExport = () => {
    if (entries.length === 0) return

    const headers = [ACCOUNTING_REPORT_LABELS.GL_COL_DATE, ACCOUNTING_REPORT_LABELS.GL_COL_VOUCHER_NO, ACCOUNTING_REPORT_LABELS.GL_COL_ACCOUNT_CODE, ACCOUNTING_REPORT_LABELS.GL_COL_ACCOUNT_NAME, ACCOUNTING_REPORT_LABELS.GL_COL_SUMMARY, ACCOUNTING_REPORT_LABELS.GL_COL_DEBIT, ACCOUNTING_REPORT_LABELS.GL_COL_CREDIT, ACCOUNTING_REPORT_LABELS.GL_COL_BALANCE]
    const rows = entries.map(e => [
      e.date,
      e.voucher_no,
      e.account_code,
      e.account_name,
      e.description || '',
      e.debit_amount.toString(),
      e.credit_amount.toString(),
      e.balance.toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `總帳報表_${startDate}_${endDate}.csv`
    link.click()
  }

  // 計算合計
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        debit: acc.debit + e.debit_amount,
        credit: acc.credit + e.credit_amount,
      }),
      { debit: 0, credit: 0 }
    )
  }, [entries])

  // 表格欄位
  const columns: Column<GeneralLedgerEntry>[] = [
    {
      key: 'date',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_DATE,
      width: '120px',
      render: (_, row) => <DateCell date={row.date} />,
    },
    {
      key: 'voucher_no',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_VOUCHER_NO,
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-morandi-gold">{row.voucher_no}</span>
      ),
    },
    {
      key: 'account',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_ACCOUNT,
      width: '180px',
      render: (_, row) => (
        <div>
          <span className="font-mono text-xs text-morandi-secondary">{row.account_code}</span>
          <span className="ml-2 text-morandi-primary">{row.account_name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_SUMMARY,
      render: (_, row) => (
        <span className="text-morandi-secondary">{row.description || '-'}</span>
      ),
    },
    {
      key: 'debit_amount',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_DEBIT,
      width: '120px',
      align: 'right',
      render: (_, row) => (
        row.debit_amount > 0 ? <CurrencyCell amount={row.debit_amount} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'credit_amount',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_CREDIT,
      width: '120px',
      align: 'right',
      render: (_, row) => (
        row.credit_amount > 0 ? <CurrencyCell amount={row.credit_amount} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'balance',
      label: ACCOUNTING_REPORT_LABELS.GL_COL_BALANCE,
      width: '140px',
      align: 'right',
      render: (_, row) => (
        <CurrencyCell
          amount={row.balance}
          variant={row.balance >= 0 ? 'default' : 'expense'}
        />
      ),
    },
  ]

  return (
    <ContentPageLayout
      title={ACCOUNTING_REPORT_LABELS.GL_TITLE}
      icon={BookOpen}
      breadcrumb={[
        { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_HOME, href: '/' },
        { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_ACCOUNTING, href: '/erp-accounting' },
        { label: ACCOUNTING_REPORT_LABELS.GL_TITLE, href: '/erp-accounting/reports/general-ledger' },
      ]}
      headerActions={
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
                placeholder={ACCOUNTING_REPORT_LABELS.GL_START_DATE_PLACEHOLDER}
              />
              <span className="text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.GL_TO}</span>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder={ACCOUNTING_REPORT_LABELS.GL_END_DATE_PLACEHOLDER}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-[280px]">
            <Filter size={16} className="text-morandi-secondary" />
            <Combobox
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={accountOptions}
              placeholder={accountsLoading ? ACCOUNTING_REPORT_LABELS.GL_ACCOUNT_LOADING : ACCOUNTING_REPORT_LABELS.GL_SELECT_ACCOUNT_PLACEHOLDER}
              emptyMessage={ACCOUNTING_REPORT_LABELS.GL_ACCOUNT_NOT_FOUND}
              showClearButton
              className="flex-1"
            />
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
        {entries.length > 0 ? (
          <>
            <EnhancedTable
              data={entries}
              columns={columns}
              loading={loading}
            />

            {/* 合計列 */}
            <div className="mt-4 p-4 bg-morandi-container/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.TOTAL}</span>
                <div className="flex gap-8">
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.GL_DEBIT_TOTAL}</span>
                    <span className="font-mono font-medium text-morandi-primary">
                      NT$ {totals.debit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.GL_CREDIT_TOTAL}</span>
                    <span className="font-mono font-medium text-morandi-primary">
                      NT$ {totals.credit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.GL_DIFFERENCE}</span>
                    <span className={`font-mono font-medium ${totals.debit === totals.credit ? 'text-morandi-green' : 'text-morandi-red'}`}>
                      NT$ {Math.abs(totals.debit - totals.credit).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.GL_EMPTY}</p>
          </div>
        ) : null}
      </div>
    </ContentPageLayout>
  )
}
