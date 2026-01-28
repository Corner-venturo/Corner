/**
 * 同步顧客護照資料到關聯的訂單成員
 *
 * 當顧客的護照資料更新時，自動同步到所有關聯的 order_members
 * 這確保了訂單成員名單中的護照資料是最新的
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'

// 護照資料同步欄位
interface PassportData {
  passport_number?: string | null
  passport_name?: string | null
  passport_expiry?: string | null
  passport_image_url?: string | null
  birth_date?: string | null
  gender?: string | null
  national_id?: string | null  // 對應 order_members 的 id_number
}

/**
 * 同步顧客護照照片到所有關聯的訂單成員（舊版，保持向後相容）
 *
 * @param customerId - 顧客 ID
 * @param passportImageUrl - 新的護照照片 URL（null 表示清除）
 * @returns 更新的成員數量
 */
export async function syncPassportImageToMembers(
  customerId: string,
  passportImageUrl: string | null
): Promise<number> {
  return syncPassportDataToMembers(customerId, { passport_image_url: passportImageUrl })
}

/**
 * 同步顧客所有護照資料到所有關聯的訂單成員
 *
 * @param customerId - 顧客 ID
 * @param passportData - 要同步的護照資料
 * @returns 更新的成員數量
 */
export async function syncPassportDataToMembers(
  customerId: string,
  passportData: PassportData
): Promise<number> {
  try {
    // 建立更新資料，只包含有值的欄位
    const updateData: Record<string, string | null> = {}

    if (passportData.passport_number !== undefined) {
      updateData.passport_number = passportData.passport_number
    }
    if (passportData.passport_name !== undefined) {
      updateData.passport_name = passportData.passport_name
    }
    if (passportData.passport_expiry !== undefined) {
      updateData.passport_expiry = passportData.passport_expiry
    }
    if (passportData.passport_image_url !== undefined) {
      updateData.passport_image_url = passportData.passport_image_url
    }
    if (passportData.birth_date !== undefined) {
      updateData.birth_date = passportData.birth_date
    }
    if (passportData.gender !== undefined) {
      updateData.gender = passportData.gender
    }
    if (passportData.national_id !== undefined) {
      updateData.id_number = passportData.national_id  // 對應 order_members 的欄位名
    }

    if (Object.keys(updateData).length === 0) {
      return 0
    }

    // 更新所有關聯的 order_members
    const { data, error } = await supabase
      .from('order_members')
      .update(updateData)
      .eq('customer_id', customerId)
      .select('id')

    if (error) {
      logger.error('同步護照資料到成員失敗:', error)
      return 0
    }

    const updatedCount = data?.length || 0
    if (updatedCount > 0) {
      logger.info(`已同步護照資料到 ${updatedCount} 個訂單成員`, Object.keys(updateData))
    }

    return updatedCount
  } catch (error) {
    logger.error('同步護照資料時發生錯誤:', error)
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
