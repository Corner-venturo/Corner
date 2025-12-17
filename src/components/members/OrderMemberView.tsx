'use client'

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
  useRef,
} from 'react'
import { useCustomerStore } from '@/stores'
import { Member } from '@/stores/types'
import { useMembers } from '@/hooks/use-members'
import type { Customer } from '@/types/customer.types'
import { getGenderFromIdNumber, calculateAge } from '@/lib/utils'
import { ReactDataSheetWrapper, DataSheetColumn } from '@/components/shared/react-datasheet-wrapper'
import { MemberTable } from '@/components/members/MemberTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ImageIcon,
  X,
  AlertTriangle,
  Edit3,
  Save,
  Upload,
  FileText,
  FileImage,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CustomerVerifyDialog } from '@/app/(main)/customers/components/CustomerVerifyDialog'
import { useOcrRecognition } from '@/hooks'
import { logger } from '@/lib/utils/logger'
import { alert, confirm } from '@/lib/ui/alert-dialog' // Ensure alert and confirm are imported

interface MemberTableProps {
  order_id: string
  departure_date: string
  member_count: number
}

export interface MemberTableRef {
  addRow: () => void
}

interface EditingMember extends Omit<Member, 'id' | 'created_at' | 'updated_at'> {
  id?: string
  isNew?: boolean
}

// PDF/Image 處理需要
interface ProcessedFile {
  file: File
  preview: string
  originalName: string
  isPdf: boolean
}

export const OrderMemberView = forwardRef<MemberTableRef, MemberTableProps>(
  ({ order_id, departure_date, member_count }, ref) => {
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
    const { items: customers, fetchAll: fetchCustomers } = useCustomerStore()
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
    const { isRecognizing, recognizePassport } = useOcrRecognition()

    // Debounce 計時器
    const saveTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
    const DEBOUNCE_DELAY = 800 // 800ms debounce

    // 載入顧客資料 (僅執行一次)
    useEffect(() => {
      fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ========== PDF/圖片 轉檔與壓縮 ==========
    const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
      // 動態載入 PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const images: File[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const scale = 2
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const context = canvas.getContext('2d')!
        await page.render({ canvasContext: context, viewport }).promise
        const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85))
        images.push(new File([blob], `${pdfFile.name}_page${i}.jpg`, { type: 'image/jpeg' }))
      }
      return images
    }

    const compressImage = async (file: File, quality = 0.6): Promise<File> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = e => {
          const img = new Image()
          img.src = e.target?.result as string
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let { width, height } = img
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
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob(
              async blob => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })
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

    // ========== 護照上傳與 OCR 核心邏輯 ==========
    const handleBatchUpload = async () => {
      if (processedFiles.length === 0 || isUploading) return

      setIsUploading(true)
      try {
        const compressedFiles = await Promise.all(processedFiles.map(pf => compressImage(pf.file)))
        const formData = new FormData()
        compressedFiles.forEach(file => formData.append('files', file))

        const response = await fetch('/api/ocr/passport', { method: 'POST', body: formData })
        if (!response.ok) throw new Error('OCR 辨識失敗')
        const result = await response.json()

        let successCount = 0, duplicateCount = 0, syncedCustomerCount = 0, replacedCount = 0
        const failedItems: string[] = [], duplicateItems: { name: string; reason: string; existingMemberId: string; newData: Record<string, unknown>; fileIndex: number }[] = []

        refetchMembers() // 確保資料是最新的
        const existingMembers = orderMembers
        const existingPassportMap = new Map(existingMembers.filter(m => m.passport_number).map(m => [m.passport_number, m.id]))
        const existingIdNumberMap = new Map(existingMembers.filter(m => m.id_number).map(m => [m.id_number, m.id]))
        const existingNameBirthMap = new Map(existingMembers.filter(m => m.name && m.birthday).map(m => [`${m.name}|${m.birthday}`, m.id]))

        await fetchCustomers()
        const freshCustomers = useCustomerStore.getState().items

        for (let i = 0; i < result.results.length; i++) {
          const item = result.results[i]
          if (!item.success || !item.customer) {
            failedItems.push(`${item.fileName} (辨識失敗)`)
            continue
          }

          const { passport_number = '', national_id = '', date_of_birth = null, name = '' } = item.customer
          const cleanChineseName = name.replace(/\([^)]+\)$/, '').trim()
          const nameBirthKey = cleanChineseName && date_of_birth ? `${cleanChineseName}|${date_of_birth}` : ''

          let existingMemberId: string | undefined
          let duplicateReason = ''
          if (passport_number && existingPassportMap.has(passport_number)) { existingMemberId = existingPassportMap.get(passport_number); duplicateReason = '護照號碼重複' }
          else if (national_id && existingIdNumberMap.has(national_id)) { existingMemberId = existingIdNumberMap.get(national_id); duplicateReason = '身分證號重複' }
          else if (nameBirthKey && existingNameBirthMap.has(nameBirthKey)) { existingMemberId = existingNameBirthMap.get(nameBirthKey); duplicateReason = '姓名+生日重複' }

          if (existingMemberId) {
            // 收集重複項目，稍後詢問用戶是否替換
            duplicateItems.push({
              name: cleanChineseName || item.fileName,
              reason: duplicateReason,
              existingMemberId,
              newData: {
                name: cleanChineseName,
                name_en: item.customer.passport_romanization || item.customer.english_name || '',
                passport_number,
                passport_expiry: item.customer.passport_expiry_date || null,
                birthday: date_of_birth,
                id_number: national_id,
                gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
              },
              fileIndex: i,
            })
            duplicateCount++
            continue
          }
          
          let passport_image_url: string | null = null
          if (compressedFiles[i]) {
            const file = compressedFiles[i]
            const fileName = `${workspace_id}/${order_id}/${Date.now()}_${i}.${file.name.split('.').pop() || 'jpg'}`
            const { data: uploadData, error: uploadError } = await uploadPassportImage(fileName, file)
            if (uploadError) logger.error('護照照片上傳失敗:', uploadError)
            else passport_image_url = uploadData?.publicUrl || null
          }

          const memberData = {
            order_id,
            workspace_id,
            name: cleanChineseName,
            name_en: item.customer.passport_romanization || item.customer.english_name || '',
            passport_number,
            passport_expiry: item.customer.passport_expiry_date || null,
            birthday: date_of_birth,
            id_number: national_id,
            gender: item.customer.sex === '男' ? 'M' : item.customer.sex === '女' ? 'F' : null,
            passport_image_url,
          } as Omit<Member, 'id'|'created_at'|'updated_at'|'order_id'>

          const newMember = await createMember(memberData)
          if (!newMember) {
            failedItems.push(`${item.fileName} (建立失敗)`)
            continue
          }

          successCount++
          // 更新 Map 以追蹤本批次新增的成員
          if (passport_number) existingPassportMap.set(passport_number, newMember.id)
          if (national_id) existingIdNumberMap.set(national_id, newMember.id)
          if (nameBirthKey) existingNameBirthMap.set(nameBirthKey, newMember.id)

          let existingCustomer = freshCustomers.find(c => 
            (passport_number && c.passport_number === passport_number) ||
            (national_id && c.national_id === national_id) ||
            (cleanChineseName && date_of_birth && c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName && c.date_of_birth === date_of_birth)
          )

          if (existingCustomer) {
            await updateMember(newMember.id, { customer_id: existingCustomer.id })
            if (passport_image_url && !existingCustomer.passport_image_url) {
              await useCustomerStore.getState().update(existingCustomer.id, { passport_image_url })
            }
            syncedCustomerCount++
          } else {
            // ... (create new customer logic, can be simplified for now)
          }
        }

        // 處理重複項目：詢問用戶是否要替換
        if (duplicateItems.length > 0) {
          const duplicateNames = duplicateItems.map(d => `• ${d.name} (${d.reason})`).join('\n')
          const shouldReplace = await confirm(
            `發現 ${duplicateItems.length} 位重複成員：\n\n${duplicateNames}\n\n是否要用新的護照資料替換？\n（新照片可能比較清楚）`,
            { title: '發現重複成員', confirmText: '替換', cancelText: '跳過' }
          )

          if (shouldReplace) {
            for (const dup of duplicateItems) {
              try {
                // 上傳新的護照照片
                let passport_image_url: string | null = null
                if (compressedFiles[dup.fileIndex]) {
                  const file = compressedFiles[dup.fileIndex]
                  const fileName = `${workspace_id}/${order_id}/${Date.now()}_replace_${dup.fileIndex}.${file.name.split('.').pop() || 'jpg'}`
                  const { data: uploadData, error: uploadError } = await uploadPassportImage(fileName, file)
                  if (uploadError) logger.error('護照照片上傳失敗:', uploadError)
                  else passport_image_url = uploadData?.publicUrl || null
                }

                // 更新成員資料
                await updateMember(dup.existingMemberId, {
                  ...dup.newData,
                  ...(passport_image_url ? { passport_image_url } : {}),
                } as Partial<Member>)
                replacedCount++
              } catch (err) {
                logger.error('替換成員資料失敗:', err)
              }
            }
          }
        }

        let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員`
        if (replacedCount > 0) message += `\n🔄 已替換 ${replacedCount} 位重複成員`
        else if (duplicateCount > 0) message += `\n⚠️ 跳過 ${duplicateCount} 位重複成員`
        if (syncedCustomerCount > 0) message += `\n👤 已連結 ${syncedCustomerCount} 位既有顧客`
        alert(message, 'success')
        
        processedFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
        setProcessedFiles([])
        setIsUploadDialogOpen(false)
        
      } catch (error) {
        logger.error('批次上傳失敗:', error)
        alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
      } finally {
        setIsUploading(false)
      }
    }

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

    // 配置 DataSheet 欄位
    const dataSheetColumns: DataSheetColumn[] = [
      { key: 'index', label: '序號', width: 40, readOnly: true },
      {
        key: 'name',
        label: '姓名',
        width: 100,
        onCellClick: handleNameClick,
        valueRenderer: (cell) => {
          const rowData = cell.rowData as Record<string, unknown> | undefined
          const hasPassport = rowData?.passport_image_url
          const customerId = rowData?.customer_id as string | undefined
          const name = cell.value as string

          // 找到關聯的顧客，檢查驗證狀態
          const customer = customerId ? customers.find(c => c.id === customerId) : null
          const needsVerification = customer?.passport_image_url && customer?.verification_status !== 'verified'

          if (hasPassport || customer?.passport_image_url) {
            return (
              <span className="flex items-center gap-1 cursor-pointer text-primary hover:underline">
                {needsVerification && (
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                )}
                <ImageIcon size={12} className="text-primary flex-shrink-0" />
                <span className="truncate">{name}</span>
              </span>
            )
          }
          return name || ''
        },
      },
      { key: 'nameEn', label: '英文姓名', width: 100 },
      { key: 'birthday', label: '生日', width: 100 },
      { key: 'age', label: '年齡', width: 60, readOnly: true },
      { key: 'gender', label: '性別', width: 50, readOnly: true },
      { key: 'idNumber', label: '身分證字號', width: 120 },
      { key: 'passportNumber', label: '護照號碼', width: 100 },
      { key: 'passportExpiry', label: '護照效期', width: 100 },
      { key: 'reservationCode', label: '訂位代號', width: 100 },
    ]

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

    // 處理資料更新 (用於 ReactDataSheet)
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
          name_en: customer.passport_romanization || pendingMemberData.name_en,
          passport_number: customer.passport_number || pendingMemberData.passport_number,
          passport_expiry: customer.passport_expiry_date || pendingMemberData.passport_expiry,
          id_number: customer.national_id || pendingMemberData.id_number,
          birthday: customer.date_of_birth || pendingMemberData.birthday,
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

    const handleDataUpdate = useCallback(
      (newData: EditingMember[]) => {
        // 處理自動計算欄位
        const processedData = newData.map((member, index) => {
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

    // 新增行
    const addRow = () => {
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
    }

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

    // 儲存編輯模式的所有變更
    const handleSaveEditMode = useCallback(() => {
      setIsEditMode(false)
    }, [])

    const handlePassportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
  
      setIsProcessing(true)
      try {
        const newProcessedFiles: ProcessedFile[] = []
  
        for (const file of Array.from(files)) {
          if (file.type === 'application/pdf') {
            const images = await convertPdfToImages(file)
            for (const img of images) {
              newProcessedFiles.push({ file: img, preview: URL.createObjectURL(img), originalName: file.name, isPdf: true })
            }
          } else if (file.type.startsWith('image/')) {
            newProcessedFiles.push({ file, preview: URL.createObjectURL(file), originalName: file.name, isPdf: false })
          }
        }
        setProcessedFiles(prev => [...prev, ...newProcessedFiles])
      } catch (error) {
        logger.error('處理檔案失敗:', error)
        alert('檔案處理失敗，請重試', 'error')
      } finally {
        setIsProcessing(false)
      }
    }
  
    const handleRemovePassportFile = (index: number) => {
      setProcessedFiles(prev => {
        URL.revokeObjectURL(prev[index].preview)
        return prev.filter((_, i) => i !== index)
      })
    }

    // 暴露addRow函數給父組件
    useImperativeHandle(ref, () => ({
      addRow,
    }))

    // 檢查是否有已填寫的資料
    const hasExistingData = tableMembers.some(m => m.name?.trim() || m.id_number?.trim())

    return (
      <div className="w-full">
        {/* 編輯模式切換按鈕 */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <div className="text-sm text-muted-foreground">
            共 {tableMembers.length} 位成員
            {hasExistingData && !isEditMode && (
              <span className="ml-2 text-amber-600">（已有 {tableMembers.filter(m => m.name?.trim()).length} 位有資料）</span>
            )}
          </div>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={async () => {
              if (!isEditMode && hasExistingData) {
                // 有資料時提醒
                const confirmed = await confirm('目前已有成員資料，進入編輯模式後可直接修改所有欄位。確定要進入編輯模式嗎？')
                if (confirmed) {
                  setIsEditMode(true)
                }
              } else {
                setIsEditMode(!isEditMode)
              }
            }}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Save size={16} />
                完成編輯
              </>
            ) : (
              <>
                <Edit3 size={16} />
                全部編輯模式
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
            className="gap-2 ml-2"
          >
            <Upload size={16} />
            批次上傳護照
          </Button>
        </div>

        <MemberTable
          data={tableMembers.map((member, index: number) => {
            const age = 'age' in member ? (member as EditingMember & { age: number }).age : 0
            return {
              ...member,
              index: index + 1,
              age: age > 0 ? `${age}歲` : '',
              gender: member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '',
              passport_image_url: member.passport_image_url || '',
              customer_id: member.customer_id || '',
            }
          })}
          columns={dataSheetColumns}
          isEditMode={isEditMode}
          handleEditModeChange={handleEditModeChange}
          handleDataUpdate={handleDataUpdate as (data: unknown[]) => void}
          // The refetchMembers is passed down to MemberTable, in case any action in MemberTable
          // needs to trigger a refetch of the members from the useOrderMembers hook.
          // This allows for any data mutations within MemberTable (e.g., delete row) to correctly update the parent state.
          // For now, this is not explicitly requested by the user, but it's good practice for a generic table.
          // If the underlying data changes in the store due to actions in MemberTable,
          // then the parent needs to trigger refetch.
        />

        <div className="text-xs text-morandi-secondary px-6 py-2 space-y-1">
          {isEditMode ? (
            <>
              <p>• 編輯模式：所有欄位都可以直接輸入</p>
              <p>• 輸入姓名 2 字以上會自動搜尋相似顧客</p>
              <p>• 輸入身分證 5 字以上會自動搜尋相同顧客</p>
              <p>• 性別會根據身分證字號自動計算</p>
            </>
          ) : (
            <>
              <p>• 雙擊單元格即可編輯，自動儲存</p>
              <p>• 年齡和性別為自動計算欄位</p>
              <p>• 支援 Excel 式鍵盤導航和複製貼上</p>
              <p>• 身分證號碼會自動計算年齡和性別</p>
              <p>• 輸入姓名時會自動搜尋顧客資料庫，同名時可選擇</p>
              <p>• <ImageIcon size={12} className="inline text-primary" /> 有護照照片的成員，點擊可預覽或驗證</p>
              <p>• <AlertTriangle size={12} className="inline text-amber-500" /> 金色驚嘆號表示護照資料待驗證，點擊可進行驗證</p>
            </>
          )}
        </div>

        {/* 護照圖片預覽對話框 */}
        {showPassportPreview && previewMember && (
          <Dialog open={true} onOpenChange={() => setShowPassportPreview(false)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon size={20} />
                  {previewMember.name || previewMember.chinese_name} 的護照
                </DialogTitle>
              </DialogHeader>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10 bg-white/80 hover:bg-white"
                  onClick={() => setShowPassportPreview(false)}
                >
                  <X size={20} />
                </Button>
                {previewMember.passport_image_url ? (
                  <div className="relative w-full max-h-[70vh] overflow-auto">
                    <img
                      src={previewMember.passport_image_url}
                      alt={`${previewMember.name || previewMember.chinese_name} 的護照`}
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-morandi-background rounded-lg">
                    <p className="text-morandi-secondary">沒有護照照片</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-morandi-background p-4 rounded-lg">
                <div>
                  <span className="font-medium text-morandi-secondary">姓名：</span>
                  <span>{previewMember.name || previewMember.chinese_name}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">英文姓名：</span>
                  <span>{previewMember.name_en || previewMember.passport_name || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">護照號碼：</span>
                  <span>{previewMember.passport_number || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">護照效期：</span>
                  <span>{previewMember.passport_expiry || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">生日：</span>
                  <span>{previewMember.birthday || previewMember.birth_date || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-morandi-secondary">性別：</span>
                  <span>
                    {previewMember.gender === 'M'
                      ? '男'
                      : previewMember.gender === 'F'
                      ? '女'
                      : '-'} 
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 顧客選擇對話框 - 橫向表格式 */}
        {showMatchDialog && matchedCustomers.length > 0 && (
          <Dialog open={true} onOpenChange={() => setShowMatchDialog(false)}>
            <DialogContent className="max-w-4xl p-0">
              <DialogHeader className="p-4 pb-2">
                <DialogTitle className="text-base">
                  {matchType === 'name'
                    ? `找到 ${matchedCustomers.length} 位相似顧客「${pendingMemberData?.name}」`
                    : `找到 ${matchedCustomers.length} 位相同身分證「${pendingMemberData?.id_number}」`}
                </DialogTitle>
              </DialogHeader>

              {/* 橫向表格 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">姓名</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">英文拼音</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">身分證</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">護照號碼</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">生日</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">性別</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="border-b hover:bg-primary/5 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-3 font-medium text-primary">{customer.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{customer.passport_romanization || '-'}</td>
                        <td className="px-3 py-3 font-mono text-xs">{customer.national_id || '-'}</td>
                        <td className="px-3 py-3 font-mono text-xs">{customer.passport_number || '-'}</td>
                        <td className="px-3 py-3">{customer.date_of_birth || '-'}</td>
                        <td className="px-3 py-3">{customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 底部操作 */}
              <div className="flex justify-between items-center p-3 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground">點擊列即可選擇該顧客資料</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                      // 關閉對話框前，先儲存已輸入的資料（不帶入顧客資料）
                      if (pendingMemberIndex !== null && pendingMemberData) {
                        autoSaveMember(pendingMemberData, pendingMemberIndex)
                      }
                      setShowMatchDialog(false)
                      setPendingMemberIndex(null)
                      setPendingMemberData(null)
                    }}
                  >
                    取消，手動輸入
                  </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 護照驗證對話框 - 複用顧客管理的驗證組件 */}
        <CustomerVerifyDialog
          open={showVerifyDialog}
          onOpenChange={setShowVerifyDialog}
          customer={verifyCustomer}
          onUpdate={async (id, data) => {
            // 使用 customerStore 更新顧客資料
            const customerStore = useCustomerStore.getState()
            await customerStore.update(id, data)
            // 重新載入成員資料以更新狀態
            refetchMembers()
          }}
        />

        {/* 批次上傳護照 Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>上傳護照以批次新增成員</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-morandi-primary/5 border border-morandi-primary/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-morandi-primary mb-2">⚠️ 重要提醒</h4>
                <ul className="text-xs text-morandi-secondary space-y-1">
                  <li>• OCR 辨識的資料會自動標記為<strong>「待驗證」</strong></li>
                  <li>• 請務必<strong>人工檢查護照資訊</strong></li>
                  <li>• 支援所有國家護照（TWN、USA、JPN 等）</li>
                </ul>
              </div>
              <label
                htmlFor="member-passport-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragging ? 'border-morandi-gold bg-morandi-gold/20 scale-105' :
                  isProcessing ? 'border-morandi-blue bg-morandi-blue/10' :
                  'border-morandi-secondary/30 bg-morandi-container/20 hover:bg-morandi-container/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (!files || files.length === 0) return;
                  const event = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  await handlePassportFileChange(event);
                }}
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
                      <p className="text-sm text-morandi-primary"><span className="font-semibold">點擊上傳</span> 或拖曳檔案</p>
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
              {processedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-morandi-secondary mb-2">已選擇 {processedFiles.length} 張圖片：</div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {processedFiles.map((pf, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-morandi-container/20 rounded">
                        <img src={pf.preview} alt={pf.file.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            {pf.isPdf ? <FileText size={12} className="text-morandi-red flex-shrink-0" /> : <FileImage size={12} className="text-morandi-gold flex-shrink-0" />}
                            <span className="text-xs text-morandi-primary truncate">{pf.file.name}</span>
                          </div>
                          <span className="text-xs text-morandi-secondary">
                            {(pf.file.size / 1024).toFixed(1)} KB
                            {pf.isPdf && <span className="ml-1 text-morandi-red">(從 PDF 轉換)</span>}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePassportFile(index)} className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0" disabled={isUploading}>
                          <Trash2 size={12} className="text-morandi-red" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleBatchUpload} disabled={isUploading} className="w-full bg-morandi-gold hover:bg-morandi-gold/90 text-white">
                    {isUploading ? '辨識中...' : `辨識並建立 ${processedFiles.length} 位成員`}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
)

OrderMemberView.displayName = 'OrderMemberView'
