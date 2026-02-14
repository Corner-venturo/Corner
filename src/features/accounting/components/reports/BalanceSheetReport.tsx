/**
 * 資產負債表 (Balance Sheet Report)
 * 顯示特定時點的財務狀況
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Wallet, Download, Calendar, Search, Building, CreditCard, PiggyBank } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useAccountingReports, type BalanceSheetResult } from '../../hooks/useAccountingReports'
import { formatDate } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import { BALANCE_SHEET_LABELS } from '@/constants/labels'

export function BalanceSheetReport() {
  const { loading, error, fetchBalanceSheet } = useAccountingReports()

  // 篩選條件
  const [asOfDate, setAsOfDate] = useState<string>(() => formatDate(new Date()))

  // 資料
  const [data, setData] = useState<BalanceSheetResult | null>(null)

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!asOfDate) return
    const result = await fetchBalanceSheet(asOfDate)
    setData(result)
  }, [asOfDate, fetchBalanceSheet])

  // 初次載入時查詢
  useEffect(() => {
    if (asOfDate) {
      handleSearch()
    }
     
  }, [])

  // 匯出 CSV
  const handleExport = () => {
    if (!data) return

    const rows: string[][] = []

    // 資產
    rows.push(['資產', ''])
    data.assets.forEach(e => {
      rows.push([`  ${e.account_code} ${e.account_name}`, e.amount.toString()])
    })
    rows.push(['資產合計', data.total_assets.toString()])
    rows.push(['', ''])

    // 負債
    rows.push(['負債', ''])
    data.liabilities.forEach(e => {
      rows.push([`  ${e.account_code} ${e.account_name}`, e.amount.toString()])
    })
    rows.push(['負債合計', data.total_liabilities.toString()])
    rows.push(['', ''])

    // 權益
    rows.push(['權益（資產-負債）', data.equity.toString()])

    const csvContent = [
      ['項目', '金額'].join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `資產負債表_${asOfDate}.csv`
    link.click()
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="資產負債表"
        icon={Wallet}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '會計', href: '/erp-accounting' },
          { label: '資產負債表', href: '/erp-accounting/reports/balance-sheet' },
        ]}
        actions={
          <Button
            onClick={handleExport}
            disabled={!data}
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
            <span className="text-sm text-morandi-secondary">報表日期</span>
            <DatePicker
              value={asOfDate}
              onChange={setAsOfDate}
              placeholder="選擇日期"
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
        {data ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* 摘要卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <Building size={16} className="text-blue-500" />
                  <span>資產總額</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.total_assets)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <CreditCard size={16} className="text-purple-500" />
                  <span>負債總額</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.total_liabilities)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <PiggyBank size={16} className={data.equity >= 0 ? 'text-morandi-green' : 'text-morandi-red'} />
                  <span>淨資產（權益）</span>
                </div>
                <div className={`text-2xl font-bold ${data.equity >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                  {formatCurrency(data.equity)}
                </div>
              </div>
            </div>

            {/* 詳細報表 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 資產 */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-blue-600" />
                    <h3 className="font-bold text-blue-800">資產</h3>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {data.assets.length > 0 ? (
                    data.assets.map(item => (
                      <div key={item.account_id} className="p-4 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs text-morandi-secondary">{item.account_code}</span>
                          <span className="ml-2 text-morandi-primary">{item.account_name}</span>
                        </div>
                        <span className="font-mono text-morandi-primary">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-morandi-secondary">
                      無資產科目餘額
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-100 flex items-center justify-between font-bold">
                  <span className="text-blue-800">資產合計</span>
                  <span className="font-mono text-blue-800">{formatCurrency(data.total_assets)}</span>
                </div>
              </div>

              {/* 負債 + 權益 */}
              <div className="space-y-6">
                {/* 負債 */}
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-4 bg-purple-50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-purple-600" />
                      <h3 className="font-bold text-purple-800">負債</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {data.liabilities.length > 0 ? (
                      data.liabilities.map(item => (
                        <div key={item.account_id} className="p-4 flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs text-morandi-secondary">{item.account_code}</span>
                            <span className="ml-2 text-morandi-primary">{item.account_name}</span>
                          </div>
                          <span className="font-mono text-morandi-primary">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-morandi-secondary">
                        無負債科目餘額
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-purple-100 flex items-center justify-between font-bold">
                    <span className="text-purple-800">負債合計</span>
                    <span className="font-mono text-purple-800">{formatCurrency(data.total_liabilities)}</span>
                  </div>
                </div>

                {/* 權益 */}
                <div className={`bg-card rounded-lg border border-border overflow-hidden ${data.equity >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                  <div className={`p-4 ${data.equity >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2">
                      <PiggyBank size={20} className={data.equity >= 0 ? 'text-green-600' : 'text-red-600'} />
                      <h3 className={`font-bold ${data.equity >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        權益（資產 - 負債）
                      </h3>
                    </div>
                  </div>
                  <div className={`p-6 ${data.equity >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg ${data.equity >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        淨資產
                      </span>
                      <span className={`font-mono text-2xl font-bold ${data.equity >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {formatCurrency(data.equity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 會計等式驗證 */}
            <div className="bg-morandi-container/30 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-center gap-4 text-lg">
                <span className="font-bold text-blue-600">{BALANCE_SHEET_LABELS.資產.replace('{amount}', formatCurrency(data.total_assets))}</span>
                <span className="text-morandi-secondary">=</span>
                <span className="font-bold text-purple-600">{BALANCE_SHEET_LABELS.負債.replace('{amount}', formatCurrency(data.total_liabilities))}</span>
                <span className="text-morandi-secondary">+</span>
                <span className={`font-bold ${data.equity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {BALANCE_SHEET_LABELS.權益.replace('{amount}', formatCurrency(data.equity))}
                </span>
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Wallet size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">請選擇報表日期並點擊查詢</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
