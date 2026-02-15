'use client'
/**
 * 現金流量表 (Cash Flow Statement Report)
 * 顯示現金流入流出
 */


import React, { useState, useEffect, useCallback } from 'react'
import { Banknote, Download, Calendar, Search, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useAccountingReports, type CashFlowResult } from '../../hooks/useAccountingReports'
import { formatDate } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format-currency'
import { logger } from '@/lib/utils/logger'
import { REPORTS_LABELS } from './constants/labels'
export function CashFlowStatementReport() {
  const { loading, error, fetchCashFlowStatement } = useAccountingReports()

  // 篩選條件
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1) // 本月第一天
    return formatDate(date)
  })
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()))

  // 資料
  const [data, setData] = useState<CashFlowResult | null>(null)

  // 查詢報表
  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) return
    try {
      const result = await fetchCashFlowStatement(startDate, endDate)
      setData(result)
    } catch (err) {
      logger.error('現金流量表查詢失敗:', err)
    }
  }, [startDate, endDate, fetchCashFlowStatement])

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

    // 營業活動
    rows.push(['一、營業活動之現金流量', ''])
    data.operating_activities.forEach(e => {
      rows.push([`  ${e.description}`, e.amount.toString()])
    })
    rows.push(['營業活動淨現金流量', data.net_operating.toString()])
    rows.push(['', ''])

    // 投資活動
    rows.push(['二、投資活動之現金流量', ''])
    data.investing_activities.forEach(e => {
      rows.push([`  ${e.description}`, e.amount.toString()])
    })
    rows.push(['投資活動淨現金流量', data.net_investing.toString()])
    rows.push(['', ''])

    // 籌資活動
    rows.push(['三、籌資活動之現金流量', ''])
    data.financing_activities.forEach(e => {
      rows.push([`  ${e.description}`, e.amount.toString()])
    })
    rows.push(['籌資活動淨現金流量', data.net_financing.toString()])
    rows.push(['', ''])

    // 彙總
    rows.push(['四、本期現金及約當現金增減數', data.net_change.toString()])
    rows.push(['五、期初現金及約當現金餘額', data.opening_cash.toString()])
    rows.push(['六、期末現金及約當現金餘額', data.closing_cash.toString()])

    const csvContent = [
      ['項目', '金額'].join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `現金流量表_${startDate}_${endDate}.csv`
    link.click()
  }

  return (
    <ContentPageLayout
      title={REPORTS_LABELS.LABEL_3933}
      icon={Banknote}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '會計', href: '/erp-accounting' },
        { label: '現金流量表', href: '/erp-accounting/reports/cash-flow' },
      ]}
      headerActions={
        <Button
          onClick={handleExport}
          disabled={!data}
          variant="outline"
          className="gap-2"
        >
          <Download size={16} />
          {REPORTS_LABELS.EXPORT_9918}
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
                placeholder={REPORTS_LABELS.LABEL_4743}
              />
              <span className="text-morandi-secondary">{REPORTS_LABELS.LABEL_4812}</span>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder={REPORTS_LABELS.LABEL_9824}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white">
            <Search size={16} />
            {REPORTS_LABELS.QUERYING_754}
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
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <Banknote size={16} className="text-morandi-gold" />
                  <span>{REPORTS_LABELS.LABEL_6771}</span>
                </div>
                <div className="text-xl font-bold text-morandi-primary">
                  {formatCurrency(data.opening_cash)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  {data.net_change >= 0 ? (
                    <TrendingUp size={16} className="text-morandi-green" />
                  ) : (
                    <TrendingDown size={16} className="text-morandi-red" />
                  )}
                  <span>{REPORTS_LABELS.LABEL_4320}</span>
                </div>
                <div className={`text-xl font-bold ${data.net_change >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                  {formatCurrency(data.net_change)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  <Banknote size={16} className="text-morandi-gold" />
                  <span>{REPORTS_LABELS.LABEL_697}</span>
                </div>
                <div className="text-xl font-bold text-morandi-primary">
                  {formatCurrency(data.closing_cash)}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-morandi-secondary mb-2">
                  {data.net_change >= 0 ? (
                    <ArrowUpRight size={16} className="text-morandi-green" />
                  ) : (
                    <ArrowDownRight size={16} className="text-morandi-red" />
                  )}
                  <span>{REPORTS_LABELS.LABEL_6222}</span>
                </div>
                <div className={`text-xl font-bold ${data.net_change >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                  {data.opening_cash !== 0
                    ? `${((data.net_change / data.opening_cash) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
            </div>

            {/* 詳細報表 */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {/* 一、營業活動 */}
              <div className="border-b border-border">
                <div className="p-4 bg-blue-50 border-b border-border">
                  <h3 className="font-bold text-blue-800">{REPORTS_LABELS.LABEL_4677}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.operating_activities.length > 0 ? (
                    data.operating_activities.slice(0, 10).map((item, index) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <span className="text-morandi-primary">{item.description}</span>
                        <span className={`font-mono ${item.amount >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-morandi-secondary">
                      {REPORTS_LABELS.LABEL_2834}
                    </div>
                  )}
                  {data.operating_activities.length > 10 && (
                    <div className="p-4 text-center text-morandi-secondary">
                      ... 還有 {data.operating_activities.length - 10} 筆
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-100 flex items-center justify-between font-bold">
                  <span className="text-blue-800">{REPORTS_LABELS.LABEL_4189}</span>
                  <span className={`font-mono ${data.net_operating >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
                    {formatCurrency(data.net_operating)}
                  </span>
                </div>
              </div>

              {/* 二、投資活動 */}
              <div className="border-b border-border">
                <div className="p-4 bg-purple-50 border-b border-border">
                  <h3 className="font-bold text-purple-800">{REPORTS_LABELS.LABEL_3365}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.investing_activities.length > 0 ? (
                    data.investing_activities.map((item, index) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <span className="text-morandi-primary">{item.description}</span>
                        <span className={`font-mono ${item.amount >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-morandi-secondary">
                      {REPORTS_LABELS.LABEL_7816}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-purple-100 flex items-center justify-between font-bold">
                  <span className="text-purple-800">{REPORTS_LABELS.LABEL_1693}</span>
                  <span className={`font-mono ${data.net_investing >= 0 ? 'text-purple-800' : 'text-red-600'}`}>
                    {formatCurrency(data.net_investing)}
                  </span>
                </div>
              </div>

              {/* 三、籌資活動 */}
              <div className="border-b border-border">
                <div className="p-4 bg-orange-50 border-b border-border">
                  <h3 className="font-bold text-orange-800">{REPORTS_LABELS.LABEL_3153}</h3>
                </div>
                <div className="divide-y divide-border">
                  {data.financing_activities.length > 0 ? (
                    data.financing_activities.map((item, index) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <span className="text-morandi-primary">{item.description}</span>
                        <span className={`font-mono ${item.amount >= 0 ? 'text-morandi-green' : 'text-morandi-red'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-morandi-secondary">
                      {REPORTS_LABELS.LABEL_3319}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-orange-100 flex items-center justify-between font-bold">
                  <span className="text-orange-800">{REPORTS_LABELS.LABEL_5705}</span>
                  <span className={`font-mono ${data.net_financing >= 0 ? 'text-orange-800' : 'text-red-600'}`}>
                    {formatCurrency(data.net_financing)}
                  </span>
                </div>
              </div>

              {/* 四、彙總 */}
              <div className={`p-6 ${data.net_change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{REPORTS_LABELS.LABEL_2457}</span>
                    <span className={`font-mono text-xl font-bold ${data.net_change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {formatCurrency(data.net_change)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-morandi-secondary">{REPORTS_LABELS.LABEL_7994}</span>
                    <span className="font-mono text-morandi-primary">
                      {formatCurrency(data.opening_cash)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-current/20 pt-4">
                    <span className={`text-lg font-bold ${data.net_change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {REPORTS_LABELS.LABEL_607}
                    </span>
                    <span className={`font-mono text-2xl font-bold ${data.net_change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {formatCurrency(data.closing_cash)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Banknote size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">{REPORTS_LABELS.PLEASE_SELECT_4556}</p>
          </div>
        ) : null}
      </div>
    </ContentPageLayout>
  )
}
