'use client'
/**
 * 科目明細帳 (Account Ledger Report)
 * 顯示單一會計科目的所有交易明細，包含期初餘額和期末餘額
 */


import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FileText, Download, Calendar, Search } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate } from '@/lib/utils/format-date'
import { logger } from '@/lib/utils/logger'
import { ACCOUNTING_REPORT_LABELS } from '../../constants/labels'

interface AccountOption {
  id: string
  code: string
  name: string
  account_type: string
}

interface LedgerEntry {
  id: string
  date: string
  voucher_no: string
  voucher_id: string
  description: string | null
  debit_amount: number
  credit_amount: number
  balance: number
}

export function AccountLedgerReport() {
  const user = useAuthStore(state => state.user)

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
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 載入會計科目
  useEffect(() => {
    async function loadAccounts() {
      if (!user?.workspace_id) return

      setAccountsLoading(true)
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name, account_type')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .order('code', { ascending: true })

      if (data) {
        setAccounts(data)
      }
      setAccountsLoading(false)
    }

    loadAccounts()
  }, [user?.workspace_id])

  // 科目下拉選項
  const accountOptions: ComboboxOption<AccountOption>[] = useMemo(() => {
    return accounts.map(acc => ({
      value: acc.id,
      label: `${acc.code} ${acc.name}`,
      data: acc,
    }))
  }, [accounts])

  // 取得選中的科目資訊
  const selectedAccount = useMemo(() => {
    return accounts.find(a => a.id === selectedAccountId)
  }, [accounts, selectedAccountId])

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!selectedAccountId || !startDate || !endDate || !user?.workspace_id) {
      setError('請選擇科目和日期範圍')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. 計算期初餘額（startDate 之前的所有分錄）
      const { data: openingData, error: openingError } = await supabase
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
        .eq('account_id', selectedAccountId)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .lt('voucher.voucher_date', startDate)

      if (openingError) {
        logger.error('查詢期初餘額失敗:', openingError)
        throw openingError
      }

      // 計算期初餘額
      const opening = (openingData || []).reduce((sum, line) => {
        return sum + (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0)
      }, 0)
      setOpeningBalance(opening)

      // 2. 取得期間內的分錄
      const { data: periodData, error: periodError } = await supabase
        .from('journal_lines')
        .select(`
          id,
          description,
          debit_amount,
          credit_amount,
          voucher:journal_vouchers!inner(
            id,
            voucher_no,
            voucher_date,
            status,
            workspace_id,
            memo
          )
        `)
        .eq('account_id', selectedAccountId)
        .eq('voucher.status', 'posted')
        .eq('voucher.workspace_id', user.workspace_id)
        .gte('voucher.voucher_date', startDate)
        .lte('voucher.voucher_date', endDate)
        .order('voucher.voucher_date', { ascending: true })

      if (periodError) {
        logger.error('查詢分錄失敗:', periodError)
        throw periodError
      }

      // 計算累計餘額
      let runningBalance = opening
      const ledgerEntries: LedgerEntry[] = (periodData || []).map((item) => {
        const debit = Number(item.debit_amount) || 0
        const credit = Number(item.credit_amount) || 0
        runningBalance += debit - credit

        const voucher = item.voucher as {
          id: string
          voucher_no: string
          voucher_date: string
          memo: string | null
        } | null

        return {
          id: item.id,
          date: voucher?.voucher_date || '',
          voucher_no: voucher?.voucher_no || '',
          voucher_id: voucher?.id || '',
          description: item.description || voucher?.memo || null,
          debit_amount: debit,
          credit_amount: credit,
          balance: runningBalance,
        }
      })

      setEntries(ledgerEntries)
    } catch (err) {
      const message = err instanceof Error ? err.message : '查詢科目明細帳失敗'
      setError(message)
      setEntries([])
      setOpeningBalance(0)
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId, startDate, endDate, user?.workspace_id])

  // 計算合計
  const totals = useMemo(() => {
    const debit = entries.reduce((sum, e) => sum + e.debit_amount, 0)
    const credit = entries.reduce((sum, e) => sum + e.credit_amount, 0)
    const closingBalance = entries.length > 0 
      ? entries[entries.length - 1].balance 
      : openingBalance

    return { debit, credit, closingBalance }
  }, [entries, openingBalance])

  // 匯出 CSV
  const handleExport = () => {
    if (!selectedAccount) return

    const headers = [ACCOUNTING_REPORT_LABELS.GL_COL_DATE, ACCOUNTING_REPORT_LABELS.GL_COL_VOUCHER_NO, ACCOUNTING_REPORT_LABELS.GL_COL_SUMMARY, ACCOUNTING_REPORT_LABELS.GL_COL_DEBIT, ACCOUNTING_REPORT_LABELS.GL_COL_CREDIT, ACCOUNTING_REPORT_LABELS.GL_COL_BALANCE]
    
    // 期初餘額行
    const rows: string[][] = [
      ['', '', ACCOUNTING_REPORT_LABELS.AL_OPENING_BALANCE, '', '', openingBalance.toString()],
    ]

    // 分錄行
    entries.forEach(e => {
      rows.push([
        e.date,
        e.voucher_no,
        e.description || '',
        e.debit_amount.toString(),
        e.credit_amount.toString(),
        e.balance.toString(),
      ])
    })

    // 合計行
    rows.push([
      '',
      '',
      ACCOUNTING_REPORT_LABELS.AL_CLOSING_BALANCE,
      totals.debit.toString(),
      totals.credit.toString(),
      totals.closingBalance.toString(),
    ])

    const csvContent = [
      `科目明細帳 - ${selectedAccount.code} ${selectedAccount.name}`,
      `期間: ${startDate} 至 ${endDate}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `科目明細帳_${selectedAccount.code}_${startDate}_${endDate}.csv`
    link.click()
  }

  // 表格欄位
  const columns: Column<LedgerEntry>[] = [
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
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={ACCOUNTING_REPORT_LABELS.AL_TITLE}
        icon={FileText}
        breadcrumb={[
          { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_HOME, href: '/' },
          { label: ACCOUNTING_REPORT_LABELS.BREADCRUMB_ACCOUNTING, href: '/erp-accounting' },
          { label: ACCOUNTING_REPORT_LABELS.AL_BREADCRUMB_REPORTS, href: '/erp-accounting/reports' },
          { label: ACCOUNTING_REPORT_LABELS.AL_TITLE, href: '/erp-accounting/reports/account-ledger' },
        ]}
        actions={
          <Button
            onClick={handleExport}
            disabled={entries.length === 0 || !selectedAccount}
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
          {/* 科目選擇（必選） */}
          <div className="flex flex-col gap-1 min-w-[300px]">
            <label className="text-sm text-morandi-primary">{ACCOUNTING_REPORT_LABELS.AL_SELECT_ACCOUNT}</label>
            <Combobox
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={accountOptions}
              placeholder={accountsLoading ? ACCOUNTING_REPORT_LABELS.GL_ACCOUNT_LOADING : ACCOUNTING_REPORT_LABELS.AL_SELECT_ACCOUNT_PLACEHOLDER}
              emptyMessage={ACCOUNTING_REPORT_LABELS.GL_ACCOUNT_NOT_FOUND}
              className="flex-1"
            />
          </div>

          {/* 日期範圍 */}
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

          <Button 
            onClick={handleSearch} 
            disabled={loading || !selectedAccountId} 
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
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
        {selectedAccount && (entries.length > 0 || openingBalance !== 0) ? (
          <>
            {/* 科目資訊 */}
            <div className="mb-4 p-4 bg-morandi-container/30 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.AL_ACCOUNT_LABEL}</span>
                  <div className="font-medium text-morandi-primary">
                    <span className="font-mono">{selectedAccount.code}</span>
                    <span className="ml-2">{selectedAccount.name}</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-sm text-morandi-secondary">{ACCOUNTING_REPORT_LABELS.AL_OPENING_BALANCE}</span>
                  <div className="font-mono font-medium">
                    <CurrencyCell 
                      amount={openingBalance} 
                      variant={openingBalance >= 0 ? 'default' : 'expense'} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 明細表格 */}
            <EnhancedTable
              data={entries}
              columns={columns}
              loading={loading}
            />

            {/* 合計列 */}
            <div className="mt-4 p-4 bg-morandi-container/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-morandi-primary">{ACCOUNTING_REPORT_LABELS.AL_PERIOD_TOTAL}</span>
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
                    <span className="text-sm text-morandi-secondary block">{ACCOUNTING_REPORT_LABELS.AL_CLOSING_BALANCE}</span>
                    <span className={`font-mono font-medium ${totals.closingBalance >= 0 ? 'text-morandi-primary' : 'text-morandi-red'}`}>
                      NT$ {totals.closingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">
              {selectedAccountId ? ACCOUNTING_REPORT_LABELS.AL_EMPTY_WITH_ACCOUNT : ACCOUNTING_REPORT_LABELS.AL_EMPTY}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
