'use client'

import { useCallback } from 'react'
import { Member } from '@/stores/types'
import type { Customer } from '@/types/customer.types'
import { logger } from '@/lib/utils/logger'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import { convertPdfToImages, compressImage } from '../utils/passport-utils'
import type { ProcessedFile } from './useMemberView'

interface UsePassportUploadProps {
  order_id: string
  workspace_id: string | null
  orderMembers: Member[]
  processedFiles: ProcessedFile[]
  setProcessedFiles: (files: ProcessedFile[]) => void
  setIsUploading: (isUploading: boolean) => void
  setIsProcessing: (isProcessing: boolean) => void
  setIsUploadDialogOpen: (open: boolean) => void
  refetchMembers: () => void
  createMember: (data: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'order_id'>) => Promise<Member | undefined>
  updateMember: (id: string, data: Partial<Member>) => Promise<void>
  uploadPassportImage: (fileName: string, file: File) => Promise<{ data: { publicUrl: string } | null; error: Error | null }>
}

export function usePassportUpload({
  order_id,
  workspace_id,
  orderMembers,
  processedFiles,
  setProcessedFiles,
  setIsUploading,
  setIsProcessing,
  setIsUploadDialogOpen,
  refetchMembers,
  createMember,
  updateMember,
  uploadPassportImage,
}: UsePassportUploadProps) {
  const handlePassportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setIsProcessing(true)
      try {
        const newProcessedFiles: ProcessedFile[] = []

        for (const file of Array.from(files)) {
          if (file.type === 'application/pdf') {
            const images = await convertPdfToImages(file)
            for (const img of images) {
              newProcessedFiles.push({
                file: img,
                preview: URL.createObjectURL(img),
                originalName: file.name,
                isPdf: true,
              })
            }
          } else if (file.type.startsWith('image/')) {
            newProcessedFiles.push({
              file,
              preview: URL.createObjectURL(file),
              originalName: file.name,
              isPdf: false,
            })
          }
        }
        setProcessedFiles([...processedFiles, ...newProcessedFiles])
      } catch (error) {
        logger.error('處理檔案失敗:', error)
        alert('檔案處理失敗，請重試', 'error')
      } finally {
        setIsProcessing(false)
      }
    },
    [processedFiles, setProcessedFiles, setIsProcessing]
  )

  const handleRemovePassportFile = useCallback(
    (index: number) => {
      setProcessedFiles(
        processedFiles.filter((_, i) => {
          if (i === index) {
            URL.revokeObjectURL(processedFiles[index].preview)
            return false
          }
          return true
        })
      )
    },
    [processedFiles, setProcessedFiles]
  )

  const handleBatchUpload = useCallback(async () => {
    if (processedFiles.length === 0) return

    setIsUploading(true)
    try {
      const compressedFiles = await Promise.all(processedFiles.map((pf) => compressImage(pf.file)))
      const formData = new FormData()
      compressedFiles.forEach((file) => formData.append('files', file))

      const response = await fetch('/api/ocr/passport', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('OCR 辨識失敗')
      const result = await response.json()

      let successCount = 0,
        duplicateCount = 0,
        syncedCustomerCount = 0,
        replacedCount = 0,
        customerUpdatedCount = 0
      const failedItems: string[] = [],
        duplicateItems: {
          name: string
          reason: string
          existingMemberId: string
          newData: Record<string, unknown>
          fileIndex: number
        }[] = []
      const customersToUpdate: {
        customer: Customer
        newPassportUrl: string
        ocrData: Record<string, unknown>
      }[] = []

      refetchMembers()
      const existingMembers = orderMembers
      const existingPassportMap = new Map(
        existingMembers.filter((m) => m.passport_number).map((m) => [m.passport_number, m.id])
      )
      const existingIdNumberMap = new Map(
        existingMembers.filter((m) => m.id_number).map((m) => [m.id_number, m.id])
      )
      const existingNameBirthMap = new Map(
        existingMembers
          .filter((m) => m.name && m.birthday)
          .map((m) => [`${m.name}|${m.birthday}`, m.id])
      )

      const { invalidateCustomers } = await import('@/data')
      const { supabase } = await import('@/lib/supabase/client')
      await invalidateCustomers()
      const { data: freshCustomers } = await supabase.from('customers').select('*')

      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i]
        if (!item.success || !item.customer) {
          failedItems.push(`${item.fileName} (辨識失敗)`)
          continue
        }

        const {
          passport_number = '',
          national_id = '',
          date_of_birth = null,
          name = '',
        } = item.customer
        const cleanChineseName = name.replace(/\([^)]+\)$/, '').trim()
        const nameBirthKey =
          cleanChineseName && date_of_birth ? `${cleanChineseName}|${date_of_birth}` : ''

        let existingMemberId: string | undefined
        let duplicateReason = ''
        if (passport_number && existingPassportMap.has(passport_number)) {
          existingMemberId = existingPassportMap.get(passport_number)
          duplicateReason = '護照號碼重複'
        } else if (national_id && existingIdNumberMap.has(national_id)) {
          existingMemberId = existingIdNumberMap.get(national_id)
          duplicateReason = '身分證號重複'
        } else if (nameBirthKey && existingNameBirthMap.has(nameBirthKey)) {
          existingMemberId = existingNameBirthMap.get(nameBirthKey)
          duplicateReason = '姓名+生日重複'
        }

        if (existingMemberId) {
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
          gender: (item.customer.sex === '男'
            ? 'M'
            : item.customer.sex === '女'
            ? 'F'
            : null) as 'M' | 'F' | null,
          passport_image_url,
        }

        const newMember = await createMember(
          memberData as unknown as Parameters<typeof createMember>[0]
        )
        if (!newMember) {
          failedItems.push(`${item.fileName} (建立失敗)`)
          continue
        }

        successCount++
        if (passport_number) existingPassportMap.set(passport_number, newMember.id)
        if (national_id) existingIdNumberMap.set(national_id, newMember.id)
        if (nameBirthKey) existingNameBirthMap.set(nameBirthKey, newMember.id)

        const existingCustomer = (freshCustomers || []).find(
          (c) =>
            (passport_number && c.passport_number === passport_number) ||
            (national_id && c.national_id === national_id) ||
            (cleanChineseName &&
              date_of_birth &&
              c.name?.replace(/\([^)]+\)$/, '').trim() === cleanChineseName &&
              c.date_of_birth === date_of_birth)
        )

        if (existingCustomer) {
          await updateMember(newMember.id, { customer_id: existingCustomer.id })
          if (passport_image_url) {
            if (!existingCustomer.passport_image_url) {
              const { updateCustomer } = await import('@/data')
              await updateCustomer(existingCustomer.id, { passport_image_url })
            } else {
              customersToUpdate.push({
                customer: existingCustomer,
                newPassportUrl: passport_image_url,
                ocrData: {
                  passport_number,
                  passport_romanization:
                    item.customer.passport_romanization || item.customer.english_name || '',
                  passport_expiry_date: item.customer.passport_expiry_date || null,
                  national_id,
                  date_of_birth,
                },
              })
            }
          }
          syncedCustomerCount++
        }
      }

      // 處理重複項目
      if (duplicateItems.length > 0) {
        const duplicateNames = duplicateItems.map((d) => `• ${d.name} (${d.reason})`).join('\n')
        const shouldReplace = await confirm(
          `發現 ${duplicateItems.length} 位重複成員：\n\n${duplicateNames}\n\n是否要用新的護照資料替換？\n（新照片可能比較清楚）`,
          { title: '發現重複成員', confirmText: '替換', cancelText: '跳過' }
        )

        if (shouldReplace) {
          for (const dup of duplicateItems) {
            try {
              let passport_image_url: string | null = null
              if (compressedFiles[dup.fileIndex]) {
                const file = compressedFiles[dup.fileIndex]
                const fileName = `${workspace_id}/${order_id}/${Date.now()}_replace_${dup.fileIndex}.${file.name.split('.').pop() || 'jpg'}`
                const { data: uploadData, error: uploadError } = await uploadPassportImage(
                  fileName,
                  file
                )
                if (uploadError) logger.error('護照照片上傳失敗:', uploadError)
                else passport_image_url = uploadData?.publicUrl || null
              }

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

      // 處理需要更新護照的顧客
      if (customersToUpdate.length > 0) {
        const customerNames = customersToUpdate.map((c) => `• ${c.customer.name}`).join('\n')
        const shouldUpdateCustomers = await confirm(
          `發現 ${customersToUpdate.length} 位顧客已有護照資料：\n\n${customerNames}\n\n是否要用新護照替換顧客資料？\n（適用於客人換發新護照的情況）`,
          { title: '更新顧客護照', confirmText: '替換', cancelText: '保留舊資料' }
        )

        if (shouldUpdateCustomers) {
          const { updateCustomer } = await import('@/data')
          for (const item of customersToUpdate) {
            try {
              await updateCustomer(item.customer.id, {
                passport_image_url: item.newPassportUrl,
                passport_number:
                  (item.ocrData.passport_number as string) || item.customer.passport_number,
                passport_romanization:
                  (item.ocrData.passport_romanization as string) ||
                  item.customer.passport_romanization,
                passport_expiry_date:
                  (item.ocrData.passport_expiry_date as string) ||
                  item.customer.passport_expiry_date,
                verification_status: 'unverified',
              })
              customerUpdatedCount++
            } catch (err) {
              logger.error('更新顧客護照失敗:', err)
            }
          }
        }
      }

      let message = `✅ 成功辨識 ${result.successful}/${result.total} 張護照\n✅ 成功建立 ${successCount} 位成員`
      if (replacedCount > 0) message += `\n🔄 已替換 ${replacedCount} 位重複成員`
      else if (duplicateCount > 0) message += `\n⚠️ 跳過 ${duplicateCount} 位重複成員`
      if (syncedCustomerCount > 0) message += `\n👤 已連結 ${syncedCustomerCount} 位既有顧客`
      if (customerUpdatedCount > 0) message += `\n📝 已更新 ${customerUpdatedCount} 位顧客護照`
      alert(message, 'success')

      processedFiles.forEach((pf) => URL.revokeObjectURL(pf.preview))
      setProcessedFiles([])
      setIsUploadDialogOpen(false)
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsUploading(false)
    }
  }, [
    processedFiles,
    order_id,
    workspace_id,
    orderMembers,
    refetchMembers,
    createMember,
    updateMember,
    uploadPassportImage,
    setIsUploading,
    setProcessedFiles,
    setIsUploadDialogOpen,
  ])

  return {
    handlePassportFileChange,
    handleRemovePassportFile,
    handleBatchUpload,
  }
}
