/**
 * Receipt Financials Utils
 * 收款單財務計算工具函數
 */

import { logger } from '@/lib/utils/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

interface UpdateOrderPaymentStatusResult {
  success: boolean
  paidAmount: number
  paymentStatus: 'unpaid' | 'partial' | 'paid'
}

/**
 * @deprecated 請改用 recalculateReceiptStats from receipt-core.service.ts
 * 更新訂單的已收金額和付款狀態
 */
export async function updateOrderPaymentStatus(
  supabase: SupabaseClient,
  orderId: string,
  newReceiptAmount: number
): Promise<UpdateOrderPaymentStatusResult> {
  logger.warn('[DEPRECATED] updateOrderPaymentStatus 已棄用，請改用 recalculateReceiptStats from receipt-core.service.ts')
  // 先取得訂單的總金額
  const { data: orderData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('id', orderId)
    .single()

  const orderTotalAmount = orderData?.total_amount || 0

  // 計算該訂單所有已確認收款的總金額
  const { data: orderReceipts } = await supabase
    .from('receipts')
    .select('actual_amount, status')
    .eq('order_id', orderId)

  const totalPaid = (orderReceipts || [])
    .filter(r => r.status === '1') // 只計算已確認的
    .reduce((sum, r) => sum + (r.actual_amount || 0), 0)

  // 加上這次新增的收款（待確認狀態，但已收金額先累計）
  const newTotalPaid = totalPaid + newReceiptAmount

  // 計算付款狀態
  let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
  if (newTotalPaid >= orderTotalAmount && orderTotalAmount > 0) {
    paymentStatus = 'paid'
  } else if (newTotalPaid > 0) {
    paymentStatus = 'partial'
  }

  // 更新訂單的已收金額和付款狀態
  const { error } = await supabase
    .from('orders')
    .update({
      paid_amount: newTotalPaid,
      remaining_amount: Math.max(0, orderTotalAmount - newTotalPaid),
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    logger.error('更新訂單付款狀態失敗:', error)
    throw error
  }

  logger.log('訂單已收金額和狀態已更新:', {
    order_id: orderId,
    paid_amount: newTotalPaid,
    payment_status: paymentStatus,
  })

  return {
    success: true,
    paidAmount: newTotalPaid,
    paymentStatus,
  }
}

interface UpdateTourFinancialsResult {
  success: boolean
  totalRevenue: number
  profit: number
}

/**
 * @deprecated 請改用 recalculateReceiptStats from receipt-core.service.ts
 * 更新團的財務數據（總收入和利潤）
 */
export async function updateTourFinancials(
  supabase: SupabaseClient,
  tourId: string
): Promise<UpdateTourFinancialsResult> {
  logger.warn('[DEPRECATED] updateTourFinancials 已棄用，請改用 recalculateReceiptStats from receipt-core.service.ts')
  // 取得該團所有訂單 ID
  const { data: tourOrdersData } = await supabase
    .from('orders')
    .select('id')
    .eq('tour_id', tourId)

  const orderIds = (tourOrdersData || []).map(o => o.id)

  // 查詢所有相關收款：透過 order_id 或直接透過 tour_id
  let receiptsQuery = supabase
    .from('receipts')
    .select('actual_amount, receipt_amount, status')

  if (orderIds.length > 0) {
    // 有訂單：查詢 order_id 在訂單列表中 OR tour_id 直接等於該團
    receiptsQuery = receiptsQuery.or(`order_id.in.(${orderIds.join(',')}),tour_id.eq.${tourId}`)
  } else {
    // 沒有訂單：只查詢直接關聯到團的收款
    receiptsQuery = receiptsQuery.eq('tour_id', tourId)
  }

  const { data: receiptsData } = await receiptsQuery

  // 計算總收入（已確認用 actual_amount，待確認用 receipt_amount）
  const totalRevenue = (receiptsData || [])
    .reduce((sum, r) => {
      if (r.status === '1') {
        return sum + (r.actual_amount || 0)
      } else {
        return sum + (r.receipt_amount || 0)
      }
    }, 0)

  // 取得當前成本
  const { data: currentTour } = await supabase
    .from('tours')
    .select('total_cost')
    .eq('id', tourId)
    .single()

  const totalCost = currentTour?.total_cost || 0
  const profit = totalRevenue - totalCost

  // 更新 tour
  const { error } = await supabase
    .from('tours')
    .update({
      total_revenue: totalRevenue,
      profit: profit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tourId)

  if (error) {
    logger.error('更新團財務數據失敗:', error)
    throw error
  }

  logger.log('團財務數據已更新:', { tour_id: tourId, total_revenue: totalRevenue, profit })

  return {
    success: true,
    totalRevenue,
    profit,
  }
}

/**
 * 刷新 SWR 快取
 */
export async function invalidateFinanceCache(tourId?: string | null): Promise<void> {
  const { mutate } = await import('swr')

  const promises: Promise<unknown>[] = [
    mutate('tours'),
    mutate('orders'),
    mutate('receipts'),
  ]

  if (tourId) {
    promises.push(mutate(`tour-${tourId}`))
  }

  await Promise.all(promises)
}
