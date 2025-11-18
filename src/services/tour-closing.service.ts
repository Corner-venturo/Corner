/**
 * 結團服務
 * 建立日期：2025-11-17
 *
 * 功能：
 * 1. 計算團體總收入
 * 2. 計算團體總成本
 * 3. 自動產生會計傳票（收入 + 成本）
 * 4. 更新團體狀態為已結團
 */

import { useTourStore, useOrderStore, usePaymentRequestStore } from '@/stores'
import { generateVouchersFromTourClosing } from '@/services/voucher-auto-generator'
import { logger } from '@/lib/utils/logger'

export interface TourClosingResult {
  total_revenue: number
  costs: {
    transportation: number
    accommodation: number
    meal: number
    ticket: number
    insurance: number
    other: number
  }
  total_cost: number
  gross_profit: number
  voucher_count: number // 產生的傳票數量
}

/**
 * 結團處理
 */
export async function closeTour(
  tourId: string,
  options?: {
    hasAccounting?: boolean
    isExpired?: boolean
    workspaceId?: string
  }
): Promise<TourClosingResult> {
  const tourStore = useTourStore.getState()
  const orderStore = useOrderStore.getState()
  const paymentRequestStore = usePaymentRequestStore.getState()

  // 1. 取得團體資訊
  const tour = tourStore.items.find(t => t.id === tourId)
  if (!tour) {
    throw new Error(`找不到團體: ${tourId}`)
  }

  if (tour.archived) {
    throw new Error('此團體已結團')
  }

  // 2. 計算總收入（訂單已收款金額）
  const tourOrders = orderStore.items.filter(o => o.tour_id === tourId)
  const totalRevenue = tourOrders.reduce((sum, order) => sum + (order.paid_amount || 0), 0)

  if (totalRevenue === 0) {
    throw new Error('此團體尚無收款記錄，無法結團')
  }

  // 3. 計算總成本（按類別分類）
  const tourOrderIds = tourOrders.map(o => o.id)
  const paidRequests = paymentRequestStore.items.filter(
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
    switch (pr.supplier_type) {
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

  logger.info('📊 結團計算完成', {
    tourCode: tour.code,
    totalRevenue,
    totalCost,
    grossProfit,
  })

  // 4. 自動產生會計傳票（如果啟用會計模組）
  let voucherCount = 0
  if (options?.hasAccounting && !options?.isExpired && options?.workspaceId) {
    try {
      const closingDate = new Date().toISOString().split('T')[0]

      await generateVouchersFromTourClosing({
        workspace_id: options.workspaceId,
        tour_id: tourId,
        tour_code: tour.code || '',
        closing_date: closingDate,
        total_revenue: totalRevenue,
        costs,
      })

      voucherCount = 2 // 收入傳票 + 成本傳票
      logger.info('✅ 結團傳票已自動產生', { tourId, voucherCount })
    } catch (error) {
      logger.error('❌ 結團傳票產生失敗（不影響結團）:', error)
      // 不阻斷結團流程
    }
  }

  // 5. 更新團體狀態為已結團
  await tourStore.update(tourId, {
    archived: true,
    closing_date: new Date().toISOString(),
    closing_status: 'closed',
  })

  logger.info('✅ 結團完成', { tourId, tourCode: tour.code })

  return {
    total_revenue: totalRevenue,
    costs,
    total_cost: totalCost,
    gross_profit: grossProfit,
    voucher_count: voucherCount,
  }
}

/**
 * 取消結團
 */
export async function reopenTour(tourId: string): Promise<void> {
  const tourStore = useTourStore.getState()

  const tour = tourStore.items.find(t => t.id === tourId)
  if (!tour) {
    throw new Error(`找不到團體: ${tourId}`)
  }

  if (!tour.archived) {
    throw new Error('此團體尚未結團')
  }

  await tourStore.update(tourId, {
    archived: false,
    closing_date: null,
    closing_status: 'pending',
  })

  logger.warn('⚠️ 結團已取消，請手動作廢相關傳票', { tourId })
}
