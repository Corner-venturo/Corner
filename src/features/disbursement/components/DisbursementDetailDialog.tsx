/**
 * DisbursementDetailDialog
 * 出納單詳情對話框
 */

'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, FileText } from 'lucide-react'
import { DisbursementOrder, PaymentRequest } from '@/stores/types'
import { usePaymentRequestStore, useDisbursementOrderStore } from '@/stores'
import { cn } from '@/lib/utils'
import { formatDateTW } from '@/lib/utils/format-date'
import { DisbursementPrintDialog } from './DisbursementPrintDialog'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

interface DisbursementDetailDialogProps {
  order: DisbursementOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 出納單狀態
const DISBURSEMENT_STATUS = {
  pending: { label: '待出帳', color: 'bg-morandi-gold' },
  confirmed: { label: '已確認', color: 'bg-status-info' },
  paid: { label: '已出帳', color: 'bg-morandi-green' },
}

export function DisbursementDetailDialog({
  order,
  open,
  onOpenChange,
}: DisbursementDetailDialogProps) {
  // Stores
  const { items: payment_requests, update: updatePaymentRequest } = usePaymentRequestStore()
  const { update: updateDisbursement } = useDisbursementOrderStore()

  // 列印對話框狀態
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  // 取得此出納單包含的請款單
  const includedRequests = useMemo(() => {
    if (!order?.payment_request_ids) return []
    return order.payment_request_ids
      .map(id => payment_requests.find(r => r.id === id))
      .filter(Boolean) as PaymentRequest[]
  }, [order, payment_requests])

  if (!order) return null

  const status = DISBURSEMENT_STATUS[order.status as keyof typeof DISBURSEMENT_STATUS] || DISBURSEMENT_STATUS.pending

  // 確認出帳
  const handleConfirmPaid = async () => {
    const confirmed = await confirm('確定要將此出納單標記為「已出帳」嗎？', {
      title: '確認出帳',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      // 更新出納單狀態
      await updateDisbursement(order.id, {
        status: 'paid',
        confirmed_at: new Date().toISOString(),
      })

      // 更新所有請款單狀態為 paid
      for (const requestId of order.payment_request_ids) {
        await updatePaymentRequest(requestId, {
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      }

      await alert('出納單已標記為已出帳', 'success')
      onOpenChange(false)
    } catch (error) {
      logger.error('更新出納單失敗:', error)
      await alert('更新出納單失敗', 'error')
    }
  }

  // 列印 PDF - 開啟預覽對話框
  const handlePrintPDF = () => {
    setIsPrintDialogOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">出納單 {order.order_number}</DialogTitle>
              <p className="text-sm text-morandi-muted mt-1">
                出帳日期：{order.disbursement_date ? formatDateTW(order.disbursement_date) : '-'}
              </p>
            </div>
            <Badge className={cn('text-white', status.color)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-morandi-background/50 rounded-lg">
            <InfoItem label="出納單號" value={order.order_number || '-'} />
            <InfoItem
              label="出帳日期"
              value={order.disbursement_date ? formatDateTW(order.disbursement_date) : '-'}
            />
            <InfoItem label="請款單數" value={`${order.payment_request_ids?.length || 0} 筆`} />
            <InfoItem
              label="總金額"
              value={`NT$ ${(order.amount || 0).toLocaleString()}`}
              highlight
            />
          </div>

          {/* 包含的請款單 */}
          <div>
            <h3 className="text-sm font-semibold text-morandi-primary mb-3">
              包含請款單 ({includedRequests.length} 筆)
            </h3>

            <div className="border border-morandi-container/20 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-morandi-background/50 border-b border-morandi-container/20">
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">請款單號</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">團號</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">團名</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">請款人</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {includedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-morandi-muted">
                        無請款單資料
                      </td>
                    </tr>
                  ) : (
                    includedRequests.map(request => (
                      <tr key={request.id} className="border-b border-morandi-container/10">
                        <td className="py-2 px-3 font-medium text-morandi-primary">{request.code}</td>
                        <td className="py-2 px-3 text-morandi-secondary">{request.tour_code || '-'}</td>
                        <td className="py-2 px-3 text-morandi-secondary max-w-[150px] truncate">
                          {request.tour_name || '-'}
                        </td>
                        <td className="py-2 px-3 text-morandi-secondary">{request.created_by_name || '-'}</td>
                        <td className="py-2 px-3 text-right font-medium text-morandi-gold">
                          NT$ {(request.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-morandi-background/50">
                    <td colSpan={4} className="py-3 px-3 text-right font-semibold">
                      合計
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-morandi-gold">
                      NT$ {(order.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-between pt-4 border-t border-morandi-container/20">
            <Button
              variant="outline"
              onClick={handlePrintPDF}
              className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
            >
              <FileText size={16} className="mr-2" />
              列印 PDF
            </Button>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button
                  onClick={handleConfirmPaid}
                  className="bg-morandi-green hover:bg-morandi-green/90 text-white"
                >
                  <Check size={16} className="mr-2" />
                  確認出帳
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 列印預覽對話框 */}
      <DisbursementPrintDialog
        order={order}
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    </Dialog>
  )
}

// 資訊項目組件
function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-morandi-muted mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-morandi-gold' : 'text-morandi-primary'}`}>
        {value}
      </p>
    </div>
  )
}
