'use client'

import React, { useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table'
import { useOrderStore } from '@/stores'
import { ArrowLeft, CreditCard, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const orderStore = useOrderStore()

  const paymentStore: any = null

  // 等待 store 載入
  const orders = orderStore?.orders || []
  const paymentRequests = paymentStore?.payment_requests || []

  const order = orders.find((o: any) => o.id === orderId)
  // 找出此訂單相關的請款單
  const orderPayments = paymentRequests.filter((p: any) => p.order_id === orderId)

  const _getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      已確認: 'bg-morandi-green text-white',
      待確認: 'bg-morandi-gold text-white',
      已完成: 'bg-morandi-container text-morandi-primary',
    }
    return badges[status] || 'bg-morandi-container text-morandi-secondary'
  }

  const _getPaymentTypeIcon = () => {
    // PaymentRequest 都是請款類型
    return <TrendingDown size={16} className="text-morandi-red" />
  }

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(
    () => [
      {
        key: 'request_number',
        label: '請款單號',
        sortable: true,
        filterable: true,
        render: value => <span className="text-morandi-primary font-medium">{value}</span>,
      },
      {
        key: 'request_date',
        label: '請款日期',
        sortable: true,
        filterable: true,
        filterType: 'date',
        render: value => (
          <span className="text-morandi-primary">{new Date(value).toLocaleDateString()}</span>
        ),
      },
      {
        key: 'tour_name',
        label: '團體名稱',
        sortable: true,
        filterable: true,
        render: value => <span className="text-morandi-primary">{value}</span>,
      },
      {
        key: 'total_amount',
        label: '請款金額',
        sortable: true,
        filterable: true,
        filterType: 'number',
        render: value => (
          <span className="font-medium text-morandi-red">NT$ {value.toLocaleString()}</span>
        ),
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { value: 'pending', label: '待處理' },
          { value: 'processing', label: '處理中' },
          { value: 'confirmed', label: '已確認' },
          { value: 'paid', label: '已付款' },
        ],
        render: value => {
          const statusMap = {
            pending: '待處理',
            processing: '處理中',
            confirmed: '已確認',
            paid: '已付款',
          }
          return (
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                value === 'paid'
                  ? 'bg-morandi-green text-white'
                  : value === 'confirmed'
                    ? 'bg-morandi-container text-morandi-primary'
                    : 'bg-morandi-gold text-white'
              )}
            >
              {statusMap[value as keyof typeof statusMap] || value}
            </span>
          )
        },
      },
    ],
    []
  )

  // 排序和篩選函數
  const sortFunction = (data: any[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a: any, b: any) => {
      let aValue: string | number | Date = a[column as keyof typeof a]
      let bValue: string | number | Date = b[column as keyof typeof b]

      if (column === 'request_date') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const filterFunction = (data: any[], filters: Record<string, string>) => {
    return data.filter((payment: any) => {
      return (
        (!filters.request_number || payment.request_number.includes(filters.request_number)) &&
        (!filters.request_date ||
          new Date(payment.request_date).toLocaleDateString().includes(filters.request_date)) &&
        (!filters.tour_name ||
          payment.tour_name.toLowerCase().includes(filters.tour_name.toLowerCase())) &&
        (!filters.total_amount || payment.total_amount.toString().includes(filters.total_amount)) &&
        (!filters.status || payment.status === filters.status)
      )
    })
  }

  const {
    data: filteredAndSortedPayments,
    handleSort,
    handleFilter,
  } = useEnhancedTable(orderPayments, sortFunction, filterFunction)

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-morandi-secondary mb-4">找不到該訂單</p>
          <Button onClick={() => router.push('/orders')} variant="outline">
            <ArrowLeft size={16} className="mr-1" />
            返回訂單列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader
        title={`請款記錄 - ${order.order_number}`}
        onAdd={() => router.push('/finance/requests')}
        addLabel="前往請款管理"
      >
        <div className="flex items-center space-x-4">
          <div className="text-sm text-morandi-secondary">
            聯絡人: <span className="text-morandi-primary font-medium">{order.contact_person}</span>
          </div>
          <Button onClick={() => router.push('/orders')} variant="ghost" size="sm" className="p-2">
            <ArrowLeft size={16} />
          </Button>
        </div>
      </ResponsiveHeader>

      <ContentContainer>
        <EnhancedTable
          columns={tableColumns}
          data={filteredAndSortedPayments}
          onSort={handleSort}
          onFilter={handleFilter}
          selection={undefined}
        />

        {filteredAndSortedPayments.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p>此訂單尚無請款記錄</p>
            <p className="text-sm mt-1">請前往財務管理建立請款單</p>
          </div>
        )}
      </ContentContainer>
    </div>
  )
}
