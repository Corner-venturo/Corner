'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useCustomers } from '@/data'
import { Member } from '@/stores/types'
import { useMembers } from '@/hooks/useMembers'
import type { Customer } from '@/types/customer.types'
import { getGenderFromIdNumber, calculateAge } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { alert, confirm } from '@/lib/ui/alert-dialog'

interface EditingMember extends Omit<Member, 'id' | 'created_at' | 'updated_at'> {
  id?: string
  isNew?: boolean
}

interface ProcessedFile {
  file: File
  preview: string
  originalName: string
  isPdf: boolean
}

interface UseMemberViewProps {
  order_id: string
  departure_date: string
  member_count: number
}

export function useMemberView({ order_id, departure_date, member_count }: UseMemberViewProps) {
  // 使用 useOrderMembers Hook 管理成員資料
  const {
    members: orderMembers,
    workspaceId: workspace_id,
    createMember,
    updateMember,
    refetchMembers,
    uploadPassportImage,
  } = useMembers({ orderId: order_id })

  const [tableMembers, setTableMembers] = useState<EditingMember[]>([])

  // 顧客匹配對話框
  const { items: customers } = useCustomers()
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([])
  const [matchType, setMatchType] = useState<'name' | 'id_number'>('name')
  const [pendingMemberIndex, setPendingMemberIndex] = useState<number | null>(null)
  const [pendingMemberData, setPendingMemberData] = useState<EditingMember | null>(null)

  // 護照圖片預覽
  const [showPassportPreview, setShowPassportPreview] = useState(false)
  const [previewMember, setPreviewMember] = useState<EditingMember | null>(null)

  // 護照驗證對話框
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyCustomer, setVerifyCustomer] = useState<Customer | null>(null)

  // 全部編輯模式
  const [isEditMode, setIsEditMode] = useState(false)

  // OCR 相關狀態
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Debounce 計時器
  const saveTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const DEBOUNCE_DELAY = 800 // 800ms debounce

  // SWR 自動載入顧客資料

  // 初始化表格成員
  useEffect(() => {
    const existingMembers: EditingMember[] = orderMembers.map(member => ({ ...member })) as unknown as EditingMember[]

    // 確保至少有member_count行
    while (existingMembers.length < member_count) {
      existingMembers.push({
        order_id,
        name: '',
        name_en: '',
        birthday: '',
        passport_number: '',
        passport_expiry: '',
        id_number: '',
        gender: '',
        reservation_code: '',
        add_ons: [],
        refunds: [],
        isNew: true,
      } as unknown as EditingMember)
    }

    setTableMembers(existingMembers)
  }, [orderMembers, member_count, order_id])

  // 自動儲存成員（帶 debounce）
  const autoSaveMember = useCallback(
    (member: EditingMember, index: number) => {
      // 清除之前的計時器
      const existingTimer = saveTimersRef.current.get(index)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // 設定新的 debounce 計時器
      const timer = setTimeout(async () => {
        if (member.isNew && member.name?.trim()) {
          const { isNew, id, ...memberData } = member
          const created = await createMember(memberData as Omit<Member, 'id' | 'created_at' | 'updated_at' | 'order_id'>)
          const newId = created?.id

          setTableMembers(prev => {
            const updated = [...prev]
            updated[index] = { ...member, id: newId as string, isNew: false }
            return updated
          })
        } else if (member.id && !member.isNew) {
          const { isNew, ...memberData } = member
          await updateMember(member.id, memberData as Partial<Member>)
        }
        saveTimersRef.current.delete(index)
      }, DEBOUNCE_DELAY)

      saveTimersRef.current.set(index, timer)
    },
    [createMember, updateMember]
  )

  // 清理計時器
  useEffect(() => {
    return () => {
      saveTimersRef.current.forEach(timer => clearTimeout(timer))
      saveTimersRef.current.clear()
    }
  }, [])

  // 檢查顧客匹配 - 姓名 2 字以上觸發模糊搜尋
  const checkCustomerMatchByName = useCallback(
    (memberData: EditingMember, index: number) => {
      const name = memberData.name?.trim()
      if (!name || name.length < 2) return false

      // 模糊搜尋：姓名包含輸入的字串
      const nameMatches = customers.filter(c =>
        c.name?.includes(name) || name.includes(c.name || '')
      )

      if (nameMatches.length === 0) {
        return false // 沒有匹配，繼續正常流程
      }

      // 有匹配顧客，顯示選擇對話框讓使用者確認
      setMatchedCustomers(nameMatches)
      setMatchType('name')
      setPendingMemberIndex(index)
      setPendingMemberData(memberData)
      setShowMatchDialog(true)
      return true
    },
    [customers]
  )

  // 檢查顧客匹配 - 身分證字號
  const checkCustomerMatchByIdNumber = useCallback(
    (memberData: EditingMember, index: number) => {
      const idNumber = memberData.id_number?.trim()
      if (!idNumber || idNumber.length < 5) return false

      // 搜尋身分證字號相符的顧客
      const idMatches = customers.filter(c =>
        c.national_id === idNumber
      )

      if (idMatches.length === 0) {
        return false
      }

      // 有匹配顧客，顯示選擇對話框
      setMatchedCustomers(idMatches)
      setMatchType('id_number')
      setPendingMemberIndex(index)
      setPendingMemberData(memberData)
      setShowMatchDialog(true)
      return true
    },
    [customers]
  )

  // 選擇顧客後帶入資料
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      if (pendingMemberIndex === null || !pendingMemberData) return

      const updatedMembers = [...tableMembers]
      const customerGender = customer.gender as 'M' | 'F' | '' | null
      updatedMembers[pendingMemberIndex] = {
        ...pendingMemberData,
        name_en: customer.passport_name || pendingMemberData.name_en,
        passport_number: customer.passport_number || pendingMemberData.passport_number,
        passport_expiry: customer.passport_expiry || pendingMemberData.passport_expiry,
        id_number: customer.national_id || pendingMemberData.id_number,
        birthday: customer.birth_date || pendingMemberData.birthday,
        gender: customerGender || pendingMemberData.gender,
        customer_id: customer.id,
      }
      setTableMembers(updatedMembers)
      setShowMatchDialog(false)
      setPendingMemberIndex(null)
      setPendingMemberData(null)

      // 儲存到 store
      autoSaveMember(updatedMembers[pendingMemberIndex], pendingMemberIndex)
    },
    [pendingMemberIndex, pendingMemberData, tableMembers, autoSaveMember]
  )

  // 處理資料更新 (用於 ReactDataSheet)
  const handleDataUpdate = useCallback(
    (newData: EditingMember[]) => {
      // 處理自動計算欄位
      const processedData = newData.map((member) => {
        const processed = { ...member }

        // 從身分證號自動計算性別和年齡
        if (processed.id_number) {
          processed.gender = getGenderFromIdNumber(processed.id_number)
          const age = calculateAge(processed.id_number, departure_date)
          if (age !== null && 'age' in processed) {
            (processed as EditingMember & { age: number }).age = age
          }
        }
        // 從生日計算年齡
        else if (processed.birthday) {
          const age = calculateAge(String(processed.birthday), departure_date)
          if (age !== null && 'age' in processed) {
            (processed as EditingMember & { age: number }).age = age
          }
        }

        return processed
      })

      setTableMembers(processedData)

      // 檢查是否有姓名或身分證字號變更，觸發顧客匹配
      processedData.forEach((member, index) => {
        const oldMember = tableMembers[index]

        // 姓名有變更（2 字以上），檢查顧客匹配
        if (member.name !== oldMember?.name && member.name?.trim() && member.name.trim().length >= 2) {
          const matched = checkCustomerMatchByName(member, index)
          if (!matched) {
            autoSaveMember(member, index)
          }
          return
        }

        // 身分證字號有變更（5 字以上），檢查顧客匹配
        if (member.id_number !== oldMember?.id_number && member.id_number?.trim() && member.id_number.trim().length >= 5) {
          const matched = checkCustomerMatchByIdNumber(member, index)
          if (!matched) {
            autoSaveMember(member, index)
          }
          return
        }

        // 其他欄位變更，正常儲存
        autoSaveMember(member, index)
      })
    },
    [departure_date, autoSaveMember, checkCustomerMatchByName, checkCustomerMatchByIdNumber, tableMembers]
  )

  // 編輯模式下的欄位變更處理
  const handleEditModeChange = useCallback(
    (index: number, field: keyof EditingMember, value: string) => {
      const updatedMembers = [...tableMembers]
      const member = { ...updatedMembers[index], [field]: value }

      // 從身分證自動計算性別
      if (field === 'id_number' && value) {
        member.gender = getGenderFromIdNumber(value)
      }

      updatedMembers[index] = member
      setTableMembers(updatedMembers)

      // 姓名輸入 2 字以上，觸發顧客搜尋
      if (field === 'name' && value.trim().length >= 2) {
        checkCustomerMatchByName(member, index)
      }

      // 身分證輸入 5 字以上，觸發顧客搜尋
      if (field === 'id_number' && value.trim().length >= 5) {
        checkCustomerMatchByIdNumber(member, index)
      }

      // 自動儲存（debounce）
      autoSaveMember(member, index)
    },
    [tableMembers, checkCustomerMatchByName, checkCustomerMatchByIdNumber, autoSaveMember]
  )

  // 新增行
  const addRow = useCallback(() => {
    const newMember = {
      order_id,
      name: '',
      name_en: '',
      birthday: '',
      passport_number: '',
      passport_expiry: '',
      id_number: '',
      gender: '',
      reservation_code: '',
      add_ons: [],
      refunds: [],
      isNew: true,
    } as unknown as EditingMember
    setTableMembers([...tableMembers, newMember])
  }, [order_id, tableMembers])

  // 點擊姓名查看護照照片或開啟驗證對話框
  const handleNameClick = useCallback(
    (rowData: Record<string, unknown>) => {
      const index = (rowData.index as number) - 1
      const member = tableMembers[index]
      if (!member) return

      // 如果有關聯的顧客且有護照圖片，開啟驗證對話框
      const customerId = member.customer_id
      if (customerId) {
        const customer = customers.find(c => c.id === customerId)
        if (customer && customer.passport_image_url) {
          setVerifyCustomer(customer)
          setShowVerifyDialog(true)
          return
        }
      }

      // 否則只顯示護照圖片預覽
      if (member.passport_image_url) {
        setPreviewMember(member)
        setShowPassportPreview(true)
      }
    },
    [tableMembers, customers]
  )

  // 檢查是否有已填寫的資料
  const hasExistingData = useMemo(
    () => tableMembers.some(m => m.name?.trim() || m.id_number?.trim()),
    [tableMembers]
  )

  return {
    // 資料
    tableMembers,
    customers,
    workspace_id,
    orderMembers,

    // 匹配對話框狀態
    showMatchDialog,
    setShowMatchDialog,
    matchedCustomers,
    matchType,
    pendingMemberIndex,
    setPendingMemberIndex,
    pendingMemberData,
    setPendingMemberData,

    // 護照預覽狀態
    showPassportPreview,
    setShowPassportPreview,
    previewMember,
    setPreviewMember,

    // 驗證對話框狀態
    showVerifyDialog,
    setShowVerifyDialog,
    verifyCustomer,
    setVerifyCustomer,

    // 編輯模式
    isEditMode,
    setIsEditMode,

    // OCR 相關狀態
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    processedFiles,
    setProcessedFiles,
    isUploading,
    setIsUploading,
    isDragging,
    setIsDragging,
    isProcessing,
    setIsProcessing,

    // 方法
    handleDataUpdate,
    handleEditModeChange,
    handleSelectCustomer,
    handleNameClick,
    addRow,
    autoSaveMember,
    refetchMembers,
    uploadPassportImage,
    createMember,
    updateMember,
    hasExistingData,
  }
}

export type { EditingMember, ProcessedFile }
