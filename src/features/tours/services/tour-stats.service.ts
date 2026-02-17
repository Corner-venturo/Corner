/**
 * tour-stats.service.ts - 旅遊團統計數據重算
 *
 * 提供 current_participants 的重算邏輯
 * 任何 order_members 新增/刪除後都應呼叫
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { mutate } from 'swr'

/**
 * 重算旅遊團的 current_participants
 * 計算該團所有訂單下的 order_members 數量
 */
export async function recalculateParticipants(tour_id: string): Promise<void> {
  try {
    // 查該團所有訂單 ID
    const { data: orders_data } = await supabase
      .from('orders')
      .select('id')
      .eq('tour_id', tour_id)

    const order_ids = (orders_data || []).map(o => o.id)

    let participant_count = 0

    if (order_ids.length > 0) {
      // 計算所有訂單下的 order_members 數量
      const { count, error } = await supabase
        .from('order_members')
        .select('*', { count: 'exact', head: true })
        .in('order_id', order_ids)

      if (error) {
        logger.error('查詢團員數量失敗:', error)
        throw error
      }

      participant_count = count || 0
    }

    // 更新 tours.current_participants
    const { error: update_error } = await supabase
      .from('tours')
      .update({
        current_participants: participant_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tour_id)

    if (update_error) {
      logger.error('更新團人數失敗:', update_error)
      throw update_error
    }

    // 刷新 SWR 快取
    await mutate('tours')
    await mutate(`tour-${tour_id}`)

    logger.log('團人數已重算:', { tour_id, current_participants: participant_count })
  } catch (error) {
    logger.error('recalculateParticipants 失敗:', error)
  }
}
