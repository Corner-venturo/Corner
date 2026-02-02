/**
 * Tour File Save Utility
 * 
 * 自動將產生的文件存到團的對應資料夾
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { getOrCreateTourFolder, type FileCategory } from './tour-folders'

interface SaveTourFileParams {
  tourId: string
  tourCode: string
  workspaceId: string
  category: FileCategory
  fileName: string
  content: Blob | ArrayBuffer | string
  contentType: string
  createdBy?: string
}

interface SaveTourFileResult {
  success: boolean
  fileId?: string
  error?: string
}

/**
 * 儲存文件到團的資料夾
 */
export async function saveTourFile({
  tourId,
  tourCode,
  workspaceId,
  category,
  fileName,
  content,
  contentType,
  createdBy,
}: SaveTourFileParams): Promise<SaveTourFileResult> {
  const supabase = createSupabaseBrowserClient()

  try {
    // 1. 取得或建立資料夾
    const folderId = await getOrCreateTourFolder(tourId, workspaceId, tourCode, category, createdBy)
    
    if (!folderId) {
      logger.error('無法取得資料夾', { tourId, category })
      return { success: false, error: '無法取得資料夾' }
    }

    // 2. 生成唯一檔名（避免中文）
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = fileName.split('.').pop() || 'bin'
    const storageFileName = `${timestamp}-${randomStr}.${ext}`
    const storagePath = `${workspaceId}/${tourId}/${category}/${storageFileName}`

    // 3. 準備上傳內容
    let uploadContent: Blob
    if (content instanceof Blob) {
      uploadContent = content
    } else if (content instanceof ArrayBuffer) {
      uploadContent = new Blob([content], { type: contentType })
    } else {
      // string content (e.g., HTML)
      uploadContent = new Blob([content], { type: contentType })
    }

    // 4. 上傳到 Storage
    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(storagePath, uploadContent, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      logger.error('上傳失敗', { storagePath, error: uploadError })
      return { success: false, error: uploadError.message }
    }

    // 5. 記錄到 files 表
    const { data: fileData, error: insertError } = await supabase
      .from('files')
      .insert({
        workspace_id: workspaceId,
        folder_id: folderId,
        filename: fileName,
        original_filename: fileName,
        content_type: contentType,
        size_bytes: uploadContent.size,
        extension: ext,
        storage_path: storagePath,
        storage_bucket: 'workspace-files',
        category: category as 'quote' | 'contract' | 'passport' | 'itinerary' | 'ticket' | 'voucher' | 'insurance' | 'photo' | 'other' | 'visa' | 'invoice' | 'email_attachment' | 'request' | 'cancellation' | 'confirmation',
        tour_id: tourId,
        source: 'auto_generated',
        created_by: createdBy || null,
      })
      .select('id')
      .single()

    if (insertError) {
      logger.error('寫入 DB 失敗', { error: insertError })
      // 嘗試刪除已上傳的檔案
      await supabase.storage.from('workspace-files').remove([storagePath])
      return { success: false, error: insertError.message }
    }

    logger.info('文件已存檔', { tourId, category, fileName, fileId: fileData.id })
    return { success: true, fileId: fileData.id }
  } catch (err) {
    logger.error('存檔失敗', { err })
    return { success: false, error: err instanceof Error ? err.message : '未知錯誤' }
  }
}

/**
 * 快捷方法：儲存報價單
 */
export async function saveQuotePdf(
  tourId: string,
  tourCode: string,
  workspaceId: string,
  pdfBlob: Blob,
  quoteName: string,
  createdBy?: string
) {
  return saveTourFile({
    tourId,
    tourCode,
    workspaceId,
    category: 'quote',
    fileName: `${quoteName}.pdf`,
    content: pdfBlob,
    contentType: 'application/pdf',
    createdBy,
  })
}

/**
 * 快捷方法：儲存行程表
 */
export async function saveItineraryPdf(
  tourId: string,
  tourCode: string,
  workspaceId: string,
  pdfBlob: Blob,
  itineraryName: string,
  createdBy?: string
) {
  return saveTourFile({
    tourId,
    tourCode,
    workspaceId,
    category: 'itinerary',
    fileName: `${itineraryName}.pdf`,
    content: pdfBlob,
    contentType: 'application/pdf',
    createdBy,
  })
}

/**
 * 快捷方法：儲存確認單
 */
export async function saveConfirmationPdf(
  tourId: string,
  tourCode: string,
  workspaceId: string,
  pdfBlob: Blob,
  confirmationName: string,
  createdBy?: string
) {
  return saveTourFile({
    tourId,
    tourCode,
    workspaceId,
    category: 'confirmation',
    fileName: `${confirmationName}.pdf`,
    content: pdfBlob,
    contentType: 'application/pdf',
    createdBy,
  })
}

/**
 * 快捷方法：儲存需求單
 */
export async function saveRequestHtml(
  tourId: string,
  tourCode: string,
  workspaceId: string,
  htmlContent: string,
  requestName: string,
  createdBy?: string
) {
  return saveTourFile({
    tourId,
    tourCode,
    workspaceId,
    category: 'request',
    fileName: `${requestName}.html`,
    content: htmlContent,
    contentType: 'text/html',
    createdBy,
  })
}

/**
 * 快捷方法：儲存取消單
 */
export async function saveCancellationHtml(
  tourId: string,
  tourCode: string,
  workspaceId: string,
  htmlContent: string,
  cancellationName: string,
  createdBy?: string
) {
  return saveTourFile({
    tourId,
    tourCode,
    workspaceId,
    category: 'cancellation',
    fileName: `${cancellationName}.html`,
    content: htmlContent,
    contentType: 'text/html',
    createdBy,
  })
}
