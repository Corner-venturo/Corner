import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { mutate } from 'swr'

/**
 * 請款變動後重算團成本統計
 * - 查 payment_requests (status in pending/approved/confirmed/paid)
 * - 加總 payment_request_items.subtotal = total_cost
 * - 更新 tours.total_cost 和 profit
 */
export async function recalculateExpenseStats(tour_id: string): Promise<void> {
  try {
    // 1. 查該團所有有效請款單
    const { data: requests_data, error: requestsError } = await supabase
      .from('payment_requests')
      .select('id')
      .eq('tour_id', tour_id)
      .in('status', ['pending', 'approved', 'confirmed', 'paid'])

    if (requestsError) {
      logger.error('查詢有效請款單失敗:', requestsError)
      throw requestsError
    }

    let total_cost = 0

    if (requests_data && requests_data.length > 0) {
      const request_ids = requests_data.map(r => r.id)

      // 2. 查這些請款單的 items，加總 subtotal
      const { data: items_data, error: itemsError } = await supabase
        .from('payment_request_items')
        .select('subtotal')
        .in('request_id', request_ids)

      if (itemsError) {
        logger.error('查詢請款項目失敗:', itemsError)
        throw itemsError
      }

      total_cost = (items_data || []).reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      )
    }

    // 3. 查 tours.total_revenue
    const { data: tour_data, error: tourError } = await supabase
      .from('tours')
      .select('total_revenue')
      .eq('id', tour_id)
      .single()

    if (tourError) {
      logger.error('查詢團收入失敗:', tourError)
      throw tourError
    }

    const total_revenue = tour_data?.total_revenue || 0
    const profit = total_revenue - total_cost

    // 4. 更新 tours: total_cost, profit
    const { error: updateError } = await supabase
      .from('tours')
      .update({
        total_cost,
        profit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tour_id)

    if (updateError) {
      logger.error('更新團成本失敗:', updateError)
      throw updateError
    }

    // 5. 刷新 SWR 快取
    await mutate(`tour-${tour_id}`)
    await mutate('tours')

    logger.log('Tour 成本數據已更新:', { tour_id, total_cost, profit })
  } catch (error) {
    logger.error('重算團成本失敗:', error)
    throw error
  }
}
