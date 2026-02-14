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
import { UNPAID_ORDERS_LABELS } from '../../constants/labels'

interface UnpaidOrder {
  id: string
  code: string
  order_number: string
  contact_person: string
  tour_code: string
  tour_name: string
  departure_date: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  payment_status: string
  status: string
  days_since_departure: number
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unpaid: { label: '未付款', variant: 'destructive' },
  partial: { label: '部分付款', variant: 'secondary' },
  pending_deposit: { label: '待收訂金', variant: 'outline' },
}

export default function UnpaidOrdersPage() {
  const [data, setData] = useState<UnpaidOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const workspace_id = useAuthStore((s) => s.user?.workspace_id)

  useEffect(() => {
    if (!workspace_id) return
    fetchData()
  }, [workspace_id])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, code, order_number, contact_person,
          total_amount, paid_amount, remaining_amount,
          payment_status, status,
          tours!inner(code, name, departure_date)
        `)
        .eq('workspace_id', workspace_id!)
        .in('payment_status', ['unpaid', 'partial', 'pending_deposit'])
        .eq('is_active', true)
        .not('status', 'in', '("cancelled","expired")')
        .order('created_at', { ascending: false })

      if (error) throw error

      const today = new Date()
      const mapped: UnpaidOrder[] = (orders ?? []).map((o) => {
        const tour = Array.isArray(o.tours) ? o.tours[0] : o.tours
        const depDate = tour?.departure_date ? new Date(tour.departure_date) : null
        const daysSince = depDate ? Math.floor((today.getTime() - depDate.getTime()) / 86400000) : 0
        return {
          id: o.id,
          code: o.code,
          order_number: o.order_number ?? o.code,
          contact_person: o.contact_person,
          tour_code: tour?.code ?? '',
          tour_name: tour?.name ?? '',
          departure_date: tour?.departure_date ?? '',
          total_amount: o.total_amount ?? 0,
          paid_amount: o.paid_amount ?? 0,
          remaining_amount: o.remaining_amount ?? 0,
          payment_status: o.payment_status ?? 'unpaid',
          status: o.status ?? '',
          days_since_departure: daysSince,
        }
      })

      setData(mapped)
    } catch (err) {
      logger.error('Failed to fetch unpaid orders:', err)
      toast.error('載入未收款資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return data
    if (filter === 'overdue') return data.filter((d) => d.days_since_departure > 0)
    return data.filter((d) => d.payment_status === filter)
  }, [data, filter])

  const totalRemaining = useMemo(
    () => filtered.reduce((sum, d) => sum + d.remaining_amount, 0),
    [filtered]
  )

  const columns: TableColumn<UnpaidOrder>[] = [
    { key: 'order_number', label: '訂單編號', sortable: true },
    { key: 'contact_person', label: '聯絡人', sortable: true },
    { key: 'tour_code', label: '團號', sortable: true },
    { key: 'departure_date', label: '出發日', sortable: true, render: (value) => <DateCell date={value as string} /> },
    {
      key: 'payment_status',
      label: '付款狀態',
      sortable: true,
      render: (_value, row) => {
        const info = PAYMENT_STATUS_MAP[row.payment_status]
        return info ? <Badge variant={info.variant}>{info.label}</Badge> : <span>{row.payment_status}</span>
      },
    },
    { key: 'total_amount', label: '訂單金額', sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} /> },
    { key: 'paid_amount', label: '已收金額', sortable: true, align: 'right', render: (value) => <CurrencyCell amount={Number(value)} /> },
    {
      key: 'remaining_amount',
      label: '未收金額',
      sortable: true,
      align: 'right',
      render: (_value, row) => (
        <span className={row.days_since_departure > 0 ? 'text-status-danger font-semibold' : ''}>
          <CurrencyCell amount={row.remaining_amount} />
        </span>
      ),
    },
    {
      key: 'days_since_departure',
      label: '出發後天數',
      sortable: true,
      align: 'center',
      render: (_value, row) => {
        if (row.days_since_departure > 0) {
          return <Badge variant="destructive">{row.days_since_departure}{UNPAID_ORDERS_LABELS.DAYS_SUFFIX}</Badge>
        }
        if (row.days_since_departure === 0) return <span className="text-muted-foreground">{UNPAID_ORDERS_LABELS.TODAY}</span>
        return <span className="text-muted-foreground">{UNPAID_ORDERS_LABELS.NOT_DEPARTED}</span>
      },
    },
  ]

  return (
    <ListPageLayout
      title={UNPAID_ORDERS_LABELS.LABEL_1474}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '財務', href: '/finance' },
        { label: '報表管理', href: '/finance/reports' },
        { label: '未收款報表', href: '/finance/reports/unpaid-orders' },
      ]}
      headerActions={
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {UNPAID_ORDERS_LABELS.TOTAL_REMAINING_PREFIX}<span className="font-semibold text-foreground">NT${totalRemaining.toLocaleString()}</span>
            （{filtered.length} 筆）
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{UNPAID_ORDERS_LABELS.ALL}</SelectItem>
              <SelectItem value="overdue">{UNPAID_ORDERS_LABELS.OVERDUE}</SelectItem>
              <SelectItem value="unpaid">{UNPAID_ORDERS_LABELS.UNPAID}</SelectItem>
              <SelectItem value="partial">{UNPAID_ORDERS_LABELS.PARTIAL}</SelectItem>
              <SelectItem value="pending_deposit">{UNPAID_ORDERS_LABELS.PENDING_DEPOSIT}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      loading={loading}
      columns={columns}
      data={filtered}
      searchPlaceholder="搜尋訂單編號、聯絡人、團號..."
    />
  )
}
