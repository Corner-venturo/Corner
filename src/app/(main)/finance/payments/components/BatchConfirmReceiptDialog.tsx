/**
 * 批量確認收款品項對話框
 *
 * 功能：
 * 1. 顯示所有待確認的收款品項（而非收款單）
 * 2. 允許會計輸入每個品項的實收金額
 * 3. 批量確認收款品項狀態
 * 4. 每筆獨立處理，失敗不影響其他
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
import {
  useOrdersSlim,
  updateOrder,
  useReceipts,
  updateReceipt,
  invalidateReceipts,
  useReceiptItems,
  updateReceiptItem,
  invalidateReceiptItems,
} from '@/data'
import { CheckCircle, AlertCircle, DollarSign, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { RECEIPT_TYPE_LABELS, ReceiptType } from '@/types/receipt.types'
import { CurrencyCell } from '@/components/table-cells'
import type { DbReceiptItem } from '@/types/receipt.types'
import { logger } from '@/lib/utils/logger'
import { BATCH_CONFIRM_LABELS } from '../../constants/labels'

interface BatchConfirmReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ConfirmItem {
  item: DbReceiptItem
  receiptNumber: string
  orderNumber: string | null
  tourName: string | null
  actualAmount: number
  selected: boolean
}

export function BatchConfirmReceiptDialog({
  open,
  onOpenChange,
  onSuccess,
}: BatchConfirmReceiptDialogProps) {
  const { items: receiptItems } = useReceiptItems()
  const { items: receipts } = useReceipts()
  const { items: orders } = useOrdersSlim()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmItems, setConfirmItems] = useState<Map<string, ConfirmItem>>(new Map())

  // 建立收款單 ID 到收款單資訊的 Map
  const receiptMap = useMemo(() => {
    const map = new Map<string, { receipt_number: string; order_number: string | null; tour_name: string | null; order_id: string | null }>()
    receipts.forEach(r => {
      map.set(r.id, {
        receipt_number: r.receipt_number,
        order_number: r.order_number ?? null,
        tour_name: r.tour_name ?? null,
        order_id: r.order_id ?? null,
      })
    })
    return map
  }, [receipts])

  // 篩選待確認的收款品項 (status = '0' 或 null)
  const pendingItems = useMemo(() => {
    if (open && receiptItems.length > 0) {
      logger.log('📋 所有收款品項 status:', receiptItems.slice(0, 5).map(r => ({
        id: r.id,
        receipt_id: r.receipt_id,
        status: r.status,
        amount: r.amount,
      })))
    }
    return receiptItems.filter(r => r.status === '0' || r.status === null)
  }, [receiptItems, open])

  // 初始化確認項目
  useMemo(() => {
    if (open && pendingItems.length > 0) {
      const items = new Map<string, ConfirmItem>()
      pendingItems.forEach(item => {
        const receiptInfo = receiptMap.get(item.receipt_id)
        items.set(item.id, {
          item,
          receiptNumber: receiptInfo?.receipt_number || '-',
          orderNumber: receiptInfo?.order_number || item.order_id || null,
          tourName: receiptInfo?.tour_name || null,
          actualAmount: item.amount, // 預設為應收金額
          selected: false,
        })
      })
      setConfirmItems(items)
    }
  }, [open, pendingItems, receiptMap])

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
      void alert('請至少選擇一筆收款品項', 'warning')
      return
    }

    // 檢查是否有金額為 0 的項目
    const zeroAmountItems = selectedItems.filter(item => item.actualAmount <= 0)
    if (zeroAmountItems.length > 0) {
      void alert('實收金額不能為 0', 'warning')
      return
    }

    setIsSubmitting(true)

    // 追蹤每筆處理結果
    const successItems: ConfirmItem[] = []
    const failedItems: { item: ConfirmItem; error: string }[] = []
    const orderUpdates = new Map<string, number>()
    const receiptUpdates = new Map<string, { totalActual: number; allConfirmed: boolean }>()

    // 逐筆處理，失敗不影響其他
    for (const confirmItem of selectedItems) {
      try {
        // 更新收款品項狀態
        await updateReceiptItem(confirmItem.item.id, {
          actual_amount: confirmItem.actualAmount,
          status: '1', // 已確認
        })

        successItems.push(confirmItem)

        // 累計每個收款單的確認金額
        const receiptId = confirmItem.item.receipt_id
        const current = receiptUpdates.get(receiptId) || { totalActual: 0, allConfirmed: true }
        receiptUpdates.set(receiptId, {
          totalActual: current.totalActual + confirmItem.actualAmount,
          allConfirmed: current.allConfirmed, // 稍後檢查
        })

        // 累計每個訂單的確認金額
        const orderId = confirmItem.item.order_id
        if (orderId) {
          const currentAmount = orderUpdates.get(orderId) || 0
          orderUpdates.set(orderId, currentAmount + confirmItem.actualAmount)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤'
        failedItems.push({ item: confirmItem, error: errorMessage })
        logger.error(`確認收款品項 ${confirmItem.receiptNumber} 失敗:`, error)
      }
    }

    // 更新收款單主表（檢查是否所有品項都已確認）
    for (const [receiptId, data] of receiptUpdates) {
      try {
        // 檢查該收款單的所有品項是否都已確認
        const allItemsForReceipt = receiptItems.filter(ri => ri.receipt_id === receiptId)
        const confirmedCount = allItemsForReceipt.filter(ri => 
          ri.status === '1' || successItems.some(s => s.item.id === ri.id)
        ).length

        const allConfirmed = confirmedCount === allItemsForReceipt.length

        // 計算總實收金額
        const totalActual = allItemsForReceipt.reduce((sum, ri) => {
          const successItem = successItems.find(s => s.item.id === ri.id)
          if (successItem) {
            return sum + successItem.actualAmount
          }
          return sum + (ri.actual_amount || 0)
        }, 0)

        await updateReceipt(receiptId, {
          actual_amount: totalActual,
          status: allConfirmed ? '1' : '0', // 所有品項確認才更新主表狀態
        })
      } catch (error) {
        logger.error(`更新收款單 ${receiptId} 失敗:`, error)
      }
    }

    // 更新訂單的已收款金額和狀態
    for (const [orderId, confirmedAmount] of orderUpdates) {
      try {
        const order = orders.find(o => o.id === orderId)
        if (order) {
          // 計算該訂單所有已確認收款品項的總金額
          const allConfirmedItems = receiptItems.filter(
            ri => ri.order_id === orderId && ri.status === '1'
          )
          const previousConfirmed = allConfirmedItems.reduce(
            (sum, ri) => sum + (ri.actual_amount || 0),
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
      } catch (error) {
        logger.error(`更新訂單 ${orderId} 付款狀態失敗:`, error)
      }
    }

    await invalidateReceiptItems()
    await invalidateReceipts()

    // 顯示結果摘要
    if (failedItems.length === 0) {
      // 全部成功
      await alert(`成功確認 ${successItems.length} 筆收款品項`, 'success')
      onOpenChange(false)
      onSuccess?.()
    } else if (successItems.length === 0) {
      // 全部失敗
      const failedNumbers = failedItems.map(f => f.item.receiptNumber).join('、')
      void alert(`確認失敗：${failedNumbers}`, 'error')
    } else {
      // 部分成功
      const failedNumbers = failedItems.map(f => f.item.receiptNumber).join('、')
      await alert(
        `成功確認 ${successItems.length} 筆\n失敗 ${failedItems.length} 筆：${failedNumbers}`,
        'warning'
      )
      onSuccess?.()
      // 不關閉對話框，讓用戶可以重試失敗的項目
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-morandi-gold" />
            批量確認收款
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {pendingItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-morandi-secondary">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-morandi-green" />
                <p className="text-lg font-medium">{BATCH_CONFIRM_LABELS.NO_PENDING_ITEMS}</p>
                <p className="text-sm mt-1">{BATCH_CONFIRM_LABELS.ALL_CONFIRMED}</p>
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
                  <span className="text-sm font-medium flex items-center gap-1">
                    總計：<CurrencyCell amount={stats.totalAmount} />
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
                    {Array.from(confirmItems.values()).map(confirmItem => (
                      <tr
                        key={confirmItem.item.id}
                        className={cn(
                          'border-b border-border/30 hover:bg-morandi-container/10',
                          confirmItem.selected && 'bg-morandi-gold/5'
                        )}
                      >
                        <td className="py-3 px-3">
                          <Checkbox
                            checked={confirmItem.selected}
                            onCheckedChange={checked =>
                              updateItem(confirmItem.item.id, { selected: !!checked })
                            }
                          />
                        </td>
                        <td className="py-3 px-3 text-morandi-primary font-medium">
                          {confirmItem.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-morandi-primary">
                          {confirmItem.orderNumber || '-'}
                        </td>
                        <td className="py-3 px-3 text-morandi-primary max-w-[200px] truncate">
                          {confirmItem.tourName || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-morandi-container text-morandi-primary">
                            {RECEIPT_TYPE_LABELS[confirmItem.item.receipt_type as ReceiptType] || '未知'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-morandi-primary">
                          <CurrencyCell amount={confirmItem.item.amount} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Input
                            type="number"
                            value={confirmItem.actualAmount || ''}
                            onChange={e =>
                              updateItem(confirmItem.item.id, {
                                actualAmount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={cn(
                              'w-32 text-right h-8',
                              confirmItem.actualAmount !== confirmItem.item.amount &&
                                'border-morandi-gold'
                            )}
                            disabled={!confirmItem.selected}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 金額差異提醒 */}
              {Array.from(confirmItems.values()).some(
                item => item.selected && item.actualAmount !== item.item.amount
              ) && (
                <div className="flex items-center gap-2 p-3 mt-4 border border-morandi-gold/20 rounded-lg bg-morandi-gold/5 text-sm">
                  <AlertCircle className="h-4 w-4 text-morandi-gold flex-shrink-0" />
                  <span className="text-morandi-gold">
                    部分收款品項的實收金額與應收金額不同，請確認
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleBatchConfirm}
            disabled={stats.selected === 0 || isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            {isSubmitting ? '確認中...' : `確認 ${stats.selected} 筆收款`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
