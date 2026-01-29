/**
 * 薪資管理頁面
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  DollarSign,
  Calendar,
  Plus,
  Calculator,
  Check,
  X,
  Eye,
  Printer,
  CreditCard,
  Users,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { CurrencyCell, ActionCell, StatusCell } from '@/components/table-cells'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DIALOG_SIZES } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import {
  usePayroll,
  type PayrollPeriod,
  type PayrollRecord,
  PAYROLL_PERIOD_STATUS_LABELS,
  PAYROLL_PERIOD_STATUS_COLORS,
} from '../../hooks/usePayroll'

export function PayrollManagementPage() {
  const {
    loading,
    periods,
    records,
    fetchPeriods,
    createPeriod,
    fetchRecords,
    calculatePayroll,
    updateRecord,
    confirmPeriod,
    markAsPaid,
    calculateSummary,
  } = usePayroll()

  // 年度篩選
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // 選中的期間
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null)

  // Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRecordsDialog, setShowRecordsDialog] = useState(false)
  const [showPayslipDialog, setShowPayslipDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

  // 建立表單
  const [formYear, setFormYear] = useState(currentYear)
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1)

  // 載入期間
  useEffect(() => {
    fetchPeriods(selectedYear)
  }, [fetchPeriods, selectedYear])

  // 期間表格欄位
  const periodColumns: Column<PayrollPeriod>[] = [
    {
      key: 'period',
      label: '期間',
      width: '150px',
      render: (_, row) => (
        <span className="font-medium text-morandi-primary">
          {row.year}年{row.month}月
        </span>
      ),
    },
    {
      key: 'date_range',
      label: '日期範圍',
      width: '200px',
      render: (_, row) => (
        <span className="text-morandi-secondary">
          {row.start_date} ~ {row.end_date}
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${PAYROLL_PERIOD_STATUS_COLORS[row.status]}`}>
          {PAYROLL_PERIOD_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'confirmed_at',
      label: '確認時間',
      width: '150px',
      render: (_, row) => (
        <span className="text-sm text-morandi-secondary">
          {row.confirmed_at ? new Date(row.confirmed_at).toLocaleString('zh-TW') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '200px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewRecords(row)}
            className="gap-1"
          >
            <Eye size={14} />
            查看
          </Button>
          {row.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCalculate(row)}
              className="gap-1"
            >
              <Calculator size={14} />
              計算
            </Button>
          )}
          {row.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => handleConfirm(row)}
              className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Check size={14} />
              確認
            </Button>
          )}
          {row.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => handleMarkPaid(row)}
              className="gap-1 bg-morandi-green hover:opacity-80 text-white"
            >
              <CreditCard size={14} />
              發放
            </Button>
          )}
        </div>
      ),
    },
  ]

  // 薪資紀錄表格欄位
  const recordColumns: Column<PayrollRecord>[] = [
    {
      key: 'employee_name',
      label: '員工',
      width: '120px',
      render: (_, row) => (
        <span className="font-medium text-morandi-primary">{row.employee_name}</span>
      ),
    },
    {
      key: 'base_salary',
      label: '底薪',
      width: '100px',
      render: (_, row) => <CurrencyCell amount={row.base_salary} />,
    },
    {
      key: 'overtime_pay',
      label: '加班費',
      width: '100px',
      render: (_, row) => <CurrencyCell amount={row.overtime_pay} />,
    },
    {
      key: 'bonus',
      label: '獎金',
      width: '100px',
      render: (_, row) => <CurrencyCell amount={row.bonus} />,
    },
    {
      key: 'deductions',
      label: '扣款',
      width: '100px',
      render: (_, row) => (
        <span className="text-morandi-red">
          -{(row.unpaid_leave_deduction + row.other_deductions).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'gross_salary',
      label: '應發',
      width: '120px',
      render: (_, row) => <CurrencyCell amount={row.gross_salary} />,
    },
    {
      key: 'net_salary',
      label: '實發',
      width: '120px',
      render: (_, row) => <CurrencyCell amount={row.net_salary} variant="income" />,
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_, row) => (
        <ActionCell
          actions={[
            {
              icon: Printer,
              label: '薪資單',
              onClick: () => handlePrintPayslip(row),
            },
          ]}
        />
      ),
    },
  ]

  // 處理函式
  const handleCreate = async () => {
    const period = await createPeriod(formYear, formMonth)
    if (period) {
      await alert('薪資期間已建立', 'success')
      setShowCreateDialog(false)
    }
  }

  const handleViewRecords = async (period: PayrollPeriod) => {
    setSelectedPeriod(period)
    await fetchRecords(period.id)
    setShowRecordsDialog(true)
  }

  const handleCalculate = async (period: PayrollPeriod) => {
    const confirmed = await confirm(
      `確定要計算 ${period.year}年${period.month}月 的薪資嗎？此操作會覆蓋現有的薪資紀錄。`,
      { title: '計算薪資', type: 'warning' }
    )
    if (!confirmed) return

    const success = await calculatePayroll(period.id)
    if (success) {
      await alert('薪資計算完成', 'success')
      await handleViewRecords(period)
    }
  }

  const handleConfirm = async (period: PayrollPeriod) => {
    const confirmed = await confirm(
      `確定要確認 ${period.year}年${period.month}月 的薪資嗎？確認後將無法修改。`,
      { title: '確認薪資', type: 'warning' }
    )
    if (!confirmed) return

    const success = await confirmPeriod(period.id)
    if (success) {
      await alert('薪資已確認', 'success')
    }
  }

  const handleMarkPaid = async (period: PayrollPeriod) => {
    const confirmed = await confirm(
      `確定要標記 ${period.year}年${period.month}月 的薪資為已發放嗎？`,
      { title: '標記發放', type: 'info' }
    )
    if (!confirmed) return

    const success = await markAsPaid(period.id)
    if (success) {
      await alert('已標記為發放', 'success')
    }
  }

  const handlePrintPayslip = (record: PayrollRecord) => {
    setSelectedRecord(record)
    setShowPayslipDialog(true)
  }

  // 統計
  const summary = calculateSummary(records)

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="薪資管理"
        icon={DollarSign}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '人資', href: '/hr' },
          { label: '薪資管理', href: '/hr/payroll' },
        ]}
        actions={
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} />
            建立期間
          </Button>
        }
      />

      {/* 年度篩選 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                <option key={year} value={year}>{year} 年</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto p-4">
        <EnhancedTable
          data={periods}
          columns={periodColumns}
          loading={loading}
        />

        {periods.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">尚無薪資期間</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={16} />
              建立期間
            </Button>
          </div>
        )}
      </div>

      {/* 建立期間 Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent level={1} className={DIALOG_SIZES.sm}>
          <DialogHeader>
            <DialogTitle>建立薪資期間</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>年度</Label>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>月份</Label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month} 月</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                <X size={16} className="mr-2" />
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plus size={16} className="mr-2" />
                建立
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 薪資紀錄 Dialog */}
      <Dialog open={showRecordsDialog} onOpenChange={setShowRecordsDialog}>
        <DialogContent level={1} className={DIALOG_SIZES['2xl']}>
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod ? `${selectedPeriod.year}年${selectedPeriod.month}月 薪資明細` : '薪資明細'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* 統計區 */}
            <div className="grid grid-cols-5 gap-4 mb-4 p-4 bg-morandi-container/30 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-morandi-secondary">員工數</div>
                <div className="text-xl font-bold text-morandi-primary flex items-center justify-center gap-1">
                  <Users size={16} />
                  {summary.totalEmployees}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-morandi-secondary">應發總額</div>
                <div className="text-xl font-bold text-morandi-primary">
                  {summary.totalGrossSalary.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-morandi-secondary">實發總額</div>
                <div className="text-xl font-bold text-morandi-green">
                  {summary.totalNetSalary.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-morandi-secondary">加班費</div>
                <div className="text-xl font-bold text-morandi-gold">
                  {summary.totalOvertimePay.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-morandi-secondary">扣款</div>
                <div className="text-xl font-bold text-morandi-red">
                  {summary.totalDeductions.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 表格 */}
            <div className="max-h-[400px] overflow-auto">
              <EnhancedTable
                data={records}
                columns={recordColumns}
                loading={loading}
              />
            </div>

            {records.length === 0 && !loading && (
              <div className="text-center py-8 text-morandi-secondary">
                尚無薪資紀錄，請先執行薪資計算
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 薪資單 Dialog */}
      <Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
        <DialogContent level={1} className={DIALOG_SIZES.md}>
          <DialogHeader>
            <DialogTitle>薪資單</DialogTitle>
          </DialogHeader>
          {selectedRecord && selectedPeriod && (
            <PayslipContent record={selectedRecord} period={selectedPeriod} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 薪資單內容組件
function PayslipContent({ record, period }: { record: PayrollRecord; period: PayrollPeriod }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>薪資單 - ${record.employee_name}</title>
            <style>
              body { font-family: 'Microsoft JhengHei', sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .header { text-align: center; margin-bottom: 20px; }
              .total { font-weight: bold; background-color: #fdf6e9; }
              .amount { text-align: right; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  return (
    <div className="py-4">
      <div ref={printRef}>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">薪資單</h2>
          <p className="text-morandi-secondary">{period.year}年{period.month}月</p>
        </div>

        <div className="mb-4 p-3 bg-morandi-container/30 rounded-lg">
          <p><strong>員工姓名：</strong>{record.employee_name}</p>
          <p><strong>薪資期間：</strong>{period.start_date} ~ {period.end_date}</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-morandi-container/40">
              <th className="border border-border p-2 text-left">項目</th>
              <th className="border border-border p-2 text-right w-32">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border p-2">底薪</td>
              <td className="border border-border p-2 text-right">{record.base_salary.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2">加班費（{record.overtime_hours.toFixed(1)} 小時）</td>
              <td className="border border-border p-2 text-right">{record.overtime_pay.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2">獎金</td>
              <td className="border border-border p-2 text-right">{record.bonus.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2">津貼</td>
              <td className="border border-border p-2 text-right">{record.allowances.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2">其他加項</td>
              <td className="border border-border p-2 text-right">{record.other_additions.toLocaleString()}</td>
            </tr>
            <tr className="bg-morandi-container/20">
              <td className="border border-border p-2 font-medium">應發薪資</td>
              <td className="border border-border p-2 text-right font-medium">{record.gross_salary.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2 text-morandi-red">無薪假扣款（{record.unpaid_leave_days} 天）</td>
              <td className="border border-border p-2 text-right text-morandi-red">-{record.unpaid_leave_deduction.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-border p-2 text-morandi-red">其他扣款</td>
              <td className="border border-border p-2 text-right text-morandi-red">-{record.other_deductions.toLocaleString()}</td>
            </tr>
            <tr className="bg-morandi-gold/10">
              <td className="border border-border p-2 font-bold text-lg">實發薪資</td>
              <td className="border border-border p-2 text-right font-bold text-lg text-morandi-green">{record.net_salary.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-sm text-morandi-secondary">
          <p>出勤天數：{record.actual_work_days} / {record.work_days} 天</p>
          <p>有薪假天數：{record.paid_leave_days} 天</p>
          <p>無薪假天數：{record.unpaid_leave_days} 天</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
        <Button
          onClick={handlePrint}
          className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Printer size={16} />
          列印
        </Button>
      </div>
    </div>
  )
}
