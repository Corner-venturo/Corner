/**
 * Passport Upload Hook
 * 管理護照批次上傳功能：文件拖放、PDF轉圖片、壓縮、OCR處理
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Customer } from '@/types/customer.types'

interface UploadResult {
  success: boolean
  fileName: string
  customer?: Customer
  message?: string
}

interface UsePassportUploadOptions {
  onSuccess?: (customers: Partial<Customer>[]) => void | Promise<void>
}

export function usePassportUpload(options?: UsePassportUploadOptions) {
  const { onSuccess } = options || {}
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 📁 文件變更處理
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    logger.log('📁 handlePassportFileChange triggered', e.target.files)
    const newFiles = e.target.files
    if (newFiles && newFiles.length > 0) {
      logger.log('📁 Adding files:', Array.from(newFiles).map(f => f.name))
      setFiles(prev => [...prev, ...Array.from(newFiles)])
    }
  }, [])

  // 🖱️ 拖放事件處理
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    logger.log('📥 Files dropped:', droppedFiles.map(f => f.name))

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles])
    }
  }, [])

  // 🗑️ 移除文件
  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 📄 PDF 轉圖片（每頁轉成一張圖）
  const convertPdfToImages = useCallback(async (pdfFile: File): Promise<File[]> => {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`

    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images: File[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: context, viewport }).promise

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
      })

      const fileName = pdfFile.name.replace('.pdf', `_page${i}.jpg`)
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' })
      images.push(imageFile)
    }

    return images
  }, [])

  // 🗜️ 壓縮圖片（確保小於 800KB）
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

          // 降低到 1200px 以確保檔案大小
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

                // 如果還是太大，遞迴降低品質（目標 800 KB）
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

  // 📤 批次上傳
  const handleBatchUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error('請選擇至少一個檔案')
      return
    }

    setIsUploading(true)
    const results: UploadResult[] = []

    try {
      // 處理所有文件（包括 PDF）
      const allFiles: File[] = []
      for (const file of files) {
        if (file.type === 'application/pdf') {
          logger.log(`📄 Converting PDF: ${file.name}`)
          const images = await convertPdfToImages(file)
          allFiles.push(...images)
        } else {
          allFiles.push(file)
        }
      }

      logger.log(`📤 開始上傳 ${allFiles.length} 個檔案`)

      // 逐一處理每個文件
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i]
        logger.log(`處理 ${i + 1}/${allFiles.length}: ${file.name}`)

        try {
          // 1. 壓縮圖片
          const compressedFile = await compressImage(file)
          logger.log(`✅ 壓縮完成: ${file.name} (${(compressedFile.size / 1024).toFixed(0)} KB)`)

          // 2. 呼叫 OCR API
          const formData = new FormData()
          formData.append('files', compressedFile)

          const ocrResponse = await fetch('/api/ocr/passport', {
            method: 'POST',
            body: formData,
          })

          if (!ocrResponse.ok) {
            throw new Error('OCR 辨識失敗')
          }

          const ocrResult = await ocrResponse.json()

          if (ocrResult.results?.[0]?.success && ocrResult.results[0].customer) {
            const ocrData = ocrResult.results[0].customer

            // 3. 根據護照號碼或身分證字號查找現有客戶
            let matchedCustomer: Customer | null = null

            if (ocrData.passport_number || ocrData.national_id) {
              const { data: existingCustomers } = await supabase
                .from('customers')
                .select('*')
                .or(
                  `passport_number.eq.${ocrData.passport_number || ''},national_id.eq.${
                    ocrData.national_id || ''
                  }`
                )
                .limit(1)

              if (existingCustomers && existingCustomers.length > 0) {
                matchedCustomer = existingCustomers[0]
                logger.log(`✅ 找到匹配客戶: ${matchedCustomer?.name ?? ''}`)
              }
            }

            // 4. 性別判斷
            let gender = ocrData.sex || ocrData.gender
            if (!gender && ocrData.national_id) {
              const secondChar = ocrData.national_id.charAt(1)
              if (secondChar === '1') gender = '男'
              else if (secondChar === '2') gender = '女'
            }

            // 5. 上傳圖片到 storage (統一使用 passport-images bucket)
            // 統一格式：passport_{timestamp}_{random}.jpg（根目錄）
            const random = Math.random().toString(36).substring(2, 8)
            const fileName = `passport_${Date.now()}_${random}.jpg`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('passport-images')
              .upload(fileName, compressedFile)

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('passport-images').getPublicUrl(fileName)
            const imageUrl = urlData.publicUrl

            // 6. 更新或創建客戶資料
            if (matchedCustomer) {
              // 記錄舊的護照圖片 URL
              const oldPassportUrl = matchedCustomer.passport_image_url

              // 更新現有客戶
              await supabase
                .from('customers')
                .update({
                  passport_image_url: imageUrl,
                  passport_name: ocrData.passport_name || matchedCustomer.passport_name,
                  passport_number: ocrData.passport_number || matchedCustomer.passport_number,
                  passport_expiry: ocrData.passport_expiry || matchedCustomer.passport_expiry,
                  birth_date: ocrData.birth_date || matchedCustomer.birth_date,
                  gender: gender || matchedCustomer.gender,
                  national_id: ocrData.national_id || matchedCustomer.national_id,
                  verification_status: 'unverified',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', matchedCustomer.id)

              // 更新成功後刪除舊照片
              if (oldPassportUrl && oldPassportUrl.includes('passport-images')) {
                try {
                  const match = oldPassportUrl.match(/passport-images\/(.+)$/)
                  if (match) {
                    const oldFileName = decodeURIComponent(match[1])
                    await supabase.storage.from('passport-images').remove([oldFileName])
                    logger.log(`已刪除舊護照照片: ${oldFileName}`)
                  }
                } catch (err) {
                  logger.error('刪除舊護照照片失敗:', err)
                }
              }

              results.push({
                success: true,
                fileName: file.name,
                customer: matchedCustomer,
                message: `已更新客戶: ${matchedCustomer.name}`,
              })
            } else {
              results.push({
                success: true,
                fileName: file.name,
                message: `OCR 成功，但未找到匹配客戶。請手動創建。`,
              })
            }
          } else {
            results.push({
              success: false,
              fileName: file.name,
              message: 'OCR 辨識失敗',
            })
          }
        } catch (error) {
          logger.error(`❌ 處理失敗: ${file.name}`, error)
          results.push({
            success: false,
            fileName: file.name,
            message: error instanceof Error ? error.message : '處理失敗',
          })
        }
      }

      // 顯示結果
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(`成功處理 ${successCount} 個檔案`)
      }
      if (failCount > 0) {
        toast.error(`失敗 ${failCount} 個檔案`)
      }

      // 清空文件列表
      setFiles([])

      // 觸發成功回調，傳入成功識別的客戶資料
      if (onSuccess) {
        const successfulCustomers = results
          .filter(r => r.success && r.customer)
          .map(r => r.customer as Partial<Customer>)
        await onSuccess(successfulCustomers)
      }
    } catch (error) {
      logger.error('批次上傳失敗:', error)
      toast.error('批次上傳失敗')
    } finally {
      setIsUploading(false)
    }
  }, [files, convertPdfToImages, compressImage, onSuccess])

  // 清除所有文件
  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return {
    files,
    isUploading,
    isDragging,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleBatchUpload,
    // 別名方法（兼容 CustomerAddDialog）
    removeFile: handleRemoveFile,
    processFiles: handleBatchUpload,
    clearFiles,
  }
}
