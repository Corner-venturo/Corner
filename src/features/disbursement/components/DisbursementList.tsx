/**
 * DisbursementList
 * 出納單列表組件
 */

'use client'

import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { PaymentRequest, DisbursementOrder } from '../types'
import { usePendingColumns, useCurrentOrderColumns, useHistoryColumns } from './DisbursementColumns'

interface PendingListProps {
  data: PaymentRequest[]
  selectedRequests: string[]
  selectedAmount: number
  searchTerm: string
  nextThursday: string | Date
  onSelectRequest: (requestId: string) => void
  onAddToDisbursement: () => void
}

export function PendingList({
  data,
  selectedRequests,
  selectedAmount,
  searchTerm,
  nextThursday,
  onSelectRequest,
  onAddToDisbursement,
}: PendingListProps) {
  const columns = usePendingColumns({ selectedRequests, onSelectRequest })

  return (
    <>
      {/* 批次操作列 */}
      {selectedRequests.length > 0 && (
        <div className="bg-morandi-gold/10 border border-morandi-gold/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-morandi-secondary">
              已選 {selectedRequests.length} 筆，總金額 NT$ {selectedAmount.toLocaleString()}
            </span>
            <Button
              onClick={onAddToDisbursement}
              className="bg-morandi-gold hover:bg-morandi-gold/90"
            >
              加入本週出帳
            </Button>
          </div>
        </div>
      )}

      {/* 統計資訊 */}
      {data.length > 0 && (
        <div className="mb-4 flex items-center justify-end">
          <div className="text-sm text-morandi-secondary">
            {data.length} 筆 • 下次出帳日：
            {typeof nextThursday === 'string'
              ? nextThursday
              : nextThursday.toLocaleDateString('zh-TW')}
          </div>
        </div>
      )}

      {/* 表格 */}
      <EnhancedTable
        className="min-h-full"
        data={data}
        columns={columns}
        searchableFields={['request_number', 'code', 'tour_name']}
        initialPageSize={20}
        searchTerm={searchTerm}
      />
    </>
  )
}

interface CurrentOrderListProps {
  currentOrder: DisbursementOrder
  requests: PaymentRequest[]
  searchTerm: string
  onRemove: (requestId: string) => void
  onConfirm: () => void
}

export function CurrentOrderList({
  currentOrder,
  requests,
  searchTerm,
  onRemove,
  onConfirm,
}: CurrentOrderListProps) {
  const columns = useCurrentOrderColumns({ currentOrder, onRemove })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-morandi-primary">
            {currentOrder.order_number}
          </h3>
          <p className="text-sm text-morandi-secondary">
            出帳日期：{currentOrder.disbursement_date} • {currentOrder.payment_request_ids.length}{' '}
            筆請款單
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-morandi-primary">
              NT$ {currentOrder.total_amount.toLocaleString()}
            </p>
          </div>
          {currentOrder.status === 'pending' && (
            <Button onClick={onConfirm} className="bg-morandi-green hover:bg-morandi-green/90">
              確認出帳
            </Button>
          )}
        </div>
      </div>

      <EnhancedTable
        className="min-h-full"
        data={requests}
        columns={columns}
        searchableFields={['request_number', 'code', 'tour_name']}
        initialPageSize={20}
        searchTerm={searchTerm}
      />
    </div>
  )
}

interface EmptyCurrentOrderProps {
  onNavigate: () => void
}

export function EmptyCurrentOrder({ onNavigate }: EmptyCurrentOrderProps) {
  return (
    <div className="text-center py-12">
      <Calendar className="h-16 w-16 text-morandi-secondary mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium text-morandi-primary mb-2">本週尚無出帳計劃</h3>
      <p className="text-morandi-secondary mb-4">請先到「待出帳」頁面勾選需要出帳的請款單</p>
      <Button onClick={onNavigate} variant="outline">
        前往選擇請款單
      </Button>
    </div>
  )
}

interface HistoryListProps {
  data: DisbursementOrder[]
  searchTerm: string
}

export function HistoryList({ data, searchTerm }: HistoryListProps) {
  const columns = useHistoryColumns()

  return (
    <EnhancedTable
      className="min-h-full"
      data={data}
      columns={columns}
      searchableFields={['order_number']}
      initialPageSize={20}
      searchTerm={searchTerm}
    />
  )
}
