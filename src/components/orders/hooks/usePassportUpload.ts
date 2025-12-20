/**
 * usePassportUpload - 護照上傳與 OCR 辨識 Hook
 * 從 OrderMembersExpandable.tsx 拆分出來
 *
 * 功能：
 * - 檔案選擇和拖放
 * - PDF 轉圖片
 * - 圖片壓縮
 * - OCR 辨識
 * - 批次上傳建立成員
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { useCustomerStore } from '@/stores'
import type { ProcessedFile } from '../order-member.types'

interface UsePassportUploadParams {
  orderId: string | undefined
  workspaceId: string
  onSuccess: () => Promise<void>  // 上傳成功後的回呼（通常是重新載入成員）
}

interface UsePassportUploadReturn {
  // 狀態
  processedFiles: ProcessedFile[]
  isUploading: boolean
  isDragging: boolean
  isProcessing: boolean

  // 操作
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleDragOver: (e: React.DragEvent<HTMLLabelElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLLabelElement>) => void
  handleDrop: (e: React.DragEvent<HTMLLabelElement>) => Promise<void>
  handleRemoveFile: (index: number) => void
  handleBatchUpload: () => Promise<void>
  clearFiles: () => void
}

export function usePassportUpload({
  orderId,
  workspaceId,
  onSuccess,
}: UsePassportUploadParams): UsePassportUploadReturn {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // PDF 轉 JPG
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<File[]> => {
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
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context!,
        viewport: viewport,
      }).promise

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      })

      const fileName = `${pdfFile.name.replace('.pdf', '')}_page${i}.jpg`
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' })
      images.push(imageFile)
    }

    return images
  }, [])

  // 處理檔案（PDF 或圖片）
  const processFiles = useCallback(async (files: FileList): Promise<ProcessedFile[]> => {
    const newProcessedFiles: ProcessedFile[] = []

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
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
        const preview = URL.createObjectURL(file)
        newProcessedFiles.push({
          file,
          preview,
          originalName: file.name,
          isPdf: false,
        })
      }
    }

    return newProcessedFiles
  }, [convertPdfToImages])

  // 檔案選擇處理
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newFiles = await processFiles(files)
      setProcessedFiles(prev => [...prev, ...newFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [processFiles])

  // 拖放處理
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const newFiles = await processFiles(files)
      setProcessedFiles(prev => [...prev, ...newFiles])
    } catch (error) {
      logger.error('處理檔案失敗:', error)
      void alert('檔案處理失敗，請重試', 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [processFiles])

  // 移除檔案
  const handleRemoveFile = useCallback((index: number) => {
    setProcessedFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // 清空所有檔案
  const clearFiles = useCallback(() => {
    processedFiles.forEach(pf => URL.revokeObjectURL(pf.preview))
    setProcessedFiles([])
  }, [processedFiles])

  // 壓縮圖片
  const compressImage = useCallback(async (file: File, quality = 0.6): Promise<File> => {
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
  }, [])

  // 批次上傳護照並建立成員
  const handleBatchUpload = useCallback(async () => {
    if (processedFiles.length === 0) return
    if (isUploading) return
    if (!orderId) {
      void alert('需要訂單 ID 才能批次上傳', 'error')
      return
    }

    setIsUploading(true)
    try {
      // 壓縮所有圖片
      const compressedFiles = await Promise.all(
        processedFiles.map(pf => compressImage(pf.file))
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
      let matchedCustomerCount = 0
      let newCustomerCount = 0
      const failedItems: string[] = []
      const duplicateItems: string[] = []

      // 載入現有成員
      const { data: existingMembers } = await supabase
        .from('order_members')
        .select('passport_number, id_number, chinese_name, birth_date')
        .eq('order_id', orderId)

      const existingPassports = new Set(existingMembers?.map(m => m.passport_number).filter(Boolean) || [])
      const existingIdNumbers = new Set(existingMembers?.map(m => m.id_number).filter(Boolean) || [])
      const existingNameBirthKeys = new Set(
        existingMembers
          ?.filter(m => m.chinese_name && m.birth_date)
          .map(m => `${m.chinese_name}|${m.birth_date}`) || []
      )

      // 載入顧客資料
      await useCustomerStore.getState().fetchAll()
      const freshCustomers = useCustomerStore.getState().items

      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i]
        if (item.success && item.customer) {
          const passportNumber = item.customer.passport_number || ''
          const idNumber = item.customer.national_id || ''
          const birthDate = item.customer.date_of_birth || null
          const chineseName = item.customer.name || ''
          const cleanChineseName = chineseName.replace(/\([^)]+\)$/, '').trim()
          const nameBirthKey = cleanChineseName && birthDate ? `${cleanChineseName}|${birthDate}` : ''

          // 檢查重複
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
            continue
          }

          try {
            // 上傳護照照片
            let passportImageUrl: string | null = null
            if (compressedFiles[i]) {
              const file = compressedFiles[i]
              const timestamp = Date.now()
              const fileExt = file.name.split('.').pop() || 'jpg'
              const fileName = `${workspaceId}/${orderId}/${timestamp}_${i}.${fileExt}`

              const { error: uploadError } = await supabase.storage
                .from('passport-images')
                .upload(fileName, file, {
                  contentType: file.type,
                  upsert: false,
                })

              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('passport-images')
                  .getPublicUrl(fileName)
                passportImageUrl = urlData?.publicUrl || null
              }
            }

            // 建立訂單成員
            const memberData = {
              order_id: orderId,
              workspace_id: workspaceId,
              customer_id: null,
              chinese_name: cleanChineseName || '',
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

            // 更新快取
            if (passportNumber) existingPassports.add(passportNumber)
            if (idNumber) existingIdNumbers.add(idNumber)
            if (nameBirthKey) existingNameBirthKeys.add(nameBirthKey)

            successCount++

            // 同步顧客
            if (newMember && (idNumber || birthDate || passportNumber)) {
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

                matchedCustomerCount++
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)

                if (newCustomer) {
                  await supabase
                    .from('order_members')
                    .update({ customer_id: newCustomer.id })
                    .eq('id', newMember.id)
                  newCustomerCount++
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
      if (matchedCustomerCount > 0) {
        message += `\n✅ 已比對 ${matchedCustomerCount} 位現有顧客`
      }
      if (newCustomerCount > 0) {
        message += `\n✅ 已新增 ${newCustomerCount} 位顧客資料`
      }
      if (duplicateCount > 0) {
        message += `\n\n⚠️ 跳過 ${duplicateCount} 位重複成員：\n${duplicateItems.join('\n')}`
      }
      message += `\n\n📋 重要提醒：\n• OCR 資料已標記為「待驗證」\n• 請務必人工檢查護照資訊`
      if (failedItems.length > 0) {
        message += `\n\n❌ 失敗項目：\n${failedItems.join('\n')}`
      }
      void alert(message, 'success')

      // 清空檔案並重新載入
      clearFiles()
      await onSuccess()
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      void alert('批次上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setIsUploading(false)
    }
  }, [processedFiles, isUploading, orderId, workspaceId, compressImage, clearFiles, onSuccess])

  return {
    processedFiles,
    isUploading,
    isDragging,
    isProcessing,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleBatchUpload,
    clearFiles,
  }
}
