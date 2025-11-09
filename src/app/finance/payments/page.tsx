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

import { useState, useEffect } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Plus } from 'lucide-react'

// Realtime Hooks
import {
  useRealtimeForOrders,
  useRealtimeForReceipts,
  useRealtimeForLinkPayLogs,
} from '@/hooks/use-realtime-hooks'

// Components
import { createPaymentColumns, CreateReceiptDialog } from './components'

// Hooks
import { usePaymentData } from './hooks/usePaymentData'

// Types
import type { Receipt } from '@/stores'

export default function PaymentsPage() {
  // Realtime 訂閱
  useRealtimeForOrders()
  useRealtimeForReceipts()
  useRealtimeForLinkPayLogs()

  // 資料與業務邏輯
  const { receipts, availableOrders, fetchReceipts, handleCreateReceipt } = usePaymentData()

  // UI 狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 初始化載入資料
  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // 事件處理
  const handleViewDetail = (receipt: Receipt) => {
    alert(`查看收款單 ${receipt.receipt_number}`)
  }

  const handleSubmit = async (data: any) => {
    try {
      await handleCreateReceipt(data)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('建立收款單失敗:', error)
      alert('建立收款單失敗')
    }
  }

  // 表格欄位
  const columns = createPaymentColumns(handleViewDetail)

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="收款管理"
        actions={
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增收款
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          data={receipts}
          columns={columns}
          defaultSort={{ key: 'receipt_date', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋收款單號或訂單編號..."
        />
      </div>

      {/* 新增收款對話框 */}
      <CreateReceiptDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        availableOrders={availableOrders}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
