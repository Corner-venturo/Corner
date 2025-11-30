'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Button } from '@/components/ui/button'
import { FileDown, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import * as XLSX from 'xlsx'

interface TourClosingReport {
  id: string
  code: string
  name: string
  departure_date: string
  return_date: string
  closing_date: string
  total_revenue: number
  total_cost: number
  gross_profit: number
  member_count: number
  misc_expense: number
  tax: number
  net_profit: number
  sales_bonuses: Array<{ employee_name: string; percentage: number; amount: number }>
  op_bonuses: Array<{ employee_name: string; percentage: number; amount: number }>
  team_bonus: number
}

export default function TourClosingReportPage() {
  const [reports, setReports] = useState<TourClosingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    loadClosedTours()
  }, [])

  const loadClosedTours = async () => {
    try {
      setLoading(true)

      // 取得當前 workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single()

      if (!workspace) {
        toast.error('找不到工作空間')
        return
      }

      // 取得所有已結團的旅遊團（加上 workspace_id 過濾）
      const { data: tours, error } = await supabase
        .from('tours')
        .select('*')
        .eq('workspace_id', workspace.id)
        .eq('archived', true)
        .order('return_date', { ascending: false })

      if (error) throw error

      // 為每個團體計算財務資料
      const reportsData = await Promise.all(
        (tours || []).map(async tour => {
          // 1. 計算總收入
          const { data: orders } = await supabase
            .from('orders')
            .select('id, paid_amount')
            .eq('tour_id', tour.id)

          const totalRevenue = orders?.reduce((sum: number, o: { paid_amount?: number }) => sum + (o.paid_amount || 0), 0) || 0

          // 2. 計算總成本（排除 bonus）
          const orderIds = orders?.map(o => o.id) || []
          let totalCost = 0

          if (orderIds.length > 0) {
            const { data: paymentRequests } = await supabase
              .from('payment_requests')
              .select('amount')
              .in('order_id', orderIds)
              .eq('status', 'paid')
              .neq('supplier_type', 'bonus')

            totalCost = paymentRequests?.reduce((sum: number, pr: { amount?: number }) => sum + (pr.amount || 0), 0) || 0
          }

          // 3. 計算團員人數
          let memberCount = 0
          if (orderIds.length > 0) {
            const { data: members } = await supabase
              .from('order_members')
              .select('id')
              .in('order_id', orderIds)

            memberCount = members?.length || 0
          }

          // 4. 計算利潤
          const grossProfit = totalRevenue - totalCost
          const miscExpense = memberCount * 10
          const tax = Math.round((grossProfit - miscExpense) * 0.12)
          const netProfit = grossProfit - miscExpense - tax

          // 5. 取得獎金資料
          let salesBonuses: Array<{ employee_name: string; percentage: number; amount: number }> = []
          let opBonuses: Array<{ employee_name: string; percentage: number; amount: number }> = []
          let teamBonus = 0

          if (orderIds.length > 0) {
            const { data: bonusRequests } = await supabase
              .from('payment_requests')
              .select('supplier_name, amount, notes')
              .in('order_id', orderIds)
              .eq('supplier_type', 'bonus')

            bonusRequests?.forEach(bonus => {
              // 從 notes 解析百分比（如果有）
              const percentageMatch = bonus.notes?.match(/(\d+\.?\d*)%/)
              const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0

              if (bonus.supplier_name === '業務業績') {
                salesBonuses.push({
                  employee_name: bonus.notes?.replace(/業務業績\s*\d+\.?\d*%/, '').trim() || '未知',
                  percentage,
                  amount: bonus.amount || 0,
                })
              } else if (bonus.supplier_name === 'OP 獎金') {
                opBonuses.push({
                  employee_name: bonus.notes?.replace(/OP 獎金\s*\d+\.?\d*%/, '').trim() || '未知',
                  percentage,
                  amount: bonus.amount || 0,
                })
              } else if (bonus.supplier_name === '團體獎金') {
                teamBonus = bonus.amount || 0
              }
            })
          }

          return {
            id: tour.id,
            code: tour.code,
            name: tour.name,
            departure_date: tour.departure_date,
            return_date: tour.return_date,
            closing_date: tour.contract_archived_date || tour.return_date, // Use contract_archived_date as closing_date
            total_revenue: totalRevenue,
            total_cost: totalCost,
            gross_profit: grossProfit,
            member_count: memberCount,
            misc_expense: miscExpense,
            tax,
            net_profit: netProfit,
            sales_bonuses: salesBonuses,
            op_bonuses: opBonuses,
            team_bonus: teamBonus,
          }
        })
      )

      setReports(reportsData)
    } catch (error) {
      logger.error('載入結團報表失敗:', error)
      toast.error('載入報表失敗')
    } finally {
      setLoading(false)
    }
  }

  // 依月份篩選
  const filteredReports = useMemo(() => {
    if (!selectedMonth) return reports

    return reports.filter(report => {
      const closingMonth = report.closing_date?.substring(0, 7) // YYYY-MM
      return closingMonth === selectedMonth
    })
  }, [reports, selectedMonth])

  // 產出 Excel 報表
  const exportToExcel = (month?: string) => {
    const dataToExport = month
      ? reports.filter(r => r.closing_date?.substring(0, 7) === month)
      : filteredReports

    if (dataToExport.length === 0) {
      toast.error('沒有資料可匯出')
      return
    }

    // 準備 Excel 資料
    const excelData = dataToExport.map(report => ({
      團號: report.code,
      團名: report.name,
      出發日: report.departure_date,
      返回日: report.return_date,
      結團日: report.closing_date,
      業務: report.sales_bonuses.map(s => `${s.employee_name}(${s.percentage}%)`).join(', ') || '-',
      OP: report.op_bonuses.map(o => `${o.employee_name}(${o.percentage}%)`).join(', ') || '-',
      訂單金額: report.total_revenue,
      成本: report.total_cost,
      '行政費(人數×10)': report.misc_expense,
      '扣稅12%': report.tax,
      團體獎金: report.team_bonus,
      業務獎金: report.sales_bonuses.reduce((sum: number, s: { amount: number }) => sum + s.amount, 0),
      'OP獎金': report.op_bonuses.reduce((sum: number, o: { amount: number }) => sum + o.amount, 0),
      毛利: report.gross_profit,
      淨利: report.net_profit,
    }))

    // 建立工作表
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 設定欄位寬度
    ws['!cols'] = [
      { wch: 12 }, // 團號
      { wch: 30 }, // 團名
      { wch: 12 }, // 出發日
      { wch: 12 }, // 返回日
      { wch: 12 }, // 結團日
      { wch: 20 }, // 業務
      { wch: 20 }, // OP
      { wch: 12 }, // 訂單金額
      { wch: 12 }, // 成本
      { wch: 15 }, // 行政費
      { wch: 12 }, // 扣稅
      { wch: 12 }, // 團體獎金
      { wch: 12 }, // 業務獎金
      { wch: 12 }, // OP獎金
      { wch: 12 }, // 毛利
      { wch: 12 }, // 淨利
    ]

    // 建立工作簿
    const wb = XLSX.utils.book_new()
    const monthLabel = month || selectedMonth || '全部'
    XLSX.utils.book_append_sheet(wb, ws, monthLabel)

    // 匯出檔案
    const fileName = `結團報表_${monthLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)

    toast.success('報表已匯出')
  }

  // 取得可用的月份列表
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    reports.forEach(report => {
      if (report.closing_date) {
        months.add(report.closing_date.substring(0, 7))
      }
    })
    return Array.from(months).sort().reverse()
  }, [reports])

  const columns: TableColumn<TourClosingReport>[] = [
    {
      key: 'code',
      label: '團號',
      sortable: true,
      render: (value) => <span className="font-mono">{String(value || "")}</span>,
    },
    {
      key: 'name',
      label: '團名',
      sortable: true,
    },
    {
      key: 'departure_date',
      label: '出發日',
      sortable: true,
      render: (value: unknown) => <DateCell date={value as string} />,
    },
    {
      key: 'closing_date',
      label: '結團日',
      sortable: true,
      render: (value: unknown) => <DateCell date={value as string} />,
    },
    {
      key: 'total_revenue',
      label: '收入',
      sortable: true,
      render: (value: unknown) => <span className="text-morandi-green">NT$ {Number(value).toLocaleString()}</span>,
    },
    {
      key: 'total_cost',
      label: '成本',
      sortable: true,
      render: (value: unknown) => <span className="text-morandi-red">NT$ {Number(value).toLocaleString()}</span>,
    },
    {
      key: 'net_profit',
      label: '淨利',
      sortable: true,
      render: (value: unknown) => (
        <span className={Number(value) >= 0 ? 'text-morandi-primary font-bold' : 'text-morandi-red font-bold'}>
          NT$ {Number(value).toLocaleString()}
        </span>
      ),
    },
  ]

  const renderActions = (report: TourClosingReport) => (
    <ActionCell
      actions={[
        {
          icon: FileDown,
          label: '匯出此團',
          onClick: () => {
            const month = report.closing_date?.substring(0, 7)
            if (month) {
              exportToExcel(month)
            }
          },
        },
      ]}
    />
  )

  return (
    <ListPageLayout
      title="結團報表"
      icon={FileText}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '報表', href: '/reports' },
        { label: '結團報表', href: '/reports/tour-closing' },
      ]}
      data={filteredReports}
      columns={columns}
      searchFields={['code', 'name']}
      searchPlaceholder="搜尋團號或團名..."
      renderActions={renderActions}
      bordered={true}
      headerActions={
        <div className="flex gap-3 items-center">
          {availableMonths.length > 0 && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">全部月份</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => exportToExcel()}
            className="bg-morandi-green hover:bg-morandi-green/90 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            匯出 Excel
          </Button>
        </div>
      }
    />
  )
}
