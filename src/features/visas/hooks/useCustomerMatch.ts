'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface CustomerMatch {
  name: string
  phone: string
  matchedCustomers: Array<{
    id: string
    name: string
    phone: string | null
    date_of_birth: string | null
    national_id: string | null
  }>
}

interface NewCustomerForm {
  name: string
  phone: string
  email: string
  national_id: string
  passport_number: string
  passport_romanization: string
  passport_expiry_date: string
  date_of_birth: string
  gender: string
  notes: string
  passport_image_url: string
}

/**
 * 客戶比對與新增邏輯 Hook
 * 負責處理簽證申請後的客戶比對流程
 */
export function useCustomerMatch() {
  const [showCustomerMatchDialog, setShowCustomerMatchDialog] = useState(false)
  const [pendingCustomers, setPendingCustomers] = useState<CustomerMatch[]>([])
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0)
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    name: '',
    phone: '',
    email: '',
    national_id: '',
    passport_number: '',
    passport_romanization: '',
    passport_expiry_date: '',
    date_of_birth: '',
    gender: '',
    notes: '',
    passport_image_url: '',
  })
  const [isUploadingPassport, setIsUploadingPassport] = useState(false)
  const passportFileInputRef = useRef<HTMLInputElement>(null)

  // 取得當前要比對的人
  const currentPerson = pendingCustomers[currentCustomerIndex]

  // 前往下一位或完成
  const goToNextCustomer = () => {
    if (currentCustomerIndex < pendingCustomers.length - 1) {
      setCurrentCustomerIndex(prev => prev + 1)
    } else {
      // 全部完成
      setShowCustomerMatchDialog(false)
      setShowAddCustomerForm(false)
      setPendingCustomers([])
      setCurrentCustomerIndex(0)
    }
  }

  // 選擇現有客戶（確認是此人）
  const handleSelectExistingCustomer = (customerId: string, customerName: string) => {
    toast.success(`已確認「${customerName}」為現有客戶`)
    goToNextCustomer()
  }

  // 不是現有客戶，開啟新增表單
  const handleAddNewCustomer = () => {
    if (!currentPerson) return

    setNewCustomerForm({
      name: currentPerson.name,
      phone: currentPerson.phone,
      email: '',
      national_id: '',
      passport_number: '',
      passport_romanization: '',
      passport_expiry_date: '',
      date_of_birth: '',
      gender: '',
      notes: '',
      passport_image_url: '',
    })
    setShowAddCustomerForm(true)
  }

  // 更新新增客戶表單
  const updateNewCustomerForm = (field: string, value: string) => {
    setNewCustomerForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // 上傳護照圖片
  const handlePassportImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    setIsUploadingPassport(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `passport_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `passport-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        logger.error('上傳護照圖片失敗:', uploadError)
        toast.error('上傳失敗')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateNewCustomerForm('passport_image_url', urlData.publicUrl)
      toast.success('護照圖片上傳成功')
    } catch (error) {
      logger.error('上傳護照圖片錯誤:', error)
      toast.error('上傳過程發生錯誤')
    } finally {
      setIsUploadingPassport(false)
    }
  }

  // 儲存新客戶
  const handleSaveNewCustomer = async () => {
    try {
      const { useCustomerStore } = await import('@/stores')
      const addCustomer = useCustomerStore.getState().create

      await addCustomer({
        name: newCustomerForm.name,
        phone: newCustomerForm.phone || null,
        email: newCustomerForm.email || null,
        national_id: newCustomerForm.national_id || null,
        passport_number: newCustomerForm.passport_number || null,
        passport_romanization: newCustomerForm.passport_romanization || null,
        passport_expiry_date: newCustomerForm.passport_expiry_date || null,
        passport_image_url: newCustomerForm.passport_image_url || null,
        date_of_birth: newCustomerForm.date_of_birth || null,
        gender: newCustomerForm.gender || null,
        notes: newCustomerForm.notes || null,
        source: 'other',
      } as Parameters<typeof addCustomer>[0])

      toast.success(`已新增「${newCustomerForm.name}」到 CRM`)
      setShowAddCustomerForm(false)
      goToNextCustomer()
    } catch (error) {
      logger.error('新增旅客到 CRM 失敗', error)
      toast.error('新增旅客失敗')
    }
  }

  // 跳過當前旅客
  const handleSkipCustomer = () => {
    setShowAddCustomerForm(false)
    goToNextCustomer()
  }

  // 全部跳過
  const handleSkipAll = () => {
    setShowCustomerMatchDialog(false)
    setShowAddCustomerForm(false)
    setPendingCustomers([])
    setCurrentCustomerIndex(0)
  }

  // 開始客戶比對流程
  const startCustomerMatch = async (peopleToCheck: Array<{ name: string; phone: string }>) => {
    const { useCustomerStore } = await import('@/stores')
    // 🔧 優化：在需要時才載入客戶資料（延遲載入）
    await useCustomerStore.getState().fetchAll()
    const customers = useCustomerStore.getState().items

    // 為每個人找同名的客戶
    const pendingList = peopleToCheck.map(person => {
      const matched = customers
        .filter(c => c.name === person.name)
        .map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          date_of_birth: c.date_of_birth || null,
          national_id: c.national_id || null,
        }))

      return {
        name: person.name,
        phone: person.phone,
        matchedCustomers: matched,
      }
    })

    // 開啟旅客比對視窗
    if (pendingList.length > 0) {
      setPendingCustomers(pendingList)
      setCurrentCustomerIndex(0)
      setShowCustomerMatchDialog(true)
    }
  }

  return {
    // 狀態
    showCustomerMatchDialog,
    setShowCustomerMatchDialog,
    showAddCustomerForm,
    setShowAddCustomerForm,
    currentPerson,
    newCustomerForm,
    isUploadingPassport,
    passportFileInputRef,

    // 方法
    handleSelectExistingCustomer,
    handleAddNewCustomer,
    updateNewCustomerForm,
    handlePassportImageUpload,
    handleSaveNewCustomer,
    handleSkipCustomer,
    handleSkipAll,
    startCustomerMatch,
  }
}
