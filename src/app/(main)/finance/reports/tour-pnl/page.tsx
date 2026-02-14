'use client'

import { useState, useEffect, useMemo } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { TableColumn } from '@/components/ui/enhanced-table'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { useAuthStore } from '@/stores/auth-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TOUR_PNL_LABELS } from '../../constants/labels'

interface TourPnL {
  id: string
  code: string
  name: string
  departure_date: string
  return_date: string
  status: string
  max_participants: number
  total_revenue: number
  total_cost: number
  profit: number
  margin: number
  closing_date: string | null
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'outline' },
  confirmed: { label: '已確認', variant: 'secondary' },
  operating: { label: '出團中', variant: 'default' },
  completed: { label: '已完成', variant: 'default' },
  closed: { label: '已結案', variant: 'secondary' },
  cancelled: { label: '已取消', variant: 'destructive' },
}

export default function TourPnLPage() {
  const [data, setData] = useState<TourPnL[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()))
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const workspace_id = useAuthStore((s) => s.user?.workspace_id)

  useEffect(() => {
    if (!workspace_id) return
    fetchData()
  }, [workspace_id, yearFilter])

  async function fetchData() {
    try {
      setLoading(true)
      const yearStart = `${yearFilter}-01-01`
      const yearEnd = `${yearFilter}-12-31`

      const { data: tours, error } = await supabase
        .from('tours')
        .select(`
          id, code, name, departure_date, return_date, status,
          max_participants, total_revenue, total_cost, profit, closing_date
        `)
        .eq('workspace_id', workspace_id!)
        .gte('departure_date', yearStart)
        .lte('departure_date', yearEnd)
        .neq('status', 'cancelled')
        .order('departure_date', { ascending: false })

      if (error) throw error

      const mapped: TourPnL[] = (tours ?? []).map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        departure_date: t.departure_date,
        return_date: t.return_date,
        status: t.status ?? 'draft',
        max_participants: t.max_participants ?? 0,
        total_revenue: t.total_revenue ?? 0,
        total_cost: t.total_cost ?? 0,
        profit: t.profit ?? 0,
        margin: t.total_revenue ? Math.round((t.profit / t.total_revenue) * 100) : 0,
        closing_date: t.closing_date,
      }))

      setData(mapped)
    } catch (err) {
      logger.error('Failed to fetch tour P&L:', err)
      toast.error('載入團收支資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter((d) => d.status === statusFilter)
  }, [data, statusFilter])

  const summary = useMemo(() => {
    const totalRevenue = filtered.reduce((s, d) => s + d.total_revenue, 0)
    const totalCost = filtered.reduce((s, d) => s + d.total_cost, 0)
    const totalProfit = filtered.reduce((s, d) => s + d.profit, 0)
    const avgMargin = totalRevenue ? Math.round((totalProfit / totalRevenue) * 100) : 0
    return { totalRevenue, totalCost, totalProfit, avgMargin, count: filtered.length }
  }, [filtered])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))

  const columns: TableColumn<TourPnL>[] = [
    { key: 'code', label: '團號', sortable: true },
    { key: 'name', label: '團名', sortable: true },
    { key: 'departure_date', label: '出發日', sortable: true, render: (value) => <DateCell date={value as string} /> },
    { key: 'max_participants', label: '人數', sortable: true, align: 'center' },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (_value, row) => {
        const info = STATUS_MAP[row.status]
        return info ? <Badge variant={info.variant}>{info.label}</Badge> : <span>{row.status}</span>
      },
    },
    { key: 'total_revenue', label: '收入', sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} variant="income" /> },
    { key: 'total_cost', label: '成本', sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} variant="expense" /> },
    {
      key: 'profit',
      label: '毛利',
      sortable: true,
      align: 'right',
      render: (value) => {
        const n = Number(value)
        return (
          <span className={n < 0 ? 'text-status-danger font-semibold' : 'text-status-success font-semibold'}>
            <CurrencyCell amount={n} />
          </span>
        )
      },
    },
    {
      key: 'margin',
      label: '毛利率',
      sortable: true,
      align: 'center',
      render: (value) => {
        const n = Number(value)
        return (
          <span className={n < 0 ? 'text-status-danger' : n < 10 ? 'text-status-warning' : 'text-status-success'}>
            {n}%
          </span>
        )
      },
    },
  ]

  return (
    <ListPageLayout
      title={TOUR_PNL_LABELS.TOTAL_2832}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '財務', href: '/finance' },
        { label: '報表管理', href: '/finance/reports' },
        { label: '團收支總覽', href: '/finance/reports/tour-pnl' },
      ]}
      headerActions={
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 text-sm">
            <span className="text-muted-foreground">{TOUR_PNL_LABELS.INCOME}</span>
            <span className="font-semibold">NT${summary.totalRevenue.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2">{TOUR_PNL_LABELS.COST}</span>
            <span className="font-semibold">NT${summary.totalCost.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2">{TOUR_PNL_LABELS.GROSS_PROFIT}</span>
            <span className={`font-semibold ${summary.totalProfit < 0 ? 'text-status-danger' : 'text-status-success'}`}>
              NT${summary.totalProfit.toLocaleString()} ({summary.avgMargin}%)
            </span>
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{TOUR_PNL_LABELS.ALL_STATUS}</SelectItem>
              <SelectItem value="confirmed">{TOUR_PNL_LABELS.CONFIRMED}</SelectItem>
              <SelectItem value="operating">{TOUR_PNL_LABELS.OPERATING}</SelectItem>
              <SelectItem value="completed">{TOUR_PNL_LABELS.COMPLETED}</SelectItem>
              <SelectItem value="closed">{TOUR_PNL_LABELS.CLOSED}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      loading={loading}
      columns={columns}
      data={filtered}
      searchPlaceholder="搜尋團號、團名..."
    />
  )
}
