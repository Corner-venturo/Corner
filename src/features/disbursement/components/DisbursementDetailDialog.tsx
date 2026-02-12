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
import { Checkbox } from '@/components/ui/checkbox'
import { Check, FileText, Plus, X, Trash2 } from 'lucide-react'
import { DisbursementOrder, PaymentRequest } from '@/stores/types'
import {
  usePaymentRequests,
  updatePaymentRequest as updatePaymentRequestApi,
  updateDisbursementOrder as updateDisbursementOrderApi,
  invalidateDisbursementOrders,
} from '@/data'
import { cn } from '@/lib/utils'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { DisbursementPrintDialog } from './DisbursementPrintDialog'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { DISBURSEMENT_STATUS } from '../constants'
import { DISBURSEMENT_LABELS } from '../constants/labels'

interface DisbursementDetailDialogProps {
  order: DisbursementOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisbursementDetailDialog({
  order,
  open,
  onOpenChange,
}: DisbursementDetailDialogProps) {
  // 使用 @/data hooks（SWR 自動載入）
  const { items: payment_requests } = usePaymentRequests()

  // 列印對話框狀態
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  // 追加請款單模式
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])

  // 取得此出納單包含的請款單
  const includedRequests = useMemo(() => {
    if (!order?.payment_request_ids) return []
    return order.payment_request_ids
      .map(id => payment_requests.find(r => r.id === id))
      .filter(Boolean) as PaymentRequest[]
  }, [order, payment_requests])

  // 取得可追加的待處理請款單（pending 狀態且不在此出納單中）
  const availableRequests = useMemo(() => {
    const currentIds = order?.payment_request_ids || []
    if (currentIds.length === 0) return payment_requests.filter(r => r.status === 'pending')
    return payment_requests.filter(
      r => r.status === 'pending' && !currentIds.includes(r.id)
    )
  }, [order, payment_requests])

  if (!order) return null

  const status = DISBURSEMENT_STATUS[order.status as keyof typeof DISBURSEMENT_STATUS] || DISBURSEMENT_STATUS.pending

  // 追加請款單
  const handleAddRequests = async () => {
    if (selectedToAdd.length === 0) {
      await alert(DISBURSEMENT_LABELS.請選擇要追加的請款單, 'warning')
      return
    }

    try {
      // 計算新的請款單 ID 陣列和金額
      const existingIds = order.payment_request_ids || []
      const newRequestIds = [...existingIds, ...selectedToAdd]
      const addedAmount = selectedToAdd.reduce((sum, id) => {
        const req = payment_requests.find(r => r.id === id)
        return sum + (req?.amount || 0)
      }, 0)
      const newAmount = (order.amount || 0) + addedAmount

      // 更新出納單
      await updateDisbursementOrderApi(order.id, {
        payment_request_ids: newRequestIds,
        amount: newAmount,
      })

      // 更新追加的請款單狀態為 approved
      for (const id of selectedToAdd) {
        await updatePaymentRequestApi(id, { status: 'approved' })
      }

      // SWR 快取失效，自動重新載入
      await invalidateDisbursementOrders()

      await alert(`已追加 ${selectedToAdd.length} 筆請款單`, 'success')
      setIsAddingMode(false)
      setSelectedToAdd([])
    } catch (error) {
      logger.error(DISBURSEMENT_LABELS.追加請款單失敗_2, error)
      await alert(DISBURSEMENT_LABELS.追加請款單失敗, 'error')
    }
  }

  // 切換選擇追加的請款單
  const toggleSelectToAdd = (id: string) => {
    setSelectedToAdd(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // 從出納單移除單筆請款單
  const handleRemoveRequest = async (requestId: string) => {
    const request = includedRequests.find(r => r.id === requestId)
    if (!request) return

    const confirmed = await confirm(`確定要從此出納單移除「${request.code}」嗎？`, {
      title: DISBURSEMENT_LABELS.移除請款單,
      type: 'warning',
    })
    if (!confirmed) return

    try {
      // 計算新的請款單 ID 陣列和金額
      const existingIds = order.payment_request_ids || []
      const newRequestIds = existingIds.filter(id => id !== requestId)
      const newAmount = (order.amount || 0) - (request.amount || 0)

      // 更新出納單
      await updateDisbursementOrderApi(order.id, {
        payment_request_ids: newRequestIds,
        amount: newAmount,
      })

      // 將請款單狀態改回 pending
      await updatePaymentRequestApi(requestId, { status: 'pending' })

      // SWR 快取失效，自動重新載入
      await invalidateDisbursementOrders()

      await alert(DISBURSEMENT_LABELS.已移除請款單, 'success')
    } catch (error) {
      logger.error(DISBURSEMENT_LABELS.移除請款單失敗_2, error)
      await alert(DISBURSEMENT_LABELS.移除請款單失敗, 'error')
    }
  }

  // 確認出帳
  const handleConfirmPaid = async () => {
    const confirmed = await confirm(DISBURSEMENT_LABELS.確定要將此出納單標記為_已出帳_嗎, {
      title: DISBURSEMENT_LABELS.確認出帳,
      type: 'warning',
    })
    if (!confirmed) return

    try {
      // 更新出納單狀態
      await updateDisbursementOrderApi(order.id, {
        status: 'paid',
        confirmed_at: new Date().toISOString(),
      })

      // 更新所有請款單狀態為 paid
      const requestIds = order.payment_request_ids || []
      for (const requestId of requestIds) {
        await updatePaymentRequestApi(requestId, {
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      }

      await alert(DISBURSEMENT_LABELS.出納單已標記為已出帳, 'success')
      onOpenChange(false)
    } catch (error) {
      logger.error(DISBURSEMENT_LABELS.更新出納單失敗_2, error)
      await alert(DISBURSEMENT_LABELS.更新出納單失敗, 'error')
    }
  }

  // 列印 PDF - 開啟預覽對話框
  const handlePrintPDF = () => {
    setIsPrintDialogOpen(true)
  }

  return (
    <>
    {/* 主 Dialog：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
    {!isPrintDialogOpen && (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">出納單 {order.order_number}</DialogTitle>
              <div className="text-sm text-morandi-muted mt-1 flex items-center gap-1">
                出帳日期：<DateCell date={order.disbursement_date} showIcon={false} className="text-morandi-muted" />
              </div>
            </div>
            <Badge className={cn('text-white', status.color)}>
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-morandi-background/50 rounded-lg">
            <InfoItem label={DISBURSEMENT_LABELS.出納單號} value={order.order_number || '-'} />
            <div>
              <p className="text-xs text-morandi-muted mb-1">出帳日期</p>
              <DateCell date={order.disbursement_date} showIcon={false} className="text-sm" />
            </div>
            <InfoItem label={DISBURSEMENT_LABELS.請款單數} value={`${order.payment_request_ids?.length || 0} 筆`} />
            <div>
              <p className="text-xs text-morandi-muted mb-1">總金額</p>
              <CurrencyCell amount={order.amount || 0} className="font-semibold text-morandi-gold" />
            </div>
          </div>

          {/* 包含的請款單 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-morandi-primary">
                包含請款單 ({includedRequests.length} 筆)
              </h3>
              {order.status === 'pending' && !isAddingMode && availableRequests.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingMode(true)}
                  className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
                >
                  <Plus size={14} className="mr-1" />
                  追加請款單
                </Button>
              )}
            </div>

            <div className="border border-morandi-container/20 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-morandi-background/50 border-b border-morandi-container/20">
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">請款單號</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">團號</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">團名</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">請款人</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">金額</th>
                    {order.status === 'pending' && (
                      <th className="text-center py-2 px-3 text-morandi-muted font-medium w-16">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {includedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={order.status === 'pending' ? 6 : 5} className="text-center py-8 text-morandi-muted">
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
                        <td className="py-2 px-3 text-right">
                          <CurrencyCell amount={request.amount || 0} className="font-medium text-morandi-gold" />
                        </td>
                        {order.status === 'pending' && (
                          <td className="py-2 px-3 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-morandi-red hover:bg-morandi-red/10"
                              onClick={() => handleRemoveRequest(request.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-morandi-background/50">
                    <td colSpan={order.status === 'pending' ? 5 : 4} className="py-3 px-3 text-right font-semibold">
                      合計
                    </td>
                    <td className="py-3 px-3 text-right">
                      <CurrencyCell amount={order.amount || 0} className="font-bold text-morandi-gold" />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 追加請款單區塊 */}
          {isAddingMode && (
            <div className="border border-morandi-gold/30 rounded-lg p-4 bg-morandi-gold/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-morandi-primary">
                  選擇要追加的請款單 ({availableRequests.length} 筆可選)
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingMode(false)
                    setSelectedToAdd([])
                  }}
                >
                  <X size={14} className="mr-1" />
                  取消
                </Button>
              </div>

              {availableRequests.length === 0 ? (
                <p className="text-sm text-morandi-muted text-center py-4">
                  目前沒有待處理的請款單可追加
                </p>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto border border-morandi-container/20 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-morandi-background">
                        <tr className="border-b border-morandi-container/20">
                          <th className="w-10 py-2 px-2"></th>
                          <th className="text-left py-2 px-2 text-morandi-muted font-medium">請款單號</th>
                          <th className="text-left py-2 px-2 text-morandi-muted font-medium">團號</th>
                          <th className="text-right py-2 px-2 text-morandi-muted font-medium">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableRequests.map(request => (
                          <tr
                            key={request.id}
                            className="border-b border-morandi-container/10 hover:bg-morandi-gold/10 cursor-pointer"
                            onClick={() => toggleSelectToAdd(request.id)}
                          >
                            <td className="py-2 px-2 text-center">
                              <Checkbox
                                checked={selectedToAdd.includes(request.id)}
                                onCheckedChange={() => toggleSelectToAdd(request.id)}
                              />
                            </td>
                            <td className="py-2 px-2 font-medium text-morandi-primary">{request.code}</td>
                            <td className="py-2 px-2 text-morandi-secondary">{request.tour_code || '-'}</td>
                            <td className="py-2 px-2 text-right">
                              <CurrencyCell amount={request.amount || 0} className="text-morandi-gold" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-morandi-secondary flex items-center gap-1">
                      已選擇 {selectedToAdd.length} 筆，金額：
                      <CurrencyCell
                        amount={selectedToAdd.reduce((sum, id) => {
                          const req = payment_requests.find(r => r.id === id)
                          return sum + (req?.amount || 0)
                        }, 0)}
                        className="font-semibold text-morandi-gold"
                      />
                    </p>
                    <Button
                      onClick={handleAddRequests}
                      disabled={selectedToAdd.length === 0}
                      className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                    >
                      <Plus size={14} className="mr-1" />
                      追加 {selectedToAdd.length} 筆
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

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
              {order.status === 'pending' && !isAddingMode && (
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
    </Dialog>
    )}

    {/* 列印預覽對話框 - 放在外層避免多重遮罩 */}
    <DisbursementPrintDialog
      order={order}
      open={isPrintDialogOpen}
      onOpenChange={setIsPrintDialogOpen}
    />
    </>
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
