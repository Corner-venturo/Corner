/**
 * 總帳報表 (General Ledger Report)
 * 顯示每個會計科目的所有交易明細
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { BookOpen, Download, Calendar, Filter, Search } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { useAccountingReports, type GeneralLedgerEntry } from '../../hooks/useAccountingReports'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate } from '@/lib/utils/format-date'

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

  // 查詢報表
  const handleSearch = async () => {
    if (!startDate || !endDate) return
    const data = await fetchGeneralLedger(startDate, endDate, selectedAccountId || undefined)
    setEntries(data)
  }

  // 初次載入時查詢
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch()
    }
     
  }, [])

  // 匯出 CSV
  const handleExport = () => {
    if (entries.length === 0) return

    const headers = ['日期', '傳票編號', '科目代碼', '科目名稱', '摘要', '借方', '貸方', '餘額']
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
      label: '日期',
      width: '120px',
      render: (_, row) => <DateCell date={row.date} />,
    },
    {
      key: 'voucher_no',
      label: '傳票編號',
      width: '140px',
      render: (_, row) => (
        <span className="font-mono text-morandi-gold">{row.voucher_no}</span>
      ),
    },
    {
      key: 'account',
      label: '科目',
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
      label: '摘要',
      render: (_, row) => (
        <span className="text-morandi-secondary">{row.description || '-'}</span>
      ),
    },
    {
      key: 'debit_amount',
      label: '借方',
      width: '120px',
      align: 'right',
      render: (_, row) => (
        row.debit_amount > 0 ? <CurrencyCell amount={row.debit_amount} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'credit_amount',
      label: '貸方',
      width: '120px',
      align: 'right',
      render: (_, row) => (
        row.credit_amount > 0 ? <CurrencyCell amount={row.credit_amount} /> : <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'balance',
      label: '餘額',
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
        title="總帳報表"
        icon={BookOpen}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '會計', href: '/erp-accounting' },
          { label: '總帳報表', href: '/erp-accounting/reports/general-ledger' },
        ]}
        actions={
          <Button
            onClick={handleExport}
            disabled={entries.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download size={16} />
            匯出 CSV
          </Button>
        }
      />

      {/* 篩選區 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <div className="flex items-center gap-2">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="開始日期"
              />
              <span className="text-morandi-secondary">至</span>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="結束日期"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-[280px]">
            <Filter size={16} className="text-morandi-secondary" />
            <Combobox
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={accountOptions}
              placeholder={accountsLoading ? '載入中...' : '選擇科目（可選）'}
              emptyMessage="找不到科目"
              showClearButton
              className="flex-1"
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Search size={16} />
            查詢
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
                <span className="font-medium text-morandi-primary">合計</span>
                <div className="flex gap-8">
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">借方合計</span>
                    <span className="font-mono font-medium text-morandi-primary">
                      NT$ {totals.debit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">貸方合計</span>
                    <span className="font-mono font-medium text-morandi-primary">
                      NT$ {totals.credit.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-morandi-secondary block">差額</span>
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
            <p className="text-morandi-secondary">請選擇日期範圍並點擊查詢</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
