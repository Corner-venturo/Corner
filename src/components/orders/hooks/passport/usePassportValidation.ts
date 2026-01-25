/**
 * usePassportValidation - 護照資料驗證與成員建立
 *
 * 功能：
 * - 上傳護照照片到 Storage
 * - 建立訂單成員
 * - 同步顧客資料
 * - 比對現有顧客
 */

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { createCustomer, invalidateCustomers } from '@/data'
import { logger } from '@/lib/utils/logger'
import { syncPassportImageToMembers } from '@/lib/utils/sync-passport-image'

interface CustomerData {
  name?: string
  english_name?: string
  passport_name?: string
  passport_number?: string
  passport_expiry?: string | null
  national_id?: string
  birth_date?: string | null
  sex?: string
}

interface CreateMemberParams {
  orderId: string
  workspaceId: string
  customerData: CustomerData
  file: File
  fileIndex: number
}

interface CreateMemberResult {
  success: boolean
  memberId?: string
  matchedCustomer?: boolean
  newCustomer?: boolean
  error?: string
}

interface UpdateMemberParams {
  memberId: string
  workspaceId: string
  orderId: string
  customerData: CustomerData
  file: File
  fileIndex: number
}

interface UpdateMemberResult {
  success: boolean
  memberId?: string
  error?: string
}

interface UsePassportValidationReturn {
  uploadPassportImage: (
    file: File,
    workspaceId: string,
    orderId: string,
    index: number
  ) => Promise<string | null>
  createOrderMember: (params: CreateMemberParams) => Promise<CreateMemberResult>
  updateOrderMember: (params: UpdateMemberParams) => Promise<UpdateMemberResult>
}

export function usePassportValidation(): UsePassportValidationReturn {
  // 上傳護照照片
  // 統一使用平坦路徑格式：passport_{timestamp}_{random}.jpg（根目錄）
  // 這與其他上傳功能保持一致，避免巢狀目錄造成的潛在問題
  const uploadPassportImage = useCallback(async (
    file: File,
    workspaceId: string,
    orderId: string,
    index: number
  ): Promise<string | null> => {
    try {
      // 統一格式：passport_{timestamp}_{random}.jpg（根目錄）
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `passport_${Date.now()}_${random}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, file, {
          contentType: 'image/jpeg',
          upsert: true, // 改為 upsert: true，避免檔名衝突導致失敗
        })

      if (uploadError) {
        logger.error('上傳護照照片失敗:', uploadError, { fileName, workspaceId, orderId, index })
        return null
      }

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      const publicUrl = urlData?.publicUrl || null
      if (publicUrl) {
        logger.info(`護照照片上傳成功: ${fileName}`)
      }
      return publicUrl
    } catch (error) {
      logger.error('上傳護照照片異常:', error)
      return null
    }
  }, [])

  // 建立訂單成員
  const createOrderMember = useCallback(async ({
    orderId,
    workspaceId,
    customerData,
    file,
    fileIndex,
  }: CreateMemberParams): Promise<CreateMemberResult> => {
    try {
      // 上傳護照照片
      const passportImageUrl = await uploadPassportImage(file, workspaceId, orderId, fileIndex)

      const passportNumber = customerData.passport_number || ''
      const idNumber = customerData.national_id || ''
      const birthDate = customerData.birth_date || null
      const chineseName = customerData.name || ''
      const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()

      // 建立訂單成員
      const memberData = {
        order_id: orderId,
        workspace_id: workspaceId,
        customer_id: null,
        chinese_name: cleanChineseName || '',
        passport_name: customerData.passport_name || customerData.english_name || '',
        passport_number: passportNumber,
        passport_expiry: customerData.passport_expiry || null,
        birth_date: birthDate,
        id_number: idNumber,
        gender: customerData.sex === '男' ? 'M' : customerData.sex === '女' ? 'F' : null,
        identity: '大人',
        member_type: 'adult',
        passport_image_url: passportImageUrl,
      }

      const { data: newMember, error } = await supabase
        .from('order_members')
        .insert(memberData)
        .select()
        .single()

      if (error) throw error

      // 同步顧客
      let matchedCustomer = false
      let newCustomer = false

      // 驗證身份證格式（1英文+9數字）
      const isValidIdNumber = idNumber && /^[A-Z][12]\d{8}$/i.test(idNumber)
      // 驗證護照號碼格式（9位數字）
      const isValidPassport = passportNumber && /^\d{9}$/.test(passportNumber)
      // 只有完整身份證或護照號碼才嘗試比對/建立顧客
      const canSyncCustomer = isValidIdNumber || isValidPassport

      if (newMember && canSyncCustomer) {
        await invalidateCustomers()
        const { data: freshCustomers } = await supabase.from('customers').select('*')

        const existingCustomer = (freshCustomers || []).find(c => {
          if (isValidPassport && c.passport_number === passportNumber) return true
          if (isValidIdNumber && c.national_id === idNumber) return true
          // 也比對姓名+生日（作為輔助比對，但不會因為這個而建立新顧客）
          if (cleanChineseName && birthDate &&
              c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
              c.birth_date === birthDate) return true
          return false
        })

        if (existingCustomer) {
          const updateData: Record<string, unknown> = {
            customer_id: existingCustomer.id
          }

          if (!newMember.passport_name && existingCustomer.passport_name) {
            updateData.passport_name = existingCustomer.passport_name
          }

          await supabase
            .from('order_members')
            .update(updateData)
            .eq('id', newMember.id)

          if (passportImageUrl && !existingCustomer.passport_image_url) {
            await supabase
              .from('customers')
              .update({ passport_image_url: passportImageUrl })
              .eq('id', existingCustomer.id)

            // 同步護照照片到其他關聯的訂單成員
            await syncPassportImageToMembers(existingCustomer.id, passportImageUrl)
          }

          matchedCustomer = true
        } else {
          // 護照辨識自動建立客戶
          const createdCustomer = await createCustomer({
            name: customerData.name || '',
            english_name: customerData.english_name || null,
            passport_number: passportNumber || null,
            passport_name: customerData.passport_name || null,
            passport_expiry: customerData.passport_expiry || null,
            passport_image_url: passportImageUrl || null,
            national_id: idNumber || null,
            birth_date: birthDate || null,
            gender: customerData.sex === '男' ? 'M' : customerData.sex === '女' ? 'F' : null,
            phone: '',
            member_type: 'potential', // 護照建立的客戶預設為潛在客戶
            is_vip: false,
            is_active: true,
            total_spent: 0,
            total_orders: 0,
            verification_status: 'unverified',
          })

          if (createdCustomer) {
            await supabase
              .from('order_members')
              .update({ customer_id: createdCustomer.id })
              .eq('id', newMember.id)
            newCustomer = true
          }
        }
      }

      return {
        success: true,
        memberId: newMember.id,
        matchedCustomer,
        newCustomer,
      }
    } catch (error) {
      logger.error('建立成員失敗:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      }
    }
  }, [uploadPassportImage])

  // 更新現有成員（用於姓名比對到的情況）
  const updateOrderMember = useCallback(async ({
    memberId,
    workspaceId,
    orderId,
    customerData,
    file,
    fileIndex,
  }: UpdateMemberParams): Promise<UpdateMemberResult> => {
    try {
      // 上傳護照照片
      const passportImageUrl = await uploadPassportImage(file, workspaceId, orderId, fileIndex)

      const passportNumber = customerData.passport_number || ''
      const idNumber = customerData.national_id || ''
      const birthDate = customerData.birth_date || null
      const chineseName = customerData.name || ''
      const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()

      // 更新成員資料（保留原有的 chinese_name，補上 OCR 辨識到的資料）
      const updateData: Record<string, unknown> = {
        passport_name: customerData.passport_name || customerData.english_name || '',
        passport_number: passportNumber,
        passport_expiry: customerData.passport_expiry || null,
        birth_date: birthDate,
        id_number: idNumber,
        gender: customerData.sex === '男' ? 'M' : customerData.sex === '女' ? 'F' : null,
        passport_image_url: passportImageUrl,
      }

      // 如果 OCR 有辨識到中文名，且與現有名稱相同，就不更新（避免覆蓋）
      // 只有在現有名稱為空時才補上
      const { data: existingMember } = await supabase
        .from('order_members')
        .select('chinese_name')
        .eq('id', memberId)
        .single()

      if (!existingMember?.chinese_name && cleanChineseName) {
        updateData.chinese_name = cleanChineseName
      }

      const { error } = await supabase
        .from('order_members')
        .update(updateData)
        .eq('id', memberId)

      if (error) throw error

      logger.log(`已更新成員 ${memberId} 的護照資料`)

      return {
        success: true,
        memberId,
      }
    } catch (error) {
      logger.error('更新成員失敗:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      }
    }
  }, [uploadPassportImage])

  return {
    uploadPassportImage,
    createOrderMember,
    updateOrderMember,
  }
}
