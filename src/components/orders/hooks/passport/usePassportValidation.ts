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
import { useCustomerStore } from '@/stores'
import { logger } from '@/lib/utils/logger'
import type { CreateCustomerData } from '@/types/customer.types'

interface CustomerData {
  name?: string
  english_name?: string
  passport_romanization?: string
  passport_number?: string
  passport_expiry_date?: string | null
  national_id?: string
  date_of_birth?: string | null
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
  const uploadPassportImage = useCallback(async (
    file: File,
    workspaceId: string,
    orderId: string,
    index: number
  ): Promise<string | null> => {
    try {
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${workspaceId}/${orderId}/${timestamp}_${index}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        logger.error('上傳護照照片失敗:', uploadError)
        return null
      }

      const { data: urlData } = supabase.storage
        .from('passport-images')
        .getPublicUrl(fileName)

      return urlData?.publicUrl || null
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
      const birthDate = customerData.date_of_birth || null
      const chineseName = customerData.name || ''
      const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()

      // 建立訂單成員
      const memberData = {
        order_id: orderId,
        workspace_id: workspaceId,
        customer_id: null,
        chinese_name: cleanChineseName || '',
        passport_name: customerData.passport_romanization || customerData.english_name || '',
        passport_number: passportNumber,
        passport_expiry: customerData.passport_expiry_date || null,
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

      if (newMember && (idNumber || birthDate || passportNumber)) {
        await useCustomerStore.getState().fetchAll()
        const freshCustomers = useCustomerStore.getState().items

        const existingCustomer = freshCustomers.find(c => {
          if (passportNumber && c.passport_number === passportNumber) return true
          if (idNumber && c.national_id === idNumber) return true
          if (cleanChineseName && birthDate &&
              c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
              c.date_of_birth === birthDate) return true
          return false
        })

        if (existingCustomer) {
          const updateData: Record<string, unknown> = {
            customer_id: existingCustomer.id
          }

          if (!newMember.passport_name && existingCustomer.passport_romanization) {
            updateData.passport_name = existingCustomer.passport_romanization
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
          }

          matchedCustomer = true
        } else {
          // 護照辨識自動建立客戶
          const customerStore = useCustomerStore.getState()
          // 使用 Partial 類型，讓 store 處理必填欄位的預設值
          const customerInput: Partial<CreateCustomerData> & { name: string; phone: string } = {
            name: customerData.name || '',
            english_name: customerData.english_name || '',
            passport_number: passportNumber,
            passport_romanization: customerData.passport_romanization || '',
            passport_expiry_date: customerData.passport_expiry_date || undefined,
            passport_image_url: passportImageUrl,
            national_id: idNumber,
            date_of_birth: birthDate || undefined,
            gender: customerData.sex === '男' ? 'M' : customerData.sex === '女' ? 'F' : undefined,
            phone: '',
            member_type: 'potential', // 護照建立的客戶預設為潛在客戶
            is_vip: false,
            is_active: true,
            total_spent: 0,
            total_orders: 0,
            verification_status: 'unverified',
          }
          // Store 的 create 方法會自動填入 workspace_id 等必填欄位
          const createdCustomer = await customerStore.create(customerInput as Parameters<typeof customerStore.create>[0])

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
      const birthDate = customerData.date_of_birth || null
      const chineseName = customerData.name || ''
      const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()

      // 更新成員資料（保留原有的 chinese_name，補上 OCR 辨識到的資料）
      const updateData: Record<string, unknown> = {
        passport_name: customerData.passport_romanization || customerData.english_name || '',
        passport_number: passportNumber,
        passport_expiry: customerData.passport_expiry_date || null,
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
