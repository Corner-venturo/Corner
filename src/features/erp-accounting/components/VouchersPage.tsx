'use client'

import { useState, useMemo } from 'react'
import { FileText, Eye, RotateCcw, Search } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useJournalVouchers } from '../hooks'
import { VoucherDetailDialog } from './VoucherDetailDialog'
import { ReverseVoucherDialog } from './ReverseVoucherDialog'
import type { JournalVoucher, VoucherStatus } from '@/types/accounting.types'

const statusConfig: Record<VoucherStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  posted: { label: '已過帳', variant: 'default' },
  reversed: { label: '已反沖', variant: 'destructive' },
  locked: { label: '已鎖定', variant: 'outline' },
}

export function VouchersPage() {
  const { items: vouchers, isLoading, fetchAll } = useJournalVouchers()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState<JournalVoucher | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)

  const filteredVouchers = useMemo(() => {
    if (!searchTerm) return vouchers
    const term = searchTerm.toLowerCase()
    return vouchers.filter(v =>
      v.voucher_no.toLowerCase().includes(term) ||
      v.memo?.toLowerCase().includes(term)
    )
  }, [vouchers, searchTerm])

  const handleViewDetail = (voucher: JournalVoucher) => {
    setSelectedVoucher(voucher)
    setShowDetailDialog(true)
  }

  const handleReverse = (voucher: JournalVoucher) => {
    setSelectedVoucher(voucher)
    setShowReverseDialog(true)
  }

  const columns: Column<JournalVoucher>[] = [
    {
      key: 'voucher_no',
      label: '傳票編號',
      width: '140px',
      render: (value: unknown) => (
        <span className="font-mono text-sm">{String(value)}</span>
      ),
    },
    {
      key: 'voucher_date',
      label: '日期',
      width: '100px',
    },
    {
      key: 'memo',
      label: '摘要',
      render: (value: unknown) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {String(value) || '-'}
        </span>
      ),
    },
    {
      key: 'total_debit',
      label: '借方',
      width: '120px',
      align: 'right',
      render: (value: unknown) => (
        <span className="font-mono">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'total_credit',
      label: '貸方',
      width: '120px',
      align: 'right',
      render: (value: unknown) => (
        <span className="font-mono">
          {Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (value: unknown) => {
        const config = statusConfig[value as VoucherStatus]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'actions',
      label: '操作',
      width: '120px',
      render: (_: unknown, row: JournalVoucher) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetail(row)}
          >
            <Eye size={14} />
          </Button>
          {row.status === 'posted' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReverse(row)}
              className="text-destructive hover:text-destructive"
            >
              <RotateCcw size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="會計傳票"
        icon={FileText}
        badge={filteredVouchers.length}
      />

      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋傳票編號或摘要..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={filteredVouchers}
          isLoading={isLoading}
          emptyMessage="尚無傳票資料"
        />
      </div>

      {selectedVoucher && (
        <>
          <VoucherDetailDialog
            open={showDetailDialog}
            onOpenChange={setShowDetailDialog}
            voucher={selectedVoucher}
          />
          <ReverseVoucherDialog
            open={showReverseDialog}
            onOpenChange={setShowReverseDialog}
            voucher={selectedVoucher}
            onSuccess={() => {
              fetchAll()
              setShowReverseDialog(false)
            }}
          />
        </>
      )}
    </div>
  )
}
