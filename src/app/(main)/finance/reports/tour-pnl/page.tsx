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
  draft: { label: TOUR_PNL_LABELS.STATUS_DRAFT, variant: 'outline' },
  confirmed: { label: TOUR_PNL_LABELS.STATUS_CONFIRMED, variant: 'secondary' },
  operating: { label: TOUR_PNL_LABELS.STATUS_OPERATING, variant: 'default' },
  completed: { label: TOUR_PNL_LABELS.STATUS_COMPLETED, variant: 'default' },
  closed: { label: TOUR_PNL_LABELS.STATUS_CLOSED, variant: 'secondary' },
  cancelled: { label: TOUR_PNL_LABELS.STATUS_CANCELLED, variant: 'destructive' },
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
      toast.error(TOUR_PNL_LABELS.TOAST_LOAD_FAILED)
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
    { key: 'code', label: TOUR_PNL_LABELS.COL_TOUR_CODE, sortable: true },
    { key: 'name', label: TOUR_PNL_LABELS.COL_TOUR_NAME, sortable: true },
    { key: 'departure_date', label: TOUR_PNL_LABELS.COL_DEPARTURE_DATE, sortable: true, render: (value) => <DateCell date={value as string} /> },
    { key: 'max_participants', label: TOUR_PNL_LABELS.COL_PARTICIPANTS, sortable: true, align: 'center' },
    {
      key: 'status',
      label: TOUR_PNL_LABELS.COL_STATUS,
      sortable: true,
      render: (_value, row) => {
        const info = STATUS_MAP[row.status]
        return info ? <Badge variant={info.variant}>{info.label}</Badge> : <span>{row.status}</span>
      },
    },
    { key: 'total_revenue', label: TOUR_PNL_LABELS.COL_REVENUE, sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} variant="income" /> },
    { key: 'total_cost', label: TOUR_PNL_LABELS.COL_COST, sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} variant="expense" /> },
    {
      key: 'profit',
      label: TOUR_PNL_LABELS.COL_PROFIT,
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
      label: TOUR_PNL_LABELS.COL_MARGIN,
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
        { label: TOUR_PNL_LABELS.BREADCRUMB_HOME, href: '/' },
        { label: TOUR_PNL_LABELS.BREADCRUMB_FINANCE, href: '/finance' },
        { label: TOUR_PNL_LABELS.BREADCRUMB_REPORTS, href: '/finance/reports' },
        { label: TOUR_PNL_LABELS.TOTAL_2832, href: '/finance/reports/tour-pnl' },
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
      searchPlaceholder={TOUR_PNL_LABELS.SEARCH_PLACEHOLDER}
    />
  )
}
