'use client'

import React, { useState, useMemo } from 'react'
import { X, Check, Calculator, Printer, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tour } from '@/stores/types'
import {
  usePaymentRequests,
  useOrders,
  updateTour,
  createPaymentRequest as createPaymentRequestApi,
} from '@/data'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { generateTourClosingPDF } from '@/lib/pdf/tour-closing-pdf'
import { supabase } from '@/lib/supabase/client'

interface TourClosingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tour: Tour
  onSuccess?: () => void
}

export function TourClosingDialog({
  open,
  onOpenChange,
  tour,
  onSuccess,
}: TourClosingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // 獎金比例設定
  const [salesBonusPercent, setSalesBonusPercent] = useState(5) // 業務獎金 %
  const [opBonusPercent, setOpBonusPercent] = useState(3) // OP 獎金 %

  // 使用 @/data hooks（SWR 自動載入）
  const { items: paymentRequests } = usePaymentRequests()
  const { items: orders } = useOrders()

  // 計算團的總收入（從訂單）
  const tourOrders = useMemo(() => {
    return orders.filter(o => o.tour_id === tour.id)
  }, [orders, tour.id])

  const totalRevenue = useMemo(() => {
    return tourOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  }, [tourOrders])

  // 取得團的成本請款單（排除獎金類型）
  const tourCosts = useMemo(() => {
    return paymentRequests.filter(
      pr => pr.tour_id === tour.id &&
        pr.request_type !== '業務獎金' &&
        pr.request_type !== 'OP獎金'
    )
  }, [paymentRequests, tour.id])

  // 取得團的獎金請款單
  const tourBonuses = useMemo(() => {
    return paymentRequests.filter(
      pr => pr.tour_id === tour.id &&
        (pr.request_type === '業務獎金' || pr.request_type === 'OP獎金')
    )
  }, [paymentRequests, tour.id])

  // 計算總成本
  const totalCost = useMemo(() => {
    return tourCosts.reduce((sum, pr) => sum + (pr.amount || 0), 0)
  }, [tourCosts])

  // 計算獎金
  const salesBonus = useMemo(() => {
    return Math.round(totalRevenue * (salesBonusPercent / 100))
  }, [totalRevenue, salesBonusPercent])

  const opBonus = useMemo(() => {
    return Math.round(totalRevenue * (opBonusPercent / 100))
  }, [totalRevenue, opBonusPercent])

  const totalBonus = salesBonus + opBonus

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 處理結案
  const handleClose = async () => {
    if (!tour.id) return

    setIsSubmitting(true)
    try {
      const now = new Date().toISOString()

      // 1. 產生業務獎金請款單
      if (salesBonus > 0) {
        await createPaymentRequestApi({
          code: `${tour.code}-B01`,
          request_number: `${tour.code}-B01`,
          tour_id: tour.id,
          tour_code: tour.code,
          tour_name: tour.name || tour.location || '',
          request_date: now.split('T')[0],
          request_type: '業務獎金',
          amount: salesBonus,
          status: 'pending',
          note: `${tour.code} 結案獎金 - 業務 ${salesBonusPercent}%`,
        })
      }

      // 2. 產生 OP 獎金請款單
      if (opBonus > 0) {
        await createPaymentRequestApi({
          code: `${tour.code}-B02`,
          request_number: `${tour.code}-B02`,
          tour_id: tour.id,
          tour_code: tour.code,
          tour_name: tour.name || tour.location || '',
          request_date: now.split('T')[0],
          request_type: 'OP獎金',
          amount: opBonus,
          status: 'pending',
          note: `${tour.code} 結案獎金 - OP ${opBonusPercent}%`,
        })
      }

      // 3. 更新團狀態為結案
      await updateTour(tour.id, {
        status: '結案',
        closing_status: 'closed',
        closing_date: now,
        updated_at: now,
      })

      // 4. 封存旅遊團頻道
      try {
        const { error: channelError } = await supabase
          .from('channels')
          .update({
            is_archived: true,
            archived_at: now,
            updated_at: now,
          })
          .eq('tour_id', tour.id)

        if (channelError) {
          logger.warn('封存旅遊團頻道失敗:', channelError)
        } else {
          logger.log(`旅遊團 ${tour.code} 頻道已封存`)
        }
      } catch (error) {
        // 封存頻道失敗不應阻止結案流程
        logger.warn('封存頻道時發生錯誤:', error)
      }

      toast.success('結案完成，獎金請款單已產生')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('結案失敗:', error)
      toast.error('結案失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 列印報表
  const handlePrintReport = async () => {
    setIsPrinting(true)
    try {
      await generateTourClosingPDF({
        tour,
        orders: tourOrders,
        costs: tourCosts,
        bonuses: tourBonuses,
      })
      toast.success('報表已生成')
    } catch (error) {
      logger.error('生成報表失敗:', error)
      toast.error('生成報表失敗')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator size={20} className="text-morandi-gold" />
            結案 - {tour.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 團資訊摘要 */}
          <div className="p-4 bg-morandi-container/30 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-morandi-secondary">團名</span>
              <span className="font-medium">{tour.name || tour.location}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-morandi-secondary">訂單數</span>
              <span className="font-medium">{tourOrders.length} 筆</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-morandi-secondary">總收入</span>
              <span className="font-medium text-morandi-green">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-morandi-secondary">總成本</span>
              <span className="font-medium text-morandi-red">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
              <span className="text-morandi-secondary">毛利</span>
              <span className={`font-bold ${totalRevenue - totalCost >= 0 ? 'text-morandi-gold' : 'text-morandi-red'}`}>
                {formatCurrency(totalRevenue - totalCost)}
              </span>
            </div>
          </div>

          {/* 獎金設定 */}
          <div className="space-y-4">
            <h3 className="font-medium text-morandi-primary">獎金設定</h3>

            {/* 業務獎金 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 text-sm">業務獎金</Label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={salesBonusPercent}
                  onChange={(e) => setSalesBonusPercent(Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-morandi-secondary">%</span>
                <span className="text-morandi-secondary mx-2">=</span>
                <span className="font-medium text-morandi-gold">{formatCurrency(salesBonus)}</span>
              </div>
            </div>

            {/* OP 獎金 */}
            <div className="flex items-center gap-4">
              <Label className="w-24 text-sm">OP 獎金</Label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={opBonusPercent}
                  onChange={(e) => setOpBonusPercent(Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-morandi-secondary">%</span>
                <span className="text-morandi-secondary mx-2">=</span>
                <span className="font-medium text-morandi-gold">{formatCurrency(opBonus)}</span>
              </div>
            </div>

            {/* 總計 */}
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <Label className="w-24 text-sm font-medium">獎金總計</Label>
              <span className="text-lg font-bold text-morandi-gold">{formatCurrency(totalBonus)}</span>
            </div>
          </div>

          {/* 說明 */}
          <div className="p-3 bg-status-warning-bg border border-status-warning rounded-lg">
            <p className="text-sm text-status-warning">
              結案後將自動產生獎金請款單，狀態變更為「結案」。
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handlePrintReport}
            disabled={isPrinting}
            className="gap-2"
          >
            {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            {isPrinting ? '生成中...' : '列印報表'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            {isSubmitting ? '處理中...' : '確認結案'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
