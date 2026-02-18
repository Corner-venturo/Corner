/**
 * order-stats.service.ts - 訂單金額統計重算
 *
 * 提供 total_amount / remaining_amount 的重算邏輯
 * 任何 order_members.total_payable 修改後都應呼叫
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { mutate } from 'swr'

/**
 * 重算訂單的 total_amount 和 remaining_amount
 * 根據 order_members 的 total_payable 加總
 */
export async function recalculateOrderTotal(order_id: string): Promise<void> {
  try {
    // 查該訂單所有 order_members 的 total_payable
    const { data: members_data, error: members_error } = await supabase
      .from('order_members')
      .select('total_payable')
      .eq('order_id', order_id)

    if (members_error) {
      logger.error('[recalculateOrderTotal] Failed to query member amounts:', members_error)
      throw members_error
    }

    const total_amount = (members_data || []).reduce(
      (sum, m) => sum + (m.total_payable || 0),
      0
    )

    // 取得當前已收金額
    const { data: order_data, error: order_error } = await supabase
      .from('orders')
      .select('paid_amount')
      .eq('id', order_id)
      .single()

    if (order_error) {
      logger.error('[recalculateOrderTotal] Failed to query order paid_amount:', order_error)
      throw order_error
    }

    const paid_amount = order_data?.paid_amount || 0
    const remaining_amount = Math.max(0, total_amount - paid_amount)

    // 計算付款狀態
    let payment_status: 'unpaid' | 'partial' | 'paid' = 'unpaid'
    if (paid_amount >= total_amount && total_amount > 0) {
      payment_status = 'paid'
    } else if (paid_amount > 0) {
      payment_status = 'partial'
    }

    // 更新訂單
    const { error: update_error } = await supabase
      .from('orders')
      .update({
        total_amount,
        remaining_amount,
        payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (update_error) {
      logger.error('[recalculateOrderTotal] Failed to update order amounts:', update_error)
      throw update_error
    }

    // 刷新 SWR 快取
    await mutate('orders')

    logger.log('[recalculateOrderTotal] Recalculated:', { order_id, total_amount, remaining_amount, payment_status })
  } catch (error) {
    logger.error('[recalculateOrderTotal] Failed:', error)
    throw error
  }
}
