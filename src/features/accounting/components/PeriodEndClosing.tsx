/**
 * 期末結轉頁面
 * 將損益科目餘額結轉至保留盈餘
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  Calendar,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  History,
  Play,
  ArrowRight,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { formatCurrency } from '@/lib/utils/format-currency'
import {
  usePeriodClosing,
  type PeriodType,
  type ClosingPreview,
  type ClosingPreviewItem,
  type ClosingHistory,
} from '../hooks/usePeriodClosing'
import { PERIOD_CLOSING_LABELS } from '@/constants/labels'

const PERIOD_TYPE_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'month', label: PERIOD_CLOSING_LABELS.月結 },
  { value: 'quarter', label: PERIOD_CLOSING_LABELS.季結 },
  { value: 'year', label: PERIOD_CLOSING_LABELS.年結 },
]

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} 月`,
}))

const QUARTER_OPTIONS = [
  { value: 1, label: PERIOD_CLOSING_LABELS.Q1 },
  { value: 2, label: PERIOD_CLOSING_LABELS.Q2 },
  { value: 3, label: PERIOD_CLOSING_LABELS.Q3 },
  { value: 4, label: PERIOD_CLOSING_LABELS.Q4 },
]


export function PeriodEndClosing() {
  const {
    loading,
    error,
    previewClosing,
    executeClosing,
    fetchClosingHistory,
  } = usePeriodClosing()

  // 期間選擇
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [periodNum, setPeriodNum] = useState<number>(new Date().getMonth() + 1)

  // 預覽資料
  const [preview, setPreview] = useState<ClosingPreview | null>(null)

  // 歷史記錄
  const [history, setHistory] = useState<ClosingHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 載入歷史
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const data = await fetchClosingHistory()
    setHistory(data)
  }

  // 預覽結轉
  const handlePreview = async () => {
    const num = periodType === 'year' ? undefined : periodNum
    const result = await previewClosing(periodType, year, num)
    setPreview(result)
  }

  // 執行結轉
  const handleExecute = async () => {
    if (!preview) return

    if (preview.already_closed) {
      await alert('此期間已結轉，無法重複執行', 'error')
      return
    }

    const confirmed = await confirm(
      `確定要執行 ${preview.period.label} 期末結轉嗎？\n\n本期${preview.is_profit ? '盈餘' : '虧損'}：${formatCurrency(Math.abs(preview.net_income))}`,
      {
        title: '確認結轉',
        type: preview.is_profit ? 'info' : 'warning',
      }
    )

    if (!confirmed) return

    const result = await executeClosing(preview)

    if (result.success) {
      await alert(`結轉成功！傳票編號已建立。`, 'success')
      setPreview(null)
      loadHistory()
    } else {
      await alert('結轉失敗，請稍後再試', 'error')
    }
  }

  // 歷史記錄表格欄位
  const historyColumns: Column<ClosingHistory>[] = [
    {
      key: 'period',
      label: '期間',
      width: '150px',
      render: (_, row) => {
        const typeLabel = PERIOD_TYPE_OPTIONS.find(t => t.value === row.period_type)?.label || row.period_type
        return (
          <div>
            <span className="font-medium text-morandi-primary">{typeLabel}</span>
            <div className="text-xs text-morandi-secondary">
              {row.period_start} ~ {row.period_end}
            </div>
          </div>
        )
      },
    },
    {
      key: 'net_income',
      label: '本期損益',
      width: '150px',
      align: 'right',
      render: (_, row) => (
        <CurrencyCell
          amount={row.net_income}
          variant={row.net_income >= 0 ? 'income' : 'expense'}
        />
      ),
    },
    {
      key: 'closed_at',
      label: '結轉時間',
      width: '150px',
      render: (_, row) => row.closed_at ? <DateCell date={row.closed_at} /> : '-',
    },
  ]

  // 預覽項目表格欄位
  const previewItemColumns: Column<ClosingPreviewItem>[] = [
    {
      key: 'account_code',
      label: '科目代碼',
      width: '100px',
      render: (_, row) => (
        <span className="font-mono text-morandi-gold">{row.account_code}</span>
      ),
    },
    {
      key: 'account_name',
      label: '科目名稱',
      width: '200px',
      render: (_, row) => (
        <span className="text-morandi-primary">{row.account_name}</span>
      ),
    },
    {
      key: 'amount',
      label: '金額',
      width: '150px',
      align: 'right',
      render: (_, row) => <CurrencyCell amount={row.amount} />,
    },
    {
      key: 'closing_entry',
      label: '結轉分錄',
      width: '100px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          row.closing_entry === 'debit'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {row.closing_entry === 'debit' ? '借' : '貸'} {formatCurrency(row.amount)}
        </span>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="期末結轉"
        icon={FileCheck}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '會計', href: '/erp-accounting' },
          { label: '期末結轉', href: '/erp-accounting/period-closing' },
        ]}
        actions={
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="gap-2"
          >
            <History size={16} />
            {showHistory ? '返回結轉' : '結轉紀錄'}
          </Button>
        }
      />

      {showHistory ? (
        // 歷史記錄
        <div className="flex-1 overflow-auto p-4">
          <EnhancedTable
            data={history}
            columns={historyColumns}
            loading={loading}
          />
          {history.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={48} className="text-morandi-muted mb-4" />
              <p className="text-morandi-secondary">尚無結轉紀錄</p>
            </div>
          )}
        </div>
      ) : (
        // 結轉操作
        <div className="flex-1 overflow-auto">
          {/* 期間選擇區 */}
          <div className="p-4 bg-card border-b border-border">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-morandi-secondary" />
                <select
                  value={periodType}
                  onChange={(e) => {
                    setPeriodType(e.target.value as PeriodType)
                    setPreview(null)
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  {PERIOD_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(parseInt(e.target.value, 10))
                    setPreview(null)
                  }}
                  className="w-24 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  min={2020}
                  max={2100}
                />
                <span className="text-morandi-secondary">年</span>
              </div>

              {periodType === 'month' && (
                <select
                  value={periodNum}
                  onChange={(e) => {
                    setPeriodNum(parseInt(e.target.value, 10))
                    setPreview(null)
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  {MONTH_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              {periodType === 'quarter' && (
                <select
                  value={periodNum}
                  onChange={(e) => {
                    setPeriodNum(parseInt(e.target.value, 10))
                    setPreview(null)
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  {QUARTER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}

              <Button
                onClick={handlePreview}
                disabled={loading}
                className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Play size={16} />
                預覽結轉
              </Button>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-morandi-red/10 border border-morandi-red/30 rounded-lg text-morandi-red flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* 預覽內容 */}
          {preview && (
            <div className="p-4 space-y-6">
              {/* 已結轉提示 */}
              {preview.already_closed && (
                <div className="p-4 bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg flex items-center gap-2 text-morandi-gold">
                  <CheckCircle size={16} />
                  <span>此期間已完成結轉</span>
                </div>
              )}

              {/* 摘要卡片 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-sm text-morandi-secondary mb-1">營業收入</div>
                  <div className="text-xl font-bold text-morandi-green">
                    {formatCurrency(preview.total_revenue)}
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-sm text-morandi-secondary mb-1">營業成本</div>
                  <div className="text-xl font-bold text-orange-600">
                    {formatCurrency(preview.total_cost)}
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-sm text-morandi-secondary mb-1">營業費用</div>
                  <div className="text-xl font-bold text-morandi-red">
                    {formatCurrency(preview.total_expense)}
                  </div>
                </div>
                <div className={`bg-card p-4 rounded-lg border-2 ${
                  preview.is_profit ? 'border-morandi-green' : 'border-morandi-red'
                }`}>
                  <div className="flex items-center gap-2 text-sm text-morandi-secondary mb-1">
                    {preview.is_profit ? (
                      <TrendingUp size={16} className="text-morandi-green" />
                    ) : (
                      <TrendingDown size={16} className="text-morandi-red" />
                    )}
                    本期{preview.is_profit ? '盈餘' : '虧損'}
                  </div>
                  <div className={`text-xl font-bold ${
                    preview.is_profit ? 'text-morandi-green' : 'text-morandi-red'
                  }`}>
                    {formatCurrency(Math.abs(preview.net_income))}
                  </div>
                </div>
              </div>

              {/* 結轉分錄預覽 */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 bg-morandi-container/30 border-b border-border">
                  <h3 className="font-medium text-morandi-primary">結轉分錄預覽</h3>
                  <p className="text-sm text-morandi-secondary mt-1">
                    以下分錄將在確認後自動產生
                  </p>
                </div>

                {/* 收入科目 */}
                {preview.revenue_items.length > 0 && (
                  <div className="border-b border-border">
                    <div className="p-3 bg-green-50">
                      <h4 className="font-medium text-green-800 flex items-center gap-2">
                        <ArrowRight size={16} />
                        收入科目（借方結清）
                      </h4>
                    </div>
                    <EnhancedTable
                      data={preview.revenue_items}
                      columns={previewItemColumns}
                    />
                  </div>
                )}

                {/* 成本科目 */}
                {preview.cost_items.length > 0 && (
                  <div className="border-b border-border">
                    <div className="p-3 bg-orange-50">
                      <h4 className="font-medium text-orange-800 flex items-center gap-2">
                        <ArrowRight size={16} />
                        成本科目（貸方結清）
                      </h4>
                    </div>
                    <EnhancedTable
                      data={preview.cost_items}
                      columns={previewItemColumns}
                    />
                  </div>
                )}

                {/* 費用科目 */}
                {preview.expense_items.length > 0 && (
                  <div className="border-b border-border">
                    <div className="p-3 bg-red-50">
                      <h4 className="font-medium text-red-800 flex items-center gap-2">
                        <ArrowRight size={16} />
                        費用科目（貸方結清）
                      </h4>
                    </div>
                    <EnhancedTable
                      data={preview.expense_items}
                      columns={previewItemColumns}
                    />
                  </div>
                )}

                {/* 無資料 */}
                {preview.revenue_items.length === 0 &&
                  preview.cost_items.length === 0 &&
                  preview.expense_items.length === 0 && (
                    <div className="p-8 text-center text-morandi-secondary">
                      此期間無損益科目餘額
                    </div>
                  )}
              </div>

              {/* 執行按鈕 */}
              {!preview.already_closed && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleExecute}
                    disabled={loading || (
                      preview.revenue_items.length === 0 &&
                      preview.cost_items.length === 0 &&
                      preview.expense_items.length === 0
                    )}
                    className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    <CheckCircle size={16} />
                    確認結轉
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 空狀態 */}
          {!preview && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCheck size={48} className="text-morandi-muted mb-4" />
              <p className="text-morandi-secondary">選擇期間並點擊「預覽結轉」</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
