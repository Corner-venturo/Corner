'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, X, Hash, Upload, FileImage, Eye, FileText, AlertTriangle, Pencil, Check, ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react'
import { formatPassportExpiryWithStatus } from '@/lib/utils/passport-expiry'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useCustomerStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'

interface OrderMember {
  id: string
  order_id: string
  customer_id?: string | null
  identity?: string | null
  chinese_name?: string | null
  passport_name?: string | null
  birth_date?: string | null
  age?: number | null
  id_number?: string | null
  gender?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  special_meal?: string | null
  pnr?: string | null
  flight_cost?: number | null
  hotel_1_name?: string | null
  hotel_1_checkin?: string | null
  hotel_1_checkout?: string | null
  hotel_2_name?: string | null
  hotel_2_checkin?: string | null
  hotel_2_checkout?: string | null
  hotel_confirmation?: string | null
  checked_in?: boolean | null
  checked_in_at?: string | null
  transport_cost?: number | null
  misc_cost?: number | null
  total_payable?: number | null
  deposit_amount?: number | null
  balance_amount?: number | null
  deposit_receipt_no?: string | null
  balance_receipt_no?: string | null
  remarks?: string | null
  cost_price?: number | null
  selling_price?: number | null
  profit?: number | null
  passport_image_url?: string | null
  // 關聯的顧客驗證狀態（從 join 查詢取得）
  customer_verification_status?: string | null
}

// PDF 轉 JPG 需要的類型
interface ProcessedFile {
  file: File
  preview: string
  originalName: string
  isPdf: boolean
}

interface OrderMembersExpandableProps {
  orderId: string
  tourId: string
  workspaceId: string
  onClose: () => void
}

export function OrderMembersExpandable({
  orderId,
  tourId,
  workspaceId,
  onClose,
}: OrderMembersExpandableProps) {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [loading, setLoading] = useState(false)
  const [departureDate, setDepartureDate] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [memberCountToAdd, setMemberCountToAdd] = useState<number | ''>(1)
  const [showIdentityColumn, setShowIdentityColumn] = useState(false) // 控制身份欄位顯示
  const [isComposing, setIsComposing] = useState(false) // 追蹤是否正在使用輸入法
  const [isAllEditMode, setIsAllEditMode] = useState(false) // 全部編輯模式

  // 護照上傳相關狀態
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 照片預覽相關狀態
  const [previewMember, setPreviewMember] = useState<OrderMember | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // 驗證/編輯彈窗相關狀態
  const [editingMember, setEditingMember] = useState<OrderMember | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState<'verify' | 'edit'>('edit')
  const [editFormData, setEditFormData] = useState<Partial<OrderMember>>({})
  const [isSaving, setIsSaving] = useState(false)

  // 護照圖片縮放相關狀態
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageRotation, setImageRotation] = useState(0) // 旋轉角度 (0, 90, 180, 270)
  const [isImageDragging, setIsImageDragging] = useState(false)
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)


  // 定義可編輯欄位的順序（用於方向鍵導航）
  const editableFields = showIdentityColumn
    ? ['identity', 'chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']
    : ['chinese_name', 'passport_name', 'birth_date', 'gender', 'id_number', 'passport_number', 'passport_expiry', 'special_meal']

  // 載入成員資料和出發日期
  useEffect(() => {
    loadMembers()
    loadTourDepartureDate()
  }, [orderId, tourId])

  const loadTourDepartureDate = async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('departure_date')
        .eq('id', tourId)
        .single()

      if (error) throw error
      setDepartureDate(data?.departure_date || null)
    } catch (error) {
      logger.error('載入出發日期失敗:', error)
    }
  }

  const loadMembers = async () => {
    setLoading(true)
    try {
      // 載入訂單成員
      const { data: membersData, error: membersError } = await supabase
        .from('order_members')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (membersError) throw membersError

      // 收集所有有 customer_id 的成員
      const customerIds = (membersData || [])
        .map(m => m.customer_id)
        .filter(Boolean) as string[]

      // 如果有 customer_id，批次查詢顧客驗證狀態
      let customerStatusMap: Record<string, string> = {}
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, verification_status')
          .in('id', customerIds)

        if (customersData) {
          customerStatusMap = Object.fromEntries(
            customersData.map(c => [c.id, c.verification_status || ''])
          )
        }
      }

      // 合併驗證狀態到成員
      const membersWithStatus = (membersData || []).map(m => ({
        ...m,
        customer_verification_status: m.customer_id ? customerStatusMap[m.customer_id] || null : null,
      }))

      setMembers(membersWithStatus)
    } catch (error) {
      logger.error('載入成員失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    setIsAddDialogOpen(true)
  }

  const confirmAddMembers = async () => {
    // 如果是空白或無效數字，預設為 1
    const count = typeof memberCountToAdd === 'number' ? memberCountToAdd : 1

    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: orderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers as any)
        .select()

      if (error) throw error
      setMembers([...members, ...(data || [])])
      setIsAddDialogOpen(false)
      setMemberCountToAdd(1)
    } catch (error) {
      logger.error('新增成員失敗:', error)
      await alert('新增失敗', 'error')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    const confirmed = await confirm('確定要刪除此成員嗎？', {
      title: '刪除成員',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase.from('order_members').delete().eq('id', memberId)

      if (error) throw error
      setMembers(members.filter(m => m.id !== memberId))
    } catch (error) {
      logger.error('刪除成員失敗:', error)
      await alert('刪除失敗', 'error')
    }
  }

  // 打開編輯/驗證彈窗
  const openEditDialog = (member: OrderMember, mode: 'verify' | 'edit') => {
    setEditingMember(member)
    setEditMode(mode)
    setEditFormData({
      chinese_name: member.chinese_name || '',
      passport_name: member.passport_name || '',
      birth_date: member.birth_date || '',
      gender: member.gender || '',
      id_number: member.id_number || '',
      passport_number: member.passport_number || '',
      passport_expiry: member.passport_expiry || '',
      special_meal: member.special_meal || '',
      remarks: member.remarks || '',
    })
    // 重置圖片縮放和旋轉狀態
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    setImageRotation(0)
    setIsEditDialogOpen(true)
  }

  // 旋轉圖片並轉成 base64
  const rotateImage = (imageUrl: string, rotation: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }

        // 90 或 270 度旋轉時，寬高需要交換
        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        // 移動到中心點
        ctx.translate(canvas.width / 2, canvas.height / 2)
        // 旋轉
        ctx.rotate((rotation * Math.PI) / 180)
        // 畫圖片（從中心點偏移回去）
        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        // 轉成 base64
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  // 儲存編輯/驗證（同步更新 order_members + customers）
  const handleSaveEdit = async () => {
    if (!editingMember) return
    setIsSaving(true)

    try {
      const customerStore = useCustomerStore.getState()

      // 0. 如果有旋轉，先處理圖片
      let newPassportImageUrl = editingMember.passport_image_url
      if (imageRotation !== 0 && editingMember.passport_image_url) {
        try {
          newPassportImageUrl = await rotateImage(editingMember.passport_image_url, imageRotation)
        } catch (err) {
          logger.error('旋轉圖片失敗:', err)
          // 繼續儲存其他資料，不因為圖片旋轉失敗而中斷
        }
      }

      // 1. 更新 order_members
      const memberUpdateData: Record<string, unknown> = {
        chinese_name: editFormData.chinese_name,
        passport_name: editFormData.passport_name,
        birth_date: editFormData.birth_date,
        gender: editFormData.gender,
        id_number: editFormData.id_number,
        passport_number: editFormData.passport_number,
        passport_expiry: editFormData.passport_expiry,
        special_meal: editFormData.special_meal,
        remarks: editFormData.remarks,
      }

      // 如果有旋轉，更新護照圖片
      if (imageRotation !== 0 && newPassportImageUrl) {
        memberUpdateData.passport_image_url = newPassportImageUrl
      }

      const { error: memberError } = await supabase
        .from('order_members')
        .update(memberUpdateData)
        .eq('id', editingMember.id)

      if (memberError) throw memberError

      // 2. 如果有關聯的顧客，同步更新 customers
      if (editingMember.customer_id) {
        const customerUpdateData: Record<string, unknown> = {
          name: editFormData.chinese_name,
          passport_romanization: editFormData.passport_name,
          date_of_birth: editFormData.birth_date,
          gender: editFormData.gender,
          national_id: editFormData.id_number,
          passport_number: editFormData.passport_number,
          passport_expiry_date: editFormData.passport_expiry,
        }

        // 如果有旋轉，同步更新顧客護照圖片
        if (imageRotation !== 0 && newPassportImageUrl) {
          customerUpdateData.passport_image_url = newPassportImageUrl
        }

        // 儲存時自動更新驗證狀態為 verified（無論是編輯或驗證模式）
        // 因為使用者已經看過並確認資料了
        customerUpdateData.verification_status = 'verified'

        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', editingMember.customer_id)

        if (customerError) {
          logger.error('更新顧客失敗:', customerError)
        } else {
          // 更新 store
          await customerStore.fetchAll()
        }
      }

      // 3. 更新本地狀態（儲存後即為已驗證）
      setMembers(members.map(m =>
        m.id === editingMember.id
          ? {
              ...m,
              ...memberUpdateData,
              customer_verification_status: 'verified',
            }
          : m
      ))

      // 4. 關閉彈窗
      setIsEditDialogOpen(false)
      setEditingMember(null)
      void alert(editMode === 'verify' ? '驗證完成！' : '儲存成功！', 'success')
    } catch (error) {
      logger.error('儲存失敗:', error)
      void alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 全形轉半形工具函式（只轉換全形英數字和標點符號，不影響中文和注音）
  const toHalfWidth = (str: string): string => {
    return str.replace(/[\uFF01-\uFF5E]/g, (s) => {
      // 全形字符範圍 FF01-FF5E 對應半形 21-7E
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    })
  }

  // 更新本地狀態（不立即寫入資料庫，不做任何轉換）
  const updateLocalField = (memberId: string, field: keyof OrderMember, value: string | number) => {
    setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: value } : m)))
  }

  // 鍵盤導航處理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, memberIndex: number, fieldName: string) => {
    const currentFieldIndex = editableFields.indexOf(fieldName)

    // 性別欄位：Enter 切換性別
    if (fieldName === 'gender' && e.key === 'Enter') {
      e.preventDefault()
      const member = members[memberIndex]
      const currentGender = member.gender
      const newGender = !currentGender ? 'M' : currentGender === 'M' ? 'F' : ''
      updateField(member.id, 'gender', newGender)
      return
    }

    // Enter / 下鍵：移動到下一列同一欄位
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextMemberIndex = memberIndex + 1
      if (nextMemberIndex < members.length) {
        const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        nextInput?.focus()
      }
    }
    // 上鍵：移動到上一列同一欄位
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevMemberIndex = memberIndex - 1
      if (prevMemberIndex >= 0) {
        const prevInput = document.querySelector(`input[data-member="${members[prevMemberIndex].id}"][data-field="${fieldName}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
    // Tab：移動到右邊欄位
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex < editableFields.length - 1) {
        const nextField = editableFields[currentFieldIndex + 1]
        const nextInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${nextField}"]`) as HTMLInputElement
        nextInput?.focus()
      } else {
        // 最後一欄，移到下一列第一欄
        const nextMemberIndex = memberIndex + 1
        if (nextMemberIndex < members.length) {
          const firstField = editableFields[0]
          const nextInput = document.querySelector(`input[data-member="${members[nextMemberIndex].id}"][data-field="${firstField}"]`) as HTMLInputElement
          nextInput?.focus()
        }
      }
    }
    // Shift+Tab：移動到左邊欄位
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (currentFieldIndex > 0) {
        const prevField = editableFields[currentFieldIndex - 1]
        const prevInput = document.querySelector(`input[data-member="${members[memberIndex].id}"][data-field="${prevField}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    }
  }

  // 直接更新欄位到資料庫和本地狀態
  const updateField = async (memberId: string, field: keyof OrderMember, value: string | number) => {
    // 先更新本地狀態（即時反應）
    updateLocalField(memberId, field, value)

    // 如果正在使用輸入法，延遲資料庫寫入
    if (isComposing) {
      return
    }

    // 如果是字串，自動轉半形
    let processedValue: string | number | null = value
    if (typeof value === 'string') {
      processedValue = toHalfWidth(value)
    }

    // 如果是空字串，對於日期欄位轉成 null
    if (processedValue === '' && (field.includes('date') || field.includes('expiry'))) {
      processedValue = null
    }

    try {
      const { error } = await supabase
        .from('order_members')
        .update({ [field]: processedValue })
        .eq('id', memberId)

      if (error) throw error

      // 確保本地狀態同步（使用處理過的值）
      setMembers(members.map(m => (m.id === memberId ? { ...m, [field]: processedValue } : m)))
    } catch (error) {
      logger.error('更新失敗:', error)
      // 失敗時回滾本地狀態
      loadMembers()
    }
  }

  // 自動格式化日期輸入 (YYYY-MM-DD)
  const handleDateInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 只保留數字
    const numbers = value.replace(/\D/g, '')

    // 如果是空字串，立即更新為 null
    if (numbers.length === 0) {
      updateField(memberId, field, '')
      return
    }

    // 只顯示數字，不加分隔符號（讓使用者看到純數字）
    let formatted = numbers.slice(0, 8) // 最多 8 位數字

    // 只在輸入完整日期（8 位數字）時才格式化並存入資料庫
    if (numbers.length === 8) {
      formatted = numbers.slice(0, 4) + '-' + numbers.slice(4, 6) + '-' + numbers.slice(6, 8)
      updateField(memberId, field, formatted)

      // 如果是護照效期，檢查是否不足 6 個月
      if (field === 'passport_expiry' && departureDate) {
        checkPassportExpiry(formatted)
      }
    } else {
      // 輸入中途：只更新本地顯示（純數字，無分隔符號）
      setMembers(
        members.map(m => (m.id === memberId ? { ...m, [field]: formatted } : m))
      )
    }
  }

  // 檢查護照效期是否不足 6 個月
  const checkPassportExpiry = (expiryDate: string) => {
    if (!departureDate) return

    const expiry = new Date(expiryDate || '')
    const departure = new Date(departureDate || '')
    const sixMonthsBeforeDeparture = new Date(departure)
    sixMonthsBeforeDeparture.setMonth(sixMonthsBeforeDeparture.getMonth() - 6)

    if (expiry < sixMonthsBeforeDeparture) {
      void alert(
        `護照效期警告\n\n護照效期：${expiryDate}\n出發日期：${departureDate}\n\n護照效期不足出發日 6 個月，請提醒客戶更換護照！`,
        'warning'
      )
    }
  }

  // 根據台灣身分證號碼自動辨識性別
  const handleIdNumberChange = (memberId: string, value: string) => {
    // 先轉大寫和半形
    const processedValue = toHalfWidth(value).toUpperCase()
    updateField(memberId, 'id_number', processedValue)

    // 台灣身分證格式：第一碼英文，第二碼數字（1=男, 2=女）
    const idPattern = /^[A-Z][12]/

    if (idPattern.test(processedValue)) {
      // 自動判斷性別，不彈確認視窗
      const genderCode = processedValue.charAt(1)
      const detectedGender = genderCode === '1' ? 'M' : 'F'
      updateField(memberId, 'gender', detectedGender)
    } else if (processedValue.length >= 2) {
      // 如果格式不符且已輸入至少2個字元，提示手動選擇
      void alert('無法自動辨識性別\n\n請手動點擊性別欄位選擇', 'info')
    }
  }

  // 處理數字輸入（含全形半形轉換）
  const handleNumberInput = (memberId: string, field: keyof OrderMember, value: string) => {
    // 全形轉半形並只保留數字
    const processedValue = value
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[^\d.]/g, '')

    updateField(memberId, field, processedValue ? parseFloat(processedValue) : 0)
  }

  // ========== PDF 轉 JPG 函數 ==========
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    // 動態載入 PDF.js
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const images: File[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const scale = 2 // 放大 2 倍以獲得更清晰的圖片
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context!,
        viewport: viewport,
      }).promise

      // 轉成 Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      })

      const fileName = `${pdfFile.name.replace('.pdf', '')}_page${i}.jpg`
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' })
      images.push(imageFile)
    }

    return images
  }

  // ========== 護照上傳相關函數 ==========
  const handlePassportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newProcessedFiles: ProcessedFile[] = []

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          // PDF 轉 JPG
          const images = await convertPdfToImages(file)
          for (const img of images) {
            const preview = URL.createObjectURL(img)
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            })
          }
        } else if (file.type.startsWith('image/')) {
          // 圖片直接加入
          const preview = URL.createObjectURL(file)
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          })
        }
      }

      setProcessedFiles(prev => [...prev, ...newProcessedFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newProcessedFiles: ProcessedFile[] = []

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          // PDF 轉 JPG
          const images = await convertPdfToImages(file)
          for (const img of images) {
            const preview = URL.createObjectURL(img)
            newProcessedFiles.push({
              file: img,
              preview,
              originalName: file.name,
              isPdf: true,
            })
          }
        } else if (file.type.startsWith('image/')) {
          // 圖片直接加入
          const preview = URL.createObjectURL(file)
          newProcessedFiles.push({
            file,
            preview,
            originalName: file.name,
            isPdf: false,
          })
        }
      }

      setProcessedFiles(prev => [...prev, ...newProcessedFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemovePassportFile = (index: number) => {
    setProcessedFiles(prev => {
      // 清理 preview URL
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  // 壓縮圖片（確保小於 800KB）
  const compressImage = async (file: File, quality = 0.6): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const maxDimension = 1200
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })

                if (compressedFile.size > 800 * 1024 && quality > 0.2) {
                  resolve(await compressImage(file, quality - 0.1))
                } else {
                  resolve(compressedFile)
                }
              } else {
                reject(new Error('壓縮失敗'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // 批次上傳護照並建立成員
  const handleBatchUpload = async () => {
    if (processedFiles.length === 0) return
    if (isUploading) return // 防止重複點擊

    setIsUploading(true)
    try {
      // 壓縮所有圖片
      const compressedFiles = await Promise.all(
        processedFiles.map(async (pf) => {
          return await compressImage(pf.file)
        })
      )

      // 建立 FormData
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('files', file)
      })

      // 呼叫 OCR API
      const response = await fetch('/api/ocr/passport', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR 辨識失敗')
      }

      const result = await response.json()

      // 統計
      let successCount = 0
      let duplicateCount = 0
      let syncedCustomerCount = 0
      const failedItems: string[] = []
      const duplicateItems: string[] = []

      // 載入現有成員（用於重複檢查）
      const { data: existingMembers } = await supabase
        .from('order_members')
        .select('passport_number, id_number, chinese_name, birth_date')
        .eq('order_id', orderId)

      const existingPassports = new Set(existingMembers?.map(m => m.passport_number).filter(Boolean) || [])
      const existingIdNumbers = new Set(existingMembers?.map(m => m.id_number).filter(Boolean) || [])
      // 用「中文名+生日」作為備用比對 key（避免護照號碼沒辨識到時漏掉）
      const existingNameBirthKeys = new Set(
        existingMembers
          ?.filter(m => m.chinese_name && m.birth_date)
          .map(m => `${m.chinese_name}|${m.birth_date}`) || []
      )

      // 載入顧客資料（用於同步比對）- 強制重新載入確保資料最新
      await useCustomerStore.getState().fetchAll()
      // 取得最新的 items（fetchAll 後 store 會更新）
      const freshCustomers = useCustomerStore.getState().items

      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i]
        if (item.success && item.customer) {
          const passportNumber = item.customer.passport_number || ''
          const idNumber = item.customer.national_id || ''
          const birthDate = item.customer.date_of_birth || null
          const chineseName = item.customer.name || ''
          // 移除括號內的拼音（例如「朱仔(CHU/WENYU)」→「朱仔」）
          const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()
          const nameBirthKey = cleanChineseName && birthDate ? `${cleanChineseName}|${birthDate}` : ''

          // 1. 檢查訂單成員是否重複（用護照號碼、身分證、或中文名+生日）
          let isDuplicate = false
          let duplicateReason = ''

          if (passportNumber && existingPassports.has(passportNumber)) {
            isDuplicate = true
            duplicateReason = '護照號碼重複'
          } else if (idNumber && existingIdNumbers.has(idNumber)) {
            isDuplicate = true
            duplicateReason = '身分證號重複'
          } else if (nameBirthKey && existingNameBirthKeys.has(nameBirthKey)) {
            isDuplicate = true
            duplicateReason = '姓名+生日重複'
          }

          if (isDuplicate) {
            duplicateCount++
            duplicateItems.push(`${chineseName || item.fileName} (${duplicateReason})`)
            continue // 跳過重複的
          }

          try {
            // 2. 上傳護照照片到 Supabase Storage
            let passportImageUrl: string | null = null
            if (compressedFiles[i]) {
              const file = compressedFiles[i]
              const timestamp = Date.now()
              const fileExt = file.name.split('.').pop() || 'jpg'
              const fileName = `${workspaceId}/${orderId}/${timestamp}_${i}.${fileExt}`

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('passport-images')
                .upload(fileName, file, {
                  contentType: file.type,
                  upsert: false,
                })

              if (uploadError) {
                logger.error('護照照片上傳失敗:', uploadError)
              } else {
                // 取得公開 URL
                const { data: urlData } = supabase.storage
                  .from('passport-images')
                  .getPublicUrl(fileName)
                passportImageUrl = urlData?.publicUrl || null
              }
            }

            // 3. 建立訂單成員（包含護照照片 URL）
            const memberData = {
              order_id: orderId,
              workspace_id: workspaceId,
              customer_id: null, // 稍後背景同步
              chinese_name: cleanChineseName || '', // 使用清理後的中文名（移除括號內的拼音）
              passport_name: item.customer.passport_romanization || item.customer.english_name || '',
              passport_number: passportNumber,
              passport_expiry: item.customer.passport_expiry_date || null,
              birth_date: birthDate,
              id_number: idNumber,
              gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
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

            // 更新本地快取（避免同一批次重複）
            if (passportNumber) existingPassports.add(passportNumber)
            if (idNumber) existingIdNumbers.add(idNumber)
            if (nameBirthKey) existingNameBirthKeys.add(nameBirthKey)

            successCount++

            // 3. 背景同步顧客（三重比對：護照號碼、身分證、姓名+生日）
            if (newMember && (idNumber || birthDate || passportNumber)) {
              // 查找現有顧客（三重比對）- 使用最新載入的顧客資料
              let existingCustomer = freshCustomers.find(c => {
                // 1. 優先用護照號碼比對
                if (passportNumber && c.passport_number === passportNumber) return true
                // 2. 其次用身分證比對
                if (idNumber && c.national_id === idNumber) return true
                // 3. 備用：姓名+生日比對（移除括號內的拼音）
                if (cleanChineseName && birthDate &&
                    c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
                    c.date_of_birth === birthDate) return true
                return false
              })

              if (existingCustomer) {
                // 找到現有顧客，關聯
                await supabase
                  .from('order_members')
                  .update({ customer_id: existingCustomer.id })
                  .eq('id', newMember.id)

                // 如果現有顧客沒有護照圖片，更新它
                if (passportImageUrl && !existingCustomer.passport_image_url) {
                  await supabase
                    .from('customers')
                    .update({ passport_image_url: passportImageUrl })
                    .eq('id', existingCustomer.id)
                }

                syncedCustomerCount++
                logger.info(`✅ 顧客已存在，已關聯: ${existingCustomer.name}`)
              } else {
                // 沒找到，建立新顧客
                const newCustomer = await useCustomerStore.getState().create({
                  name: item.customer.name || '',
                  english_name: item.customer.english_name || '',
                  passport_number: passportNumber,
                  passport_romanization: item.customer.passport_romanization || '',
                  passport_expiry_date: item.customer.passport_expiry_date || null,
                  passport_image_url: passportImageUrl,
                  national_id: idNumber,
                  date_of_birth: birthDate,
                  gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
                  phone: '',
                  is_vip: false,
                  is_active: true,
                  total_spent: 0,
                  total_orders: 0,
                  verification_status: 'unverified',
                } as any)

                if (newCustomer) {
                  await supabase
                    .from('order_members')
                    .update({ customer_id: newCustomer.id })
                    .eq('id', newMember.id)
                  syncedCustomerCount++
                  logger.info(`✅ 新建顧客: ${newCustomer.name}`)
                }
              }
            }
          } catch (error) {
            logger.error(`建立成員失敗 (${item.fileName}):`, error)
            failedItems.push(`${item.fileName} (建立失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員`
      if (syncedCustomerCount > 0) {
        message += `\n✅ 已同步 ${syncedCustomerCount} 位顧客資料`
      }
      if (duplicateCount > 0) {
        message += `\n\n⚠️ 跳過 ${duplicateCount} 位重複成員：\n${duplicateItems.join('\n')}`
      }
      message += `\n\n📋 重要提醒：\n• OCR 資料已標記為「待驗證」\n• 請務必人工檢查護照資訊`
      if (failedItems.length > 0) {
        message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`
      }
      void alert(message, 'success')

      // 清空檔案並重新載入成員
      processedFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
      setProcessedFiles([])
      await loadMembers()
      setIsAddDialogOpen(false)
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      void alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-morandi-blue" />
          <h4 className="font-medium text-morandi-primary">成員列表 ({members.length})</h4>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddMember}
            className="gap-1 bg-morandi-gold hover:bg-morandi-gold/90 text-white"
          >
            <Plus size={14} />
            新增成員
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAllEditMode(!isAllEditMode)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30",
              isAllEditMode && "bg-morandi-blue/10 text-morandi-blue"
            )}
            title={isAllEditMode ? "關閉全部編輯模式" : "開啟全部編輯模式"}
          >
            <Pencil size={14} />
            {isAllEditMode ? "關閉編輯" : "全部編輯"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowIdentityColumn(!showIdentityColumn)}
            className={cn(
              "gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30",
              showIdentityColumn && "bg-morandi-container/30 text-morandi-primary"
            )}
            title="顯示/隱藏身份欄位"
          >
            身份
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="gap-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30"
          >
            <X size={14} />
            收起
          </Button>
        </div>
      </div>

      {/* 成員表格 */}
      {loading ? (
        <div className="text-center py-8 text-morandi-secondary">載入中...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-morandi-secondary">尚未新增成員</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40">
                {showIdentityColumn && (
                  <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">身份</th>
                )}
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  中文姓名
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照拼音
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  出生年月日
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-[60px]">性別</th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  身分證號
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照號碼
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  護照效期
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 bg-amber-50/50">
                  飲食禁忌
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  訂房代號
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  應付金額
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  訂金
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  尾款
                </th>
                <th className="px-2 py-1.5 text-left font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20">
                  備註
                </th>
                <th className="px-2 py-1.5 text-center font-medium text-morandi-secondary text-[11px] border border-morandi-gold/20 w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, memberIndex) => (
                <tr
                  key={member.id}
                  className="group relative hover:bg-morandi-container/20 transition-colors"
                >
                  {/* 身份 */}
                  {showIdentityColumn && (
                    <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                      {isAllEditMode ? (
                        <input
                          type="text"
                          value={member.identity || ''}
                          onChange={e => updateField(member.id, 'identity', e.target.value)}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={(e) => {
                            setIsComposing(false)
                            setTimeout(() => {
                              updateField(member.id, 'identity', e.currentTarget.value)
                            }, 0)
                          }}
                          onKeyDown={e => handleKeyDown(e, memberIndex, 'identity')}
                          data-member={member.id}
                          data-field="identity"
                          className="w-full bg-transparent text-xs"
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        />
                      ) : (
                        <span className="text-xs text-morandi-primary">{member.identity || '-'}</span>
                      )}
                    </td>
                  )}

                  {/* 中文姓名 */}
                  <td className={cn(
                    "border border-morandi-gold/20 px-2 py-1",
                    isAllEditMode ? 'bg-white' : (member.customer_verification_status === 'unverified' ? 'bg-red-50' : 'bg-gray-50')
                  )}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.chinese_name || ''}
                        onChange={e => updateField(member.id, 'chinese_name', e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false)
                          setTimeout(() => {
                            updateField(member.id, 'chinese_name', e.currentTarget.value)
                          }, 0)
                        }}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'chinese_name')}
                        data-member={member.id}
                        data-field="chinese_name"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "flex-1 text-xs",
                            member.customer_verification_status === 'unverified' ? 'text-red-600 font-medium' : 'text-morandi-primary'
                          )}
                          title={member.customer_verification_status === 'unverified' ? '⚠️ 待驗證 - 請點擊編輯按鈕' : ''}
                        >
                          {member.chinese_name || '-'}
                        </span>
                        {member.passport_image_url && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMember(member)
                              setIsPreviewOpen(true)
                            }}
                            className="p-0.5 text-morandi-gold hover:text-morandi-gold/80 transition-colors"
                            title="查看護照照片"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 護照拼音 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_name || ''}
                        onChange={e => updateField(member.id, 'passport_name', e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => {
                          setIsComposing(false)
                          setTimeout(() => {
                            updateField(member.id, 'passport_name', e.currentTarget.value)
                          }, 0)
                        }}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_name')}
                        data-member={member.id}
                        data-field="passport_name"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.passport_name || '-'}</span>
                    )}
                  </td>

                  {/* 出生年月日 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.birth_date || ''}
                        onChange={e => handleDateInput(member.id, 'birth_date', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'birth_date')}
                        data-member={member.id}
                        data-field="birth_date"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        placeholder="YYYYMMDD"
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.birth_date || '-'}</span>
                    )}
                  </td>

                  {/* 性別 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1 text-xs text-center", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <select
                        value={member.gender || ''}
                        onChange={e => updateField(member.id, 'gender', e.target.value)}
                        data-member={member.id}
                        data-field="gender"
                        className="w-full bg-transparent text-xs text-center"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      >
                        <option value="">-</option>
                        <option value="M">男</option>
                        <option value="F">女</option>
                      </select>
                    ) : (
                      <span className="text-morandi-primary">
                        {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                      </span>
                    )}
                  </td>

                  {/* 身分證號 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.id_number || ''}
                        onChange={e => updateField(member.id, 'id_number', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'id_number')}
                        data-member={member.id}
                        data-field="id_number"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.id_number || '-'}</span>
                    )}
                  </td>

                  {/* 護照號碼 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_number || ''}
                        onChange={e => updateField(member.id, 'passport_number', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_number')}
                        data-member={member.id}
                        data-field="passport_number"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      />
                    ) : (
                      <span className="text-xs text-morandi-primary">{member.passport_number || '-'}</span>
                    )}
                  </td>

                  {/* 護照效期 */}
                  <td className={cn("border border-morandi-gold/20 px-2 py-1", isAllEditMode ? "bg-white" : "bg-gray-50")}>
                    {isAllEditMode ? (
                      <input
                        type="text"
                        value={member.passport_expiry || ''}
                        onChange={e => handleDateInput(member.id, 'passport_expiry', e.target.value)}
                        onKeyDown={e => handleKeyDown(e, memberIndex, 'passport_expiry')}
                        data-member={member.id}
                        data-field="passport_expiry"
                        className="w-full bg-transparent text-xs"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        placeholder="YYYYMMDD"
                      />
                    ) : (
                      (() => {
                        const expiryInfo = formatPassportExpiryWithStatus(member.passport_expiry, departureDate)
                        return (
                          <span className={cn("text-xs", expiryInfo.className)}>
                            {expiryInfo.text}
                            {expiryInfo.statusLabel && (
                              <span className="ml-1 text-[10px] font-medium">
                                ({expiryInfo.statusLabel})
                              </span>
                            )}
                          </span>
                        )
                      })()
                    )}
                  </td>

                  {/* 飲食禁忌 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-amber-50/50">
                    <input
                      type="text"
                      value={member.special_meal || ''}
                      onChange={e => updateField(member.id, 'special_meal', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'special_meal', e.currentTarget.value)
                        }, 0)
                      }}
                      onKeyDown={e => handleKeyDown(e, memberIndex, 'special_meal')}
                      data-member={member.id}
                      data-field="special_meal"
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 訂房代號 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.hotel_confirmation || ''}
                      onChange={e => updateField(member.id, 'hotel_confirmation', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'hotel_confirmation', e.currentTarget.value)
                        }, 0)
                      }}
                      data-member={member.id}
                      data-field="hotel_confirmation"
                      className="w-full bg-transparent text-xs font-mono"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      placeholder="輸入訂房代號"
                    />
                  </td>

                  {/* 應付金額 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.total_payable || ''}
                      onChange={e => handleNumberInput(member.id, 'total_payable', e.target.value)}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 訂金 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={member.deposit_amount || ''}
                      onChange={e => handleNumberInput(member.id, 'deposit_amount', e.target.value)}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 尾款 (自動計算: 應付金額 - 訂金) */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-gray-50 text-xs text-center text-morandi-secondary">
                    {((member.total_payable || 0) - (member.deposit_amount || 0)).toLocaleString()}
                  </td>

                  {/* 備註 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white">
                    <input
                      type="text"
                      value={member.remarks || ''}
                      onChange={e => updateField(member.id, 'remarks', e.target.value)}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={(e) => {
                        setIsComposing(false)
                        setTimeout(() => {
                          updateField(member.id, 'remarks', e.currentTarget.value)
                        }, 0)
                      }}
                      className="w-full bg-transparent text-xs"
                      style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    />
                  </td>

                  {/* 操作 - 警告/編輯/刪除 */}
                  <td className="border border-morandi-gold/20 px-2 py-1 bg-white text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* 警告按鈕（待驗證時顯示） */}
                      {member.customer_verification_status === 'unverified' && (
                        <button
                          onClick={() => openEditDialog(member, 'verify')}
                          className="text-amber-500 hover:text-amber-600 transition-colors p-1"
                          title="待驗證 - 點擊驗證"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      )}
                      {/* 編輯按鈕 */}
                      <button
                        onClick={() => openEditDialog(member, 'edit')}
                        className="text-morandi-blue hover:text-morandi-blue/80 transition-colors p-1"
                        title="編輯成員"
                      >
                        <Pencil size={14} />
                      </button>
                      {/* 刪除按鈕 */}
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-morandi-secondary/50 hover:text-red-500 transition-colors p-1"
                        title="刪除成員"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增成員對話框 - 左右兩半 */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          setMemberCountToAdd(1)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增成員</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* 左邊：輸入人數 */}
            <div className="space-y-4 border-r border-border pr-6">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Hash size={18} />
                <span>依人數新增</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                快速新增空白成員列，之後手動填寫資料
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">新增數量：</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={memberCountToAdd}
                  onChange={e => {
                    let value = e.target.value
                    value = value.replace(/[\uff10-\uff19]/g, ch =>
                      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
                    )
                    if (value === '') {
                      setMemberCountToAdd('')
                      return
                    }
                    const num = parseInt(value, 10)
                    if (!isNaN(num)) {
                      setMemberCountToAdd(Math.min(50, Math.max(1, num)))
                    }
                  }}
                  onFocus={e => e.target.select()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      confirmAddMembers()
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  autoFocus
                />
              </div>
              <Button
                onClick={confirmAddMembers}
                className="w-full bg-morandi-gold hover:bg-morandi-gold/90"
              >
                新增 {memberCountToAdd || 1} 位成員
              </Button>
            </div>

            {/* 右邊：上傳護照 OCR 辨識（和顧客管理一樣） */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-morandi-primary font-medium">
                <Upload size={18} />
                <span>上傳護照辨識</span>
              </div>
              <p className="text-sm text-morandi-secondary">
                上傳護照圖片，自動辨識並建立成員資料
              </p>

              {/* 重要提醒 */}
              <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-primary mb-2">⚠️ 重要提醒</h4>
                <ul className="text-xs text-morandi-secondary space-y-1">
                  <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                  <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                  <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
                </ul>
              </div>

              {/* 拍攝提示 */}
              <div className="bg-morandi-gold/5 border border-morandi-gold/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-gold mb-2">📸 拍攝建議</h4>
                <ul className="text-xs text-morandi-gold space-y-1">
                  <li>✓ 確保護照<strong>最下方兩排文字</strong>清晰可見</li>
                  <li>✓ 光線充足，避免反光或陰影</li>
                  <li>✓ 拍攝角度正面，避免傾斜</li>
                </ul>
              </div>

              {/* 上傳區域 */}
              <label
                htmlFor="member-passport-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging
                    ? 'border-morandi-gold bg-morandi-gold/20 scale-105'
                    : isProcessing
                    ? 'border-morandi-blue bg-morandi-blue/10'
                    : 'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center py-4">
                  {isProcessing ? (
                    <>
                      <div className="w-6 h-6 mb-2 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-morandi-primary">處理檔案中...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2 text-morandi-secondary" />
                      <p className="text-sm text-morandi-primary">
                        <span className="font-semibold">點擊上傳</span> 或拖曳檔案
                      </p>
                      <p className="text-xs text-morandi-secondary">支援 JPG, PNG, PDF（可多選）</p>
                    </>
                  )}
                </div>
                <input
                  id="member-passport-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,application/pdf"
                  multiple
                  onChange={handlePassportFileChange}
                  disabled={isUploading || isProcessing}
                />
              </label>

              {/* 已選檔案列表（含縮圖） */}
              {processedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-morandi-secondary mb-2">
                    已選擇 {processedFiles.length} 張圖片：
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {processedFiles.map((pf, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-morandi-container/20 rounded"
                      >
                        {/* 縮圖 */}
                        <img
                          src={pf.preview}
                          alt={pf.file.name}
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {pf.isPdf ? (
                              <FileText size={12} className="text-morandi-red flex-shrink-0" />
                            ) : (
                              <FileImage size={12} className="text-morandi-gold flex-shrink-0" />
                            )}
                            <span className="text-xs text-morandi-primary truncate">
                              {pf.file.name}
                            </span>
                          </div>
                          <span className="text-xs text-morandi-secondary">
                            {(pf.file.size / 1024).toFixed(1)} KB
                            {pf.isPdf && <span className="ml-1 text-morandi-red">(從 PDF 轉換)</span>}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePassportFile(index)}
                          className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                          disabled={isUploading}
                        >
                          <Trash2 size={12} className="text-morandi-red" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleBatchUpload}
                    disabled={isUploading}
                    className="w-full bg-morandi-gold hover:bg-morandi-gold/90 text-white"
                  >
                    {isUploading ? '辨識中...' : `辨識並建立 ${processedFiles.length} 位成員`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 護照照片預覽對話框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewMember?.chinese_name || previewMember?.passport_name || '護照照片'}
            </DialogTitle>
          </DialogHeader>
          {previewMember?.passport_image_url && (
            <div className="flex justify-center">
              <img
                src={previewMember.passport_image_url}
                alt="護照照片"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 編輯/驗證成員彈窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingMember(null)
          setEditFormData({})
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {editMode === 'verify' ? (
                <>
                  <AlertTriangle className="text-amber-500" size={20} />
                  驗證成員資料
                </>
              ) : (
                <>
                  <Pencil className="text-morandi-blue" size={20} />
                  編輯成員資料
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
            {/* 左邊：護照照片 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-morandi-primary">護照照片</h3>
                {editingMember?.passport_image_url && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="縮小"
                    >
                      <ZoomOut size={16} className="text-gray-600" />
                    </button>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-center">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="放大"
                    >
                      <ZoomIn size={16} className="text-gray-600" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => setImageRotation(r => (r - 90 + 360) % 360)}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="逆時針旋轉"
                    >
                      <RotateCcw size={16} className="text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageRotation(r => (r + 90) % 360)}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="順時針旋轉"
                    >
                      <RotateCw size={16} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
              {editingMember?.passport_image_url ? (
                <div
                  ref={imageContainerRef}
                  className="relative overflow-hidden rounded-lg border border-morandi-gold/20 bg-gray-50 cursor-grab active:cursor-grabbing"
                  style={{ height: '320px' }}
                  onWheel={(e) => {
                    // 注意：不使用 preventDefault() 因為現代瀏覽器的 wheel 事件是 passive
                    const delta = e.deltaY > 0 ? -0.1 : 0.1
                    setImageZoom(z => Math.min(3, Math.max(0.5, z + delta)))
                  }}
                  onMouseDown={(e) => {
                    if (imageZoom > 1) {
                      setIsImageDragging(true)
                      setImageDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isImageDragging && imageZoom > 1) {
                      setImagePosition({
                        x: e.clientX - imageDragStart.x,
                        y: e.clientY - imageDragStart.y,
                      })
                    }
                  }}
                  onMouseUp={() => setIsImageDragging(false)}
                  onMouseLeave={() => setIsImageDragging(false)}
                  onClick={() => {
                    if (imageZoom === 1) {
                      setImageZoom(2)
                    }
                  }}
                >
                  <img
                    src={editingMember.passport_image_url}
                    alt="護照照片"
                    className="w-full h-full object-contain transition-transform duration-100"
                    style={{
                      transform: `scale(${imageZoom}) rotate(${imageRotation}deg) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                    }}
                    draggable={false}
                  />
                  {imageZoom === 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                      點擊放大 / 滾輪縮放
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-morandi-container/30 rounded-lg flex items-center justify-center text-morandi-secondary">
                  <FileImage size={48} className="opacity-30" />
                </div>
              )}
              {editMode === 'verify' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    請仔細核對護照照片與右邊的資料是否一致。驗證完成後，此成員的資料將被標記為「已驗證」。
                  </p>
                </div>
              )}
            </div>

            {/* 右邊：表單 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-morandi-primary">成員資料</h3>

              {/* 中文姓名 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">中文姓名</label>
                <input
                  type="text"
                  value={editFormData.chinese_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, chinese_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照拼音 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照拼音</label>
                <input
                  type="text"
                  value={editFormData.passport_name || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 出生年月日 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">出生年月日</label>
                <input
                  type="text"
                  value={editFormData.birth_date || ''}
                  onChange={e => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 性別 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">性別</label>
                <select
                  value={editFormData.gender || ''}
                  onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                >
                  <option value="">請選擇</option>
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
              </div>

              {/* 身分證號 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">身分證號</label>
                <input
                  type="text"
                  value={editFormData.id_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, id_number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照號碼 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照號碼</label>
                <input
                  type="text"
                  value={editFormData.passport_number || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 護照效期 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">護照效期</label>
                <input
                  type="text"
                  value={editFormData.passport_expiry || ''}
                  onChange={e => setEditFormData({ ...editFormData, passport_expiry: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 特殊餐食 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">特殊餐食</label>
                <input
                  type="text"
                  value={editFormData.special_meal || ''}
                  onChange={e => setEditFormData({ ...editFormData, special_meal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-xs font-medium text-morandi-secondary mb-1">備註</label>
                <textarea
                  value={editFormData.remarks || ''}
                  onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold resize-none"
                />
              </div>
            </div>
          </div>

          {/* 按鈕區域 - 固定在底部 */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 pb-2 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              size="lg"
              className={editMode === 'verify'
                ? 'bg-green-600 hover:bg-green-700 text-white px-8 font-medium'
                : 'bg-morandi-gold hover:bg-morandi-gold/90 text-white px-8 font-medium'
              }
            >
              {isSaving ? '儲存中...' : editMode === 'verify' ? '確認驗證' : '儲存變更'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
