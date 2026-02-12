/**
 * usePassportUpload - 護照上傳與 OCR 辨識 Hook (主 Hook)
 * 從 OrderMembersExpandable.tsx 拆分出來
 *
 * 功能：
 * - 檔案選擇和拖放
 * - PDF 轉圖片
 * - 圖片壓縮
 * - OCR 辨識
 * - 批次上傳建立成員
 *
 * 架構：整合以下子模組
 * - usePassportFiles: 檔案處理邏輯
 * - usePassportOcr: OCR 識別邏輯
 * - usePassportValidation: 驗證與成員建立
 */

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import type { ProcessedFile } from '../order-member.types'
import { usePassportFiles } from './passport/usePassportFiles'
import { usePassportOcr } from './passport/usePassportOcr'
import { usePassportValidation } from './passport/usePassportValidation'
import { COMP_ORDERS_LABELS } from '../constants/labels'

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
  handleUpdateFilePreview: (index: number, newPreviewDataUrl: string) => void
  handleBatchUpload: () => Promise<void>
  clearFiles: () => void
}

export function usePassportUpload({
  orderId,
  workspaceId,
  onSuccess,
}: UsePassportUploadParams): UsePassportUploadReturn {
  const [isUploading, setIsUploading] = useState(false)

  // 使用子模組
  const fileModule = usePassportFiles()
  const ocrModule = usePassportOcr()
  const validationModule = usePassportValidation()

  // 批次上傳護照並建立成員
  const handleBatchUpload = useCallback(async () => {
    if (fileModule.processedFiles.length === 0) return
    if (isUploading) return
    if (!orderId) {
      void alert(COMP_ORDERS_LABELS.需要訂單_ID_才能批次上傳, 'error')
      return
    }

    setIsUploading(true)
    try {
      // 壓縮所有圖片
      const compressedFiles = await Promise.all(
        fileModule.processedFiles.map(pf => fileModule.compressImage(pf.file))
      )

      // 呼叫 OCR API
      const result = await ocrModule.performOcr(compressedFiles)

      // 統計
      let successCount = 0
      let duplicateCount = 0
      let matchedCustomerCount = 0
      let newCustomerCount = 0
      let updatedCount = 0  // 新增：更新現有成員的計數
      const failedItems: string[] = []
      const duplicateItems: string[] = []
      const updatedItems: string[] = []  // 新增：更新的成員列表

      // 載入現有成員（包含 id）
      const { data: existingMembers } = await supabase
        .from('order_members')
        .select('id, passport_number, id_number, chinese_name, birth_date')
        .eq('order_id', orderId)

      // 處理每個 OCR 結果
      for (let i = 0; i < result.results.length; i++) {
        const item = result.results[i]

        if (item.success && item.customer) {
          // 檢查重複
          const duplicateCheck = ocrModule.checkDuplicate(
            item.customer,
            existingMembers || []
          )

          // 完全重複 → 跳過
          if (duplicateCheck.isDuplicate) {
            duplicateCount++
            const displayName = item.customer.name || item.fileName
            duplicateItems.push(`${displayName} (${duplicateCheck.reason})`)
            continue
          }

          // 姓名比對到（無生日資料）→ 更新現有成員
          if (duplicateCheck.matchType === 'name_only' && duplicateCheck.matchedMember) {
            const updateResult = await validationModule.updateOrderMember({
              memberId: duplicateCheck.matchedMember.id,
              orderId,
              workspaceId,
              customerData: item.customer,
              file: compressedFiles[i],
              fileIndex: i,
            })

            if (updateResult.success) {
              updatedCount++
              const displayName = item.customer.name || duplicateCheck.matchedMember.chinese_name || item.fileName
              updatedItems.push(displayName)
            } else {
              failedItems.push(`${item.fileName} (更新失敗)`)
            }
            continue
          }

          // 沒有重複 → 建立新成員
          const createResult = await validationModule.createOrderMember({
            orderId,
            workspaceId,
            customerData: item.customer,
            file: compressedFiles[i],
            fileIndex: i,
          })

          if (createResult.success) {
            successCount++
            if (createResult.matchedCustomer) matchedCustomerCount++
            if (createResult.newCustomer) newCustomerCount++
          } else {
            failedItems.push(`${item.fileName} (建立失敗)`)
          }
        } else {
          failedItems.push(`${item.fileName} (辨識失敗)`)
        }
      }

      // 顯示結果
      let message = `成功辨識 ${result.successful}/${result.total} 張護照`
      if (successCount > 0) {
        message += `\n成功建立 ${successCount} 位成員`
      }
      if (updatedCount > 0) {
        message += `\n已更新 ${updatedCount} 位現有成員：\n${updatedItems.join('、')}`
      }
      if (matchedCustomerCount > 0) {
        message += `\n已比對 ${matchedCustomerCount} 位現有顧客`
      }
      if (newCustomerCount > 0) {
        message += `\n已新增 ${newCustomerCount} 位顧客資料`
      }
      if (duplicateCount > 0) {
        message += `\n\n跳過 ${duplicateCount} 位重複成員：\n${duplicateItems.join('\n')}`
      }
      message += `\n\n重要提醒：\n• OCR 資料已標記為「待驗證」\n• 請務必人工檢查護照資訊`
      if (failedItems.length > 0) {
        message += `\n\n失敗項目：\n${failedItems.join('\n')}`
      }
      void alert(message, 'success')

      // 清空檔案並重新載入
      fileModule.clearFiles()
      await onSuccess()
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.批次上傳失敗, error)
      void alert(COMP_ORDERS_LABELS.批次上傳失敗_2 + (error instanceof Error ? error.message : COMP_ORDERS_LABELS.未知錯誤), 'error')
    } finally {
      setIsUploading(false)
    }
  }, [
    fileModule,
    ocrModule,
    validationModule,
    isUploading,
    orderId,
    workspaceId,
    onSuccess,
  ])

  return {
    processedFiles: fileModule.processedFiles,
    isUploading,
    isDragging: fileModule.isDragging,
    isProcessing: fileModule.isProcessing,
    handleFileChange: fileModule.handleFileChange,
    handleDragOver: fileModule.handleDragOver,
    handleDragLeave: fileModule.handleDragLeave,
    handleDrop: fileModule.handleDrop,
    handleRemoveFile: fileModule.handleRemoveFile,
    handleUpdateFilePreview: fileModule.updateFilePreview,
    handleBatchUpload,
    clearFiles: fileModule.clearFiles,
  }
}
