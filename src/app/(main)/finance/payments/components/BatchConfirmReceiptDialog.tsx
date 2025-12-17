/**
 * 批量確認收款單對話框
 *
 * 功能：
 * 1. 顯示所有待確認的收款單
 * 2. 允許會計輸入實收金額
 * 3. 批量確認收款單狀態
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useReceiptStore, useOrderStore } from '@/stores'
import { CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { RECEIPT_TYPE_LABELS, ReceiptStatus } from '@/types/receipt.types'
import type { Receipt } from '@/types/receipt.types'
import { logger } from '@/lib/utils/logger'

interface BatchConfirmReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ConfirmItem {
  receipt: Receipt
  actualAmount: number
  selected: boolean
}

export function BatchConfirmReceiptDialog({
  open,
  onOpenChange,
  onSuccess,
}: BatchConfirmReceiptDialogProps) {
  const { items: receipts, update: updateReceipt, fetchAll: fetchReceipts } = useReceiptStore()
  const { items: orders, update: updateOrder } = useOrderStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmItems, setConfirmItems] = useState<Map<string, ConfirmItem>>(new Map())

  // 篩選待確認的收款單 (status = 0)
  const pendingReceipts = useMemo(() => {
    return receipts.filter(r => r.status === ReceiptStatus.PENDING)
  }, [receipts])

  // 初始化確認項目
  useMemo(() => {
    if (open && pendingReceipts.length > 0) {
      const items = new Map<string, ConfirmItem>()
      pendingReceipts.forEach(receipt => {
        items.set(receipt.id, {
          receipt,
          actualAmount: receipt.receipt_amount, // 預設為應收金額
          selected: false,
        })
      })
      setConfirmItems(items)
    }
  }, [open, pendingReceipts])

  // 更新單一項目
  const updateItem = useCallback((id: string, updates: Partial<ConfirmItem>) => {
    setConfirmItems(prev => {
      const newMap = new Map(prev)
      const item = newMap.get(id)
      if (item) {
        newMap.set(id, { ...item, ...updates })
      }
      return newMap
    })
  }, [])

  // 全選/取消全選
  const toggleSelectAll = useCallback(() => {
    const allSelected = Array.from(confirmItems.values()).every(item => item.selected)
    setConfirmItems(prev => {
      const newMap = new Map(prev)
      newMap.forEach((item, id) => {
        newMap.set(id, { ...item, selected: !allSelected })
      })
      return newMap
    })
  }, [confirmItems])

  // 計算統計
  const stats = useMemo(() => {
    const items = Array.from(confirmItems.values())
    const selectedItems = items.filter(item => item.selected)
    return {
      total: items.length,
      selected: selectedItems.length,
      totalAmount: selectedItems.reduce((sum, item) => sum + item.actualAmount, 0),
    }
  }, [confirmItems])

  // 批量確認
  const handleBatchConfirm = async () => {
    const selectedItems = Array.from(confirmItems.values()).filter(item => item.selected)

    if (selectedItems.length === 0) {
      void alert('請至少選擇一筆收款單', 'warning')
      return
    }

    // 檢查是否有金額為 0 的項目
    const zeroAmountItems = selectedItems.filter(item => item.actualAmount <= 0)
    if (zeroAmountItems.length > 0) {
      void alert('實收金額不能為 0', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      // 按訂單分組，用於更新訂單的已收款金額
      const orderUpdates = new Map<string, number>()

      for (const item of selectedItems) {
        // 更新收款單狀態
        await updateReceipt(item.receipt.id, {
          actual_amount: item.actualAmount,
          status: ReceiptStatus.CONFIRMED,
          note: item.receipt.note
            ? `${item.receipt.note}\n[會計批量確認] ${new Date().toLocaleDateString()}`
            : `[會計批量確認] ${new Date().toLocaleDateString()}`,
        })

        // 累計每個訂單的確認金額
        if (item.receipt.order_id) {
          const currentAmount = orderUpdates.get(item.receipt.order_id) || 0
          orderUpdates.set(item.receipt.order_id, currentAmount + item.actualAmount)
        }
      }

      // 更新訂單的已收款金額和狀態
      for (const [orderId, confirmedAmount] of orderUpdates) {
        const order = orders.find(o => o.id === orderId)
        if (order) {
          // 計算該訂單所有已確認收款的總金額
          const allConfirmedReceipts = receipts.filter(
            r => r.order_id === orderId && r.status === ReceiptStatus.CONFIRMED
          )
          const previousConfirmed = allConfirmedReceipts.reduce(
            (sum, r) => sum + (r.actual_amount || 0),
            0
          )
          const newPaidAmount = previousConfirmed + confirmedAmount

          // 計算付款狀態
          const totalAmount = order.total_amount || 0
          let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
          if (newPaidAmount >= totalAmount) {
            paymentStatus = 'paid'
          } else if (newPaidAmount > 0) {
            paymentStatus = 'partial'
          }

          await updateOrder(orderId, {
            paid_amount: newPaidAmount,
            remaining_amount: Math.max(0, totalAmount - newPaidAmount),
            payment_status: paymentStatus,
          })
        }
      }

      await fetchReceipts()

      await alert(`成功確認 ${selectedItems.length} 筆收款單`, 'success')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('批量確認收款單失敗:', error)
      void alert('確認失敗，請稍後再試', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-morandi-gold" />
            批量確認收款
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {pendingReceipts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-morandi-secondary">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-morandi-green" />
                <p className="text-lg font-medium">沒有待確認的收款單</p>
                <p className="text-sm mt-1">所有收款單都已確認完成</p>
              </div>
            </div>
          ) : (
            <>
              {/* 統計區塊 */}
              <div className="flex items-center justify-between p-3 bg-morandi-container/20 rounded-lg mb-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={stats.selected === stats.total && stats.total > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-morandi-secondary">
                    已選擇 {stats.selected} / {stats.total} 筆
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-morandi-gold" />
                  <span className="text-sm font-medium">
                    總計：NT$ {stats.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 列表區塊 */}
              <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-morandi-container/30 sticky top-0">
                    <tr>
                      <th className="w-10 py-2.5 px-3 text-left"></th>
                      <th className="py-2.5 px-3 text-left font-medium text-morandi-secondary">
                        收款單號
                      </th>
                      <th className="py-2.5 px-3 text-left font-medium text-morandi-secondary">
                        訂單編號
                      </th>
                      <th className="py-2.5 px-3 text-left font-medium text-morandi-secondary">
                        團名
                      </th>
                      <th className="py-2.5 px-3 text-left font-medium text-morandi-secondary">
                        收款方式
                      </th>
                      <th className="py-2.5 px-3 text-right font-medium text-morandi-secondary">
                        應收金額
                      </th>
                      <th className="py-2.5 px-3 text-right font-medium text-morandi-secondary">
                        實收金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(confirmItems.values()).map(item => (
                      <tr
                        key={item.receipt.id}
                        className={cn(
                          'border-b border-border/30 hover:bg-morandi-container/10',
                          item.selected && 'bg-morandi-gold/5'
                        )}
                      >
                        <td className="py-3 px-3">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={checked =>
                              updateItem(item.receipt.id, { selected: !!checked })
                            }
                          />
                        </td>
                        <td className="py-3 px-3 text-morandi-primary font-medium">
                          {item.receipt.receipt_number}
                        </td>
                        <td className="py-3 px-3 text-morandi-primary">
                          {item.receipt.order_number || '-'}
                        </td>
                        <td className="py-3 px-3 text-morandi-primary max-w-[200px] truncate">
                          {item.receipt.tour_name || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-morandi-container text-morandi-primary">
                            {RECEIPT_TYPE_LABELS[item.receipt.receipt_type] || '未知'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-morandi-primary">
                          NT$ {item.receipt.receipt_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Input
                            type="number"
                            value={item.actualAmount || ''}
                            onChange={e =>
                              updateItem(item.receipt.id, {
                                actualAmount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={cn(
                              'w-32 text-right h-8',
                              item.actualAmount !== item.receipt.receipt_amount &&
                                'border-morandi-gold'
                            )}
                            disabled={!item.selected}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 金額差異提醒 */}
              {Array.from(confirmItems.values()).some(
                item => item.selected && item.actualAmount !== item.receipt.receipt_amount
              ) && (
                <div className="flex items-center gap-2 p-3 mt-4 border border-morandi-gold/20 rounded-lg bg-morandi-gold/5 text-sm">
                  <AlertCircle className="h-4 w-4 text-morandi-gold flex-shrink-0" />
                  <span className="text-morandi-gold">
                    部分收款單的實收金額與應收金額不同，請確認
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleBatchConfirm}
            disabled={stats.selected === 0 || isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            {isSubmitting ? '確認中...' : `確認 ${stats.selected} 筆收款`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
