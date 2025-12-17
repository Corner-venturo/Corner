/**
 * 收款管理頁面（重構版）
 *
 * 功能：
 * 1. 收款單列表
 * 2. 支援 5 種收款方式（現金/匯款/刷卡/支票/LinkPay）
 * 3. LinkPay 自動生成付款連結
 * 4. 會計確認實收金額流程
 * 5. Realtime 即時同步
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Plus, Search, FileDown, Layers, Eye, CheckSquare } from 'lucide-react'
import { alert } from '@/lib/ui/alert-dialog'

// Components
import { ReceiptSearchDialog, BatchConfirmReceiptDialog } from './components'
import { AddReceiptDialog, BatchReceiptDialog } from '@/features/finance/payments'
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells'

// Hooks
import { usePaymentData } from './hooks/usePaymentData'
import { useAuthStore } from '@/stores'

// Utils
import { exportReceiptsToExcel } from '@/lib/excel/receipt-excel'

// Types
import type { Receipt } from '@/stores'
import type { ReceiptSearchFilters } from './components/ReceiptSearchDialog'
import type { ReceiptItem } from '@/stores'

export default function PaymentsPage() {
  const router = useRouter()

  // 資料與業務邏輯
  const { receipts, availableOrders, fetchReceipts, handleCreateReceipt } = usePaymentData()
  const { user } = useAuthStore()

  // 檢查是否為可批量確認的角色（管理員、會計、超級管理員）
  const canBatchConfirm = user?.roles?.some(role =>
    ['super_admin', 'admin', 'accountant'].includes(role)
  )

  // UI 狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [isBatchConfirmDialogOpen, setIsBatchConfirmDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [searchFilters, setSearchFilters] = useState<ReceiptSearchFilters>({})

  // 初始化載入資料
  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // 篩選後的收款單
  const filteredReceipts = useMemo(() => {
    let filtered = [...receipts]

    if (searchFilters.receiptNumber) {
      filtered = filtered.filter(r =>
        r.receipt_number.toLowerCase().includes(searchFilters.receiptNumber!.toLowerCase())
      )
    }

    if (searchFilters.orderNumber) {
      filtered = filtered.filter(r =>
        r.order_number?.toLowerCase().includes(searchFilters.orderNumber!.toLowerCase())
      )
    }

    if (searchFilters.dateFrom) {
      filtered = filtered.filter(r => r.receipt_date >= searchFilters.dateFrom!)
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(r => r.receipt_date <= searchFilters.dateTo!)
    }

    if (searchFilters.receiptTypes && searchFilters.receiptTypes.length > 0) {
      filtered = filtered.filter(r => searchFilters.receiptTypes!.includes(r.receipt_type))
    }

    if (searchFilters.statuses && searchFilters.statuses.length > 0) {
      filtered = filtered.filter(r => searchFilters.statuses!.includes(r.status))
    }

    if (searchFilters.limit && filtered.length > searchFilters.limit) {
      filtered = filtered.slice(0, searchFilters.limit)
    }

    return filtered
  }, [receipts, searchFilters])

  // 事件處理
  const handleViewDetail = useCallback((receipt: Receipt) => {
    router.push(`/finance/payments/${receipt.id}`)
  }, [router])

  const handleSubmit = async (data: { selectedOrderId: string; paymentItems: ReceiptItem[] }) => {
    try {
      await handleCreateReceipt(data)
      setIsDialogOpen(false)
    } catch (error) {
      logger.error('建立收款單失敗:', error)
      void alert('建立收款單失敗', 'error')
    }
  }

  const handleSearch = (filters: ReceiptSearchFilters) => {
    setSearchFilters(filters)
    setIsSearchDialogOpen(false)
  }

  const handleExportExcel = () => {
    exportReceiptsToExcel(filteredReceipts)
  }

  // 表格欄位
  const columns: TableColumn<Receipt>[] = [
    { key: 'receipt_number', label: '收款單號', sortable: true },
    { key: 'receipt_date', label: '收款日期', sortable: true, render: (value) => <DateCell date={String(value)} /> },
    { key: 'order_number', label: '訂單編號', sortable: true },
    { key: 'tour_name', label: '團名', sortable: true },
    { key: 'receipt_amount', label: '收款金額', sortable: true, render: (value) => `NT$ ${Number(value).toLocaleString()}` },
    { key: 'receipt_type', label: '收款方式', sortable: true },
    { key: 'status', label: '狀態', render: (value) => <StatusCell type="receipt" status={String(value)} /> },
    { key: 'actions', label: '操作', render: (_, row) => <ActionCell actions={[{ icon: Eye, label: '檢視', onClick: () => handleViewDetail(row) }]} /> },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="收款管理"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchDialogOpen(true)}
              className="text-morandi-secondary"
            >
              <Search size={16} className="mr-2" />
              進階搜尋
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="text-morandi-secondary"
            >
              <FileDown size={16} className="mr-2" />
              匯出 Excel
            </Button>
            {canBatchConfirm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBatchConfirmDialogOpen(true)}
                className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
              >
                <CheckSquare size={16} className="mr-2" />
                批量確認
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsBatchDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Layers size={16} className="mr-2" />
              批量收款
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Plus size={16} className="mr-2" />
              新增收款
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        {Object.keys(searchFilters).length > 0 && (
          <div className="bg-morandi-gold/10 border border-morandi-gold/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-morandi-secondary">
                已套用進階搜尋 • 顯示 {filteredReceipts.length} 筆結果
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchFilters({})}
                className="text-morandi-secondary hover:text-morandi-primary"
              >
                清除篩選
              </Button>
            </div>
          </div>
        )}

        <EnhancedTable
          className="min-h-full"
          data={filteredReceipts}
          columns={columns as TableColumn[]}
          defaultSort={{ key: 'receipt_date', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋收款單號或訂單編號..."
        />
      </div>

      {/* 新增收款對話框 */}
      <AddReceiptDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchReceipts}
      />

      {/* 進階搜尋對話框 */}
      <ReceiptSearchDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        onSearch={handleSearch}
        currentFilters={searchFilters}
      />

      {/* 批量收款對話框 */}
      <BatchReceiptDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} />

      {/* 批量確認收款對話框 */}
      <BatchConfirmReceiptDialog
        open={isBatchConfirmDialogOpen}
        onOpenChange={setIsBatchConfirmDialogOpen}
        onSuccess={fetchReceipts}
      />
    </div>
  )
}
