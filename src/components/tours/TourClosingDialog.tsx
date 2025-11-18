/**
 * 結團對話框
 * 顯示結團確認與財務摘要
 */

'use client'

import React, { useState, useEffect } from 'react'
import { FileText, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { closeTour, type TourClosingResult } from '@/services/tour-closing.service'
import { useOrderStore, usePaymentRequestStore } from '@/stores'
import { useAccountingModule } from '@/hooks/use-accounting-module'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TourClosingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourId: string
  tourCode: string
  tourName: string
  onSuccess?: () => void
}

export function TourClosingDialog({
  open,
  onOpenChange,
  tourId,
  tourCode,
  tourName,
  onSuccess,
}: TourClosingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<TourClosingResult | null>(null)

  const orders = useOrderStore(state => state.items)
  const paymentRequests = usePaymentRequestStore(state => state.items)
  const { hasAccounting, isExpired } = useAccountingModule()
  const user = useAuthStore(state => state.user)

  // 計算預覽資料
  useEffect(() => {
    if (!open || !tourId) return

    const tourOrders = orders.filter(o => o.tour_id === tourId)
    const totalRevenue = tourOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)

    const tourOrderIds = tourOrders.map(o => o.id)
    const paidRequests = paymentRequests.filter(
      pr => pr.order_id && tourOrderIds.includes(pr.order_id) && pr.status === 'paid'
    )

    const costs = {
      transportation: 0,
      accommodation: 0,
      meal: 0,
      ticket: 0,
      insurance: 0,
      other: 0,
    }

    paidRequests.forEach(pr => {
      const amount = pr.amount || 0
      switch ((pr as any).supplier_type) {
        case 'transportation':
          costs.transportation += amount
          break
        case 'accommodation':
          costs.accommodation += amount
          break
        case 'meal':
          costs.meal += amount
          break
        case 'attraction':
          costs.ticket += amount
          break
        case 'insurance':
          costs.insurance += amount
          break
        default:
          costs.other += amount
      }
    })

    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    const grossProfit = totalRevenue - totalCost

    setPreview({
      total_revenue: totalRevenue,
      costs,
      total_cost: totalCost,
      gross_profit: grossProfit,
      voucher_count: hasAccounting && !isExpired ? 2 : 0,
    })
  }, [open, tourId, orders, paymentRequests, hasAccounting, isExpired])

  const handleClose = async () => {
    if (!preview) return

    if (preview.total_revenue === 0) {
      toast.error('此團體尚無收款記錄，無法結團')
      return
    }

    if (!confirm(`確定要結團 ${tourCode} - ${tourName} 嗎？\n\n結團後將無法修改訂單與付款資料。`)) {
      return
    }

    try {
      setLoading(true)

      const result = await closeTour(tourId, {
        hasAccounting,
        isExpired,
        workspaceId: user?.workspace_id,
      })

      toast.success(
        <div>
          <div className="font-semibold">結團成功</div>
          <div className="text-sm">
            毛利：NT$ {result.gross_profit.toLocaleString()}
            {result.voucher_count > 0 && ` | 已產生 ${result.voucher_count} 張傳票`}
          </div>
        </div>
      )

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error((error as any).message || '結團失敗')
    } finally {
      setLoading(false)
    }
  }

  if (!preview) return null

  const isProfitable = preview.gross_profit > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            結團確認
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 團體資訊 */}
          <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-lg p-4">
            <div className="text-sm text-[#9E8F81]">團體</div>
            <div className="font-semibold text-[#3D2914]">
              {tourCode} - {tourName}
            </div>
          </div>

          {/* 財務摘要 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 總收入 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">總收入</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                NT$ {preview.total_revenue.toLocaleString()}
              </div>
            </div>

            {/* 總成本 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">總成本</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                NT$ {preview.total_cost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 成本明細 */}
          <div className="bg-white border border-[#E0D8CC] rounded-lg p-4">
            <div className="text-sm font-medium text-[#6B5D52] mb-3">成本明細</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">交通費</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.transportation.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">住宿費</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.accommodation.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">餐飲費</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.meal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">門票費</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.ticket.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">保險費</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.insurance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">其他費用</span>
                <span className="font-medium text-[#3D2914]">
                  NT$ {preview.costs.other.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 毛利 */}
          <div
            className={cn(
              'border rounded-lg p-4',
              isProfitable
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-2 mb-2',
                isProfitable ? 'text-blue-700' : 'text-red-700'
              )}
            >
              {isProfitable ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">毛利</span>
            </div>
            <div className={cn('text-2xl font-bold', isProfitable ? 'text-blue-900' : 'text-red-900')}>
              NT$ {preview.gross_profit.toLocaleString()}
            </div>
          </div>

          {/* 會計傳票提示 */}
          {hasAccounting && !isExpired && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 mb-1">自動產生會計傳票</div>
                  <div className="text-sm text-blue-700">
                    結團後將自動產生 2 張會計傳票：
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>收入傳票：借-預收團費 / 貸-團費收入</li>
                      <li>成本傳票：借-旅遊成本 / 貸-預付團費</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 警告 */}
          {preview.total_revenue === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900">無法結團</div>
                  <div className="text-sm text-red-700">此團體尚無收款記錄</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleClose}
            disabled={loading || preview.total_revenue === 0}
            className="bg-[#C9A961] hover:bg-[#B8985A] text-white"
          >
            {loading ? '處理中...' : '確認結團'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
