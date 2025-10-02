'use client';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { useTourStore } from '@/stores/tour-store';
import { ArrowLeft, CreditCard, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const { orders, payments } = useTourStore();

  const order = orders.find(o => o.id === orderId);
  const orderPayments = payments.filter(p => p.orderId === orderId);

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
    );
  }

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '已確認': 'bg-morandi-green text-white',
      '待確認': 'bg-morandi-gold text-white',
      '已完成': 'bg-morandi-container text-morandi-primary'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  const getPaymentTypeIcon = (type: string) => {
    if (type === '收款') return <TrendingUp size={16} className="text-morandi-green" />;
    if (type === '請款') return <TrendingDown size={16} className="text-morandi-red" />;
    return <CreditCard size={16} className="text-morandi-gold" />;
  };

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'createdAt',
      label: '日期',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value) => (
        <span className="text-morandi-primary">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'type',
      label: '類型',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: '收款', label: '收款' },
        { value: '請款', label: '請款' }
      ],
      render: (value) => (
        <div className="flex items-center space-x-2">
          {getPaymentTypeIcon(value)}
          <span className="text-morandi-primary">{value}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: '金額',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value, row) => (
        <span className={cn(
          "font-medium",
          row.type === '收款' ? 'text-morandi-green' : 'text-morandi-red'
        )}>
          {row.type === '收款' ? '+' : '-'} NT$ {value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'description',
      label: '說明',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-morandi-primary">{value}</span>
      )
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: '已確認', label: '已確認' },
        { value: '待確認', label: '待確認' },
        { value: '已完成', label: '已完成' }
      ],
      render: (value) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          getPaymentStatusBadge(value)
        )}>
          {value}
        </span>
      )
    }
  ], []);

  // 排序和篩選函數
  const sortFunction = (data: any[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number | Date = a[column as keyof typeof a];
      let bValue: string | number | Date = b[column as keyof typeof b];

      if (column === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterFunction = (data: any[], filters: Record<string, string>) => {
    return data.filter(payment => {
      return (
        (!filters.createdAt || new Date(payment.createdAt).toLocaleDateString().includes(filters.createdAt)) &&
        (!filters.type || payment.type === filters.type) &&
        (!filters.amount || payment.amount.toString().includes(filters.amount)) &&
        (!filters.description || payment.description.toLowerCase().includes(filters.description.toLowerCase())) &&
        (!filters.status || payment.status === filters.status)
      );
    });
  };

  const { data: filteredAndSortedPayments, handleSort, handleFilter } = useEnhancedTable(
    orderPayments,
    sortFunction,
    filterFunction
  );

  return (
    <div className="space-y-6 ">
      <ResponsiveHeader
        title={`付款記錄 - ${order.orderNumber}`}
        onAdd={() => {/* TODO: 新增付款記錄 */}}
        addLabel="新增記錄"
      >
        <div className="flex items-center space-x-4">
          <div className="text-sm text-morandi-secondary">
            聯絡人: <span className="text-morandi-primary font-medium">{order.contactPerson}</span>
          </div>
          <Button
            onClick={() => router.push('/orders')}
            variant="ghost"
            size="sm"
            className="p-2"
          >
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
          cellSelection={false}
        />

        {filteredAndSortedPayments.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p>尚無付款記錄</p>
            <p className="text-sm mt-1">點擊上方「新增記錄」按鈕開始記錄付款</p>
          </div>
        )}
      </ContentContainer>
    </div>
  );
}