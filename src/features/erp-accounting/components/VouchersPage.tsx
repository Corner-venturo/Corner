'use client'

import { useState } from 'react'
import { Eye, RotateCcw, Plus, Pencil } from 'lucide-react'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useJournalVouchers } from '../hooks'
import { VoucherDetailDialog } from './VoucherDetailDialog'
import { ReverseVoucherDialog } from './ReverseVoucherDialog'
import { VoucherFormDialog } from './VoucherFormDialog'
import type { JournalVoucher, VoucherStatus } from '@/types/accounting.types'

const statusConfig: Record<VoucherStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  posted: { label: '已過帳', variant: 'default' },
  reversed: { label: '已反沖', variant: 'destructive' },
  locked: { label: '已鎖定', variant: 'outline' },
}

export function VouchersPage() {
  const { items: vouchers, isLoading, fetchAll } = useJournalVouchers()
  const [selectedVoucher, setSelectedVoucher] = useState<JournalVoucher | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showReverseDialog, setShowReverseDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<JournalVoucher | null>(null)

  const handleCreate = () => {
    setEditingVoucher(null)
    setShowFormDialog(true)
  }

  const handleEdit = (voucher: JournalVoucher) => {
    setEditingVoucher(voucher)
    setShowFormDialog(true)
  }

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
      width: '140px',
      render: (_: unknown, row: JournalVoucher) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetail(row)}
            title="查看"
          >
            <Eye size={14} />
          </Button>
          {row.status === 'draft' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(row)}
              title="編輯"
            >
              <Pencil size={14} />
            </Button>
          )}
          {row.status === 'posted' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReverse(row)}
              className="text-destructive hover:text-destructive"
              title="反沖"
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
      {/* 工具列 */}
      <div className="flex justify-end p-4 border-b">
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={16} />
          新增傳票
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={vouchers}
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

      {/* 傳票表單對話框 */}
      <VoucherFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        voucher={editingVoucher}
        onSuccess={() => {
          fetchAll()
          setShowFormDialog(false)
        }}
      />
    </div>
  )
}
