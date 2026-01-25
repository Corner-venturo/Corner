/**
 * 同步顧客護照照片到關聯的訂單成員
 *
 * 當顧客的 passport_image_url 更新時，自動同步到所有關聯的 order_members
 * 這確保了在團員名單中顯示護照眼睛圖示時，資料是最新的
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

/**
 * 同步顧客護照照片到所有關聯的訂單成員
 *
 * @param customerId - 顧客 ID
 * @param passportImageUrl - 新的護照照片 URL（null 表示清除）
 * @returns 更新的成員數量
 */
export async function syncPassportImageToMembers(
  customerId: string,
  passportImageUrl: string | null
): Promise<number> {
  try {
    // 更新所有關聯的 order_members
    // 只更新 passport_image_url 為 null 或等於舊值的成員
    // 這樣如果成員有自己獨立上傳的護照照片，不會被覆蓋
    const { data, error } = await supabase
      .from('order_members')
      .update({ passport_image_url: passportImageUrl })
      .eq('customer_id', customerId)
      .is('passport_image_url', null)
      .select('id')

    if (error) {
      logger.error('同步護照照片到成員失敗:', error)
      return 0
    }

    const updatedCount = data?.length || 0
    if (updatedCount > 0) {
      logger.info(`已同步護照照片到 ${updatedCount} 個訂單成員`)
    }

    return updatedCount
  } catch (error) {
    logger.error('同步護照照片時發生錯誤:', error)
    return 0
  }
}

/**
 * 批次同步顧客護照照片
 * 用於一次性修復現有資料
 *
 * @returns 更新的成員總數
 */
export async function syncAllPassportImages(): Promise<number> {
  try {
    // 找出所有有護照照片的顧客，但關聯成員沒有的情況
    const { data: customersWithImages, error: fetchError } = await supabase
      .from('customers')
      .select('id, passport_image_url')
      .not('passport_image_url', 'is', null)

    if (fetchError || !customersWithImages) {
      logger.error('取得顧客資料失敗:', fetchError)
      return 0
    }

    let totalUpdated = 0

    for (const customer of customersWithImages) {
      const { data, error } = await supabase
        .from('order_members')
        .update({ passport_image_url: customer.passport_image_url })
        .eq('customer_id', customer.id)
        .is('passport_image_url', null)
        .select('id')

      if (!error && data) {
        totalUpdated += data.length
      }
    }

    logger.info(`批次同步完成，共更新 ${totalUpdated} 個訂單成員`)
    return totalUpdated
  } catch (error) {
    logger.error('批次同步護照照片失敗:', error)
    return 0
  }
}
