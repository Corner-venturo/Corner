/**
 * DisbursementPage
 * 出納單管理主頁面
 *
 * 設計理念（參考 cornerERP）：
 * - 列表顯示「出納單」，不是請款單
 * - 點「新增」進入選擇請款單的流程
 * - 出納單包含多張請款單
 */

'use client'

import { useCallback, useState, useMemo } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Eye, Trash2 } from 'lucide-react'
import {
  usePaymentRequests,
  useDisbursementOrders,
  deleteDisbursementOrder as deleteDisbursementOrderApi,
  invalidatePaymentRequests,
  invalidateDisbursementOrders,
} from '@/data'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { DisbursementOrder, PaymentRequest } from '@/stores/types'
import { cn } from '@/lib/utils'
import { CreateDisbursementDialog } from './CreateDisbursementDialog'
import { DisbursementDetailDialog } from './DisbursementDetailDialog'
import { DisbursementPrintDialog } from './DisbursementPrintDialog'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { DISBURSEMENT_STATUS } from '../constants'
import { DISBURSEMENT_LABELS } from '../constants/labels'

export function DisbursementPage() {
  // 使用 @/data hooks（SWR 自動載入）
  const { items: disbursement_orders } = useDisbursementOrders()
  const { items: payment_requests } = usePaymentRequests()

  // 狀態
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DisbursementOrder | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [printOrder, setPrintOrder] = useState<DisbursementOrder | null>(null)

  // SWR 自動載入資料，無需 useEffect

  // 取得待出帳的請款單（狀態為 pending，且尚未加入任何出納單）
  const pendingRequests = useMemo(() => {
    // 收集所有已在出納單中的請款單 ID
    const usedRequestIds = new Set<string>()
    disbursement_orders.forEach(order => {
      order.payment_request_ids?.forEach(id => usedRequestIds.add(id))
    })

    // 只顯示「請款中」且「尚未加入出納單」的請款單
    return payment_requests.filter(r =>
      r.status === 'pending' && !usedRequestIds.has(r.id)
    )
  }, [payment_requests, disbursement_orders])

  // 表格欄位
  const columns: TableColumn<DisbursementOrder>[] = useMemo(() => [
    {
      key: 'order_number',
      label: DISBURSEMENT_LABELS.出納單號,
      sortable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{String(value || DISBURSEMENT_LABELS.自動產生)}</div>
      ),
    },
    {
      key: 'disbursement_date',
      label: DISBURSEMENT_LABELS.出帳日期,
      sortable: true,
      render: (value) => (
        <DateCell date={value as string | null} showIcon={false} className="text-morandi-secondary" />
      ),
    },
    {
      key: 'payment_request_ids',
      label: DISBURSEMENT_LABELS.請款單數,
      render: (value) => (
        <div className="text-center">
          {Array.isArray(value) ? value.length : 0} {DISBURSEMENT_LABELS.筆}
        </div>
      ),
    },
    {
      key: 'amount',
      label: DISBURSEMENT_LABELS.總金額,
      sortable: true,
      render: (value) => (
        <div className="text-right">
          <CurrencyCell amount={Number(value) || 0} className="font-semibold text-morandi-gold" />
        </div>
      ),
    },
    {
      key: 'status',
      label: DISBURSEMENT_LABELS.狀態,
      sortable: true,
      render: (value) => {
        const status = DISBURSEMENT_STATUS[value as keyof typeof DISBURSEMENT_STATUS] || DISBURSEMENT_STATUS.pending
        return (
          <Badge className={cn('text-white', status.color)}>
            {status.label}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      label: DISBURSEMENT_LABELS.建立時間,
      sortable: true,
      render: (value) => (
        <DateCell date={value as string | null} showIcon={false} className="text-morandi-secondary" />
      ),
    },
    {
      key: 'actions',
      label: DISBURSEMENT_LABELS.操作,
      width: '120px',
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDetail(row)
            }}
            className="h-8 w-8 p-0"
          >
            <Eye size={16} className="text-morandi-secondary" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handlePrintPDF(row)
            }}
            className="h-8 w-8 p-0"
          >
            <FileText size={16} className="text-morandi-gold" />
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(row)
              }}
              className="h-8 w-8 p-0"
            >
              <Trash2 size={16} className="text-status-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ], [])

  // 查看詳情
  const handleViewDetail = useCallback((order: DisbursementOrder) => {
    setSelectedOrder(order)
    setIsDetailDialogOpen(true)
  }, [])

  // 列印 PDF - 開啟預覽對話框
  const handlePrintPDF = useCallback((order: DisbursementOrder) => {
    setPrintOrder(order)
    setIsPrintDialogOpen(true)
  }, [])

  // 刪除出納單
  const handleDelete = useCallback(async (order: DisbursementOrder) => {
    const confirmed = await confirm(`${DISBURSEMENT_LABELS.CONFIRM_DELETE_PREFIX}${order.order_number}${DISBURSEMENT_LABELS.CONFIRM_DELETE_SUFFIX}`, {
      title: DISBURSEMENT_LABELS.刪除出納單,
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await deleteDisbursementOrderApi(order.id)
      await alert(DISBURSEMENT_LABELS.出納單已刪除, 'success')
    } catch (error) {
      logger.error(DISBURSEMENT_LABELS.刪除出納單失敗_2, error)
      await alert(DISBURSEMENT_LABELS.刪除出納單失敗, 'error')
    }
  }, [])

  // 新增出納單成功後
  const handleCreateSuccess = useCallback(async () => {
    setIsCreateDialogOpen(false)
    // SWR 快取失效，自動重新載入
    await Promise.all([
      invalidateDisbursementOrders(),
      invalidatePaymentRequests(),
    ])
  }, [])

  // 計算統計數據
  const thisMonthOrders = useMemo(() => {
    return disbursement_orders.filter(o => {
      const date = new Date(o.created_at || '')
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
  }, [disbursement_orders])

  const thisMonthAmount = useMemo(() => {
    return thisMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
  }, [thisMonthOrders])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={DISBURSEMENT_LABELS.出納單管理}
        onAdd={() => setIsCreateDialogOpen(true)}
        addLabel={DISBURSEMENT_LABELS.新增出納單}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={DISBURSEMENT_LABELS.搜尋出納單號}
      >
        {/* 統計資訊 */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-right">
            <span className="text-morandi-muted">{DISBURSEMENT_LABELS.待出帳}</span>
            <span className="ml-2 font-semibold text-morandi-gold">{pendingRequests.length} 筆</span>
          </div>
          <div className="text-right">
            <span className="text-morandi-muted">{DISBURSEMENT_LABELS.LABEL_4658}</span>
            <span className="ml-2 font-semibold text-morandi-primary">{thisMonthOrders.length} 筆</span>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="text-morandi-muted">{DISBURSEMENT_LABELS.LABEL_1688}</span>
            <CurrencyCell amount={thisMonthAmount} className="font-semibold text-morandi-green" />
          </div>
        </div>
      </ResponsiveHeader>

      <div className="flex-1 overflow-hidden">
        {/* 出納單列表 */}
        <EnhancedTable
          data={disbursement_orders}
          columns={columns}
          searchableFields={['order_number']}
          initialPageSize={20}
          searchTerm={searchTerm}
          onRowClick={handleViewDetail}
        />
      </div>

      {/* 新增出納單對話框 */}
      <CreateDisbursementDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        pendingRequests={pendingRequests}
        onSuccess={handleCreateSuccess}
      />

      {/* 出納單詳情對話框 */}
      <DisbursementDetailDialog
        order={selectedOrder}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      {/* 出納單列印預覽對話框 */}
      <DisbursementPrintDialog
        order={printOrder}
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    </div>
  )
}
