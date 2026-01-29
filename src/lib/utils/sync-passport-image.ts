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

// 衝突成員資訊
interface ConflictMember {
  id: string
  orderId: string
  orderCode?: string
  tourName?: string
  memberName?: string
  conflictFields: string[]
}

/**
 * 檢查是否有衝突的訂單成員
 *
 * @param customerId - 顧客 ID
 * @param passportData - 要同步的護照資料
 * @returns 有衝突的成員列表
 */
export async function checkMemberConflicts(
  customerId: string,
  passportData: PassportData
): Promise<ConflictMember[]> {
  try {
    // 查詢關聯的 order_members
    const { data: members, error } = await supabase
      .from('order_members')
      .select(`
        id,
        order_id,
        chinese_name,
        passport_number,
        passport_name,
        passport_expiry,
        birth_date,
        gender,
        id_number,
        orders!inner(code, tour_name)
      `)
      .eq('customer_id', customerId)

    if (error || !members) {
      return []
    }

    const conflicts: ConflictMember[] = []

    for (const member of members) {
      const conflictFields: string[] = []

      // 檢查每個欄位是否有衝突（成員有值且與新值不同）
      if (passportData.passport_number && member.passport_number &&
          member.passport_number !== passportData.passport_number) {
        conflictFields.push('護照號碼')
      }
      if (passportData.passport_expiry && member.passport_expiry &&
          member.passport_expiry !== passportData.passport_expiry) {
        conflictFields.push('護照效期')
      }
      if (passportData.passport_name && member.passport_name &&
          member.passport_name !== passportData.passport_name) {
        conflictFields.push('護照拼音')
      }
      if (passportData.birth_date && member.birth_date &&
          member.birth_date !== passportData.birth_date) {
        conflictFields.push('生日')
      }

      if (conflictFields.length > 0) {
        const order = member.orders as { code?: string; tour_name?: string } | null
        conflicts.push({
          id: member.id,
          orderId: member.order_id,
          orderCode: order?.code,
          tourName: order?.tour_name,
          memberName: member.chinese_name || undefined,
          conflictFields,
        })
      }
    }

    return conflicts
  } catch (error) {
    logger.error('檢查成員衝突失敗:', error)
    return []
  }
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
    // 使用 RPC 函數處理 uuid/text 類型轉換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('sync_passport_to_order_members', {
      p_customer_id: customerId,
      p_passport_number: passportData.passport_number ?? null,
      p_passport_name: passportData.passport_name ?? null,
      p_passport_expiry: passportData.passport_expiry ?? null,
      p_passport_image_url: passportData.passport_image_url ?? null,
      p_birth_date: passportData.birth_date ?? null,
      p_gender: passportData.gender ?? null,
      p_id_number: passportData.national_id ?? null,
    })

    if (error) {
      logger.error('同步護照資料到成員失敗:', error)
      return 0
    }

    const updatedCount = (data as number) || 0
    if (updatedCount > 0) {
      logger.info(`已同步護照資料到 ${updatedCount} 個訂單成員`)
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
