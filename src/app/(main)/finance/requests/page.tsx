'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { Plus, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useRequestTable } from '@/features/finance/requests/hooks/useRequestTable'
import { PaymentRequest } from '@/stores/types'

// Dynamic imports for dialogs (reduce initial bundle)
const AddRequestDialog = dynamic(
  () => import('@/features/finance/requests/components/AddRequestDialog').then(m => m.AddRequestDialog),
  { loading: () => null }
)
const RequestDetailDialog = dynamic(
  () => import('@/features/finance/requests/components/RequestDetailDialog').then(m => m.RequestDetailDialog),
  {
    loading: () => (
      <Dialog open>
        <DialogContent level={1} className="bg-transparent border-none shadow-none flex items-center justify-center">
          <VisuallyHidden>
            <DialogTitle>載入中</DialogTitle>
          </VisuallyHidden>
          <Loader2 className="animate-spin text-white" size={32} />
        </DialogContent>
      </Dialog>
    )
  }
)

export default function RequestsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { payment_requests, loadPaymentRequests } = usePayments()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)

  // 讀取 URL 參數（從快速請款按鈕傳入）
  const urlTourId = searchParams.get('tour_id')
  const urlOrderId = searchParams.get('order_id')

  // 載入資料（只執行一次）
  useEffect(() => {
    loadPaymentRequests()
  }, [])

  // 如果有 URL 參數，自動開啟新增對話框
  useEffect(() => {
    if (urlTourId) {
      setIsAddDialogOpen(true)
    }
  }, [urlTourId])

  // 當對話框關閉時，清除 URL 參數
  const handleAddDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open && urlTourId) {
      // 清除 URL 參數，避免重新開啟
      router.replace('/finance/requests')
    }
  }

  const { tableColumns, filteredAndSortedRequests, handleSort, handleFilter } =
    useRequestTable(payment_requests)

  // 點擊行打開詳細對話框
  const handleRowClick = (request: PaymentRequest) => {
    setSelectedRequest(request)
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="請款管理"
        actions={
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            新增請款
          </button>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={tableColumns as TableColumn[]}
          data={filteredAndSortedRequests}
          onSort={handleSort}
          onRowClick={handleRowClick}
          selection={undefined}
        />
      </div>

      <AddRequestDialog
        open={isAddDialogOpen}
        onOpenChange={handleAddDialogClose}
        defaultTourId={urlTourId || undefined}
        defaultOrderId={urlOrderId || undefined}
      />

      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      />
    </div>
  )
}
