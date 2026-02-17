/**
 * Customer Verify Hook
 * 管理顧客驗證對話框的狀態和邏輯
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Customer, UpdateCustomerData } from '@/types/customer.types'
import { CUSTOMER_VERIFY_LABELS } from '../constants/labels'

interface UseCustomerVerifyProps {
  onSuccess?: () => void
}

export function useCustomerVerify({ onSuccess }: UseCustomerVerifyProps = {}) {
  // 對話框狀態
  const [isOpen, setIsOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<UpdateCustomerData>>({})
  const [isSaving, setIsSaving] = useState(false)

  /**
   * 打開驗證對話框
   */
  const openDialog = useCallback(async (selectedCustomer: Customer) => {
    // 直接使用客戶資料（護照圖片從 storage 取得）
    setCustomer(selectedCustomer)

    // 初始化表單資料
    setFormData({
      name: selectedCustomer.name,
      passport_name: selectedCustomer.passport_name || '',
      passport_number: selectedCustomer.passport_number || '',
      passport_expiry: selectedCustomer.passport_expiry || '',
      birth_date: selectedCustomer.birth_date || '',
      gender: selectedCustomer.gender || '',
      national_id: selectedCustomer.national_id || '',
      email: selectedCustomer.email || '',
      phone: selectedCustomer.phone || '',
      address: selectedCustomer.address || '',
    })

    setIsOpen(true)
  }, [])

  /**
   * 關閉對話框
   */
  const closeDialog = useCallback(() => {
    setIsOpen(false)
    setCustomer(null)
    setFormData({})
  }, [])

  /**
   * 更新表單資料
   */
  const updateFormData = useCallback((updates: Partial<UpdateCustomerData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  /**
   * 儲存驗證資料
   */
  const saveVerify = useCallback(async () => {
    if (!customer) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          ...formData,
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        } as UpdateCustomerData)
        .eq('id', customer.id)

      if (error) throw error

      toast.success(CUSTOMER_VERIFY_LABELS.VERIFY_SUCCESS)
      closeDialog()

      // 觸發成功回調
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error(CUSTOMER_VERIFY_LABELS.VERIFY_FAILED)
    } finally {
      setIsSaving(false)
    }
  }, [customer, formData, closeDialog, onSuccess])

  return {
    // 狀態
    isOpen,
    customer,
    formData,
    isSaving,

    // 方法
    openDialog,
    closeDialog,
    updateFormData,
    saveVerify,

    // Setters (for advanced use cases)
    setCustomer,
    setFormData,
  }
}
