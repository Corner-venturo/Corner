'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Eye } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import type { TableColumn } from '@/components/ui/enhanced-table/types'
import { useVoucherStore } from '@/stores/voucher-store'
import { useVoucherEntryStore } from '@/stores/voucher-entry-store'
import { useAccountingSubjectStore } from '@/stores/accounting-subject-store'
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells'
import type { Voucher } from '@/types/accounting-pro.types'
import { cn } from '@/lib/utils'

export default function VouchersPage() {
  const router = useRouter()

  // Stores
  const vouchers = useVoucherStore(state => state.items)
  const fetchVouchers = useVoucherStore(state => state.fetchAll)
  const fetchEntries = useVoucherEntryStore(state => state.fetchAll)
  const fetchSubjects = useAccountingSubjectStore(state => state.fetchAll)

  // 載入資料
  useEffect(() => {
    fetchVouchers()
    fetchEntries()
    fetchSubjects()
  }, [])

  // 事件處理
  const handleViewDetail = (voucher: Voucher) => {
    router.push(`/finance/vouchers/${voucher.id}`)
  }

  // 表格欄位定義
  const columns: TableColumn<Voucher>[] = [
    {
      key: 'voucher_no',
      label: '傳票編號',
      sortable: true,
      render: (value) => (
        <div className="font-mono text-sm">{String(value)}</div>
      ),
    },
    {
      key: 'voucher_date',
      label: '傳票日期',
      sortable: true,
      render: (value) => <DateCell date={String(value)} />,
    },
    {
      key: 'type',
      label: '類型',
      render: (value) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
            value === 'auto' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
          )}
        >
          {value === 'auto' ? '自動' : '手動'}
        </span>
      ),
    },
    {
      key: 'description',
      label: '摘要',
      render: (value) => (
        <div className="truncate max-w-xs">{String(value || '-')}</div>
      ),
    },
    {
      key: 'total_debit',
      label: '借方',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium">NT$ {Number(value).toLocaleString()}</div>
      ),
    },
    {
      key: 'total_credit',
      label: '貸方',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium">NT$ {Number(value).toLocaleString()}</div>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      render: (value) => <StatusCell type="voucher" status={String(value)} />,
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, row) => (
        <ActionCell
          actions={[{ icon: Eye, label: '檢視', onClick: () => handleViewDetail(row) }]}
        />
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="會計傳票"
        actions={
          <Button
            onClick={() => router.push('/finance/vouchers/new')}
            className="bg-morandi-gold hover:bg-morandi-gold/90 text-white"
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            新增傳票
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          data={vouchers}
          columns={columns}
          defaultSort={{ key: 'voucher_date', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋傳票編號或摘要..."
          emptyMessage="尚無傳票記錄"
        />
      </div>
    </div>
  )
}
