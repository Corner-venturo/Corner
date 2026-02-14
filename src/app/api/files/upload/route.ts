/**
 * 檔案上傳 API
 *
 * POST /api/files/upload
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import type { FileCategory } from '@/types/file-system.types'

// 允許的檔案類型
const ALLOWED_MIME_TYPES = [
  // 文件
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // 圖片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/svg+xml',
  // 壓縮檔
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]

// 最大檔案大小 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

export const POST = withAuth(async (request: NextRequest, { user, supabase }) => {
  // 取得 workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return ApiError.forbidden('No workspace found')
  }

  const workspaceId = member.workspace_id

  // 解析 FormData
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return ApiError.missingField('file')
  }

  // 驗證檔案大小
  if (file.size > MAX_FILE_SIZE) {
    return ApiError.validation(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // 驗證檔案類型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return ApiError.validation(`File type not allowed: ${file.type}`)
  }

  // 取得其他參數
  const folderId = formData.get('folder_id') as string | null
  const tourId = formData.get('tour_id') as string | null
  const customerId = formData.get('customer_id') as string | null
  const supplierId = formData.get('supplier_id') as string | null
  const category = (formData.get('category') as FileCategory) || 'other'
  const description = formData.get('description') as string | null
  const tagsRaw = formData.get('tags') as string | null
  const tags = tagsRaw ? JSON.parse(tagsRaw) : []

  // 生成唯一檔名
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const safeFilename = `${timestamp}-${randomStr}.${extension}`
  const storagePath = `${workspaceId}/${safeFilename}`

  // 上傳到 Supabase Storage
  const fileBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    logger.error('[File Upload] Storage error:', uploadError)
    return ApiError.database('Failed to upload file')
  }

  // 建立資料庫記錄
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      workspace_id: workspaceId,
      folder_id: folderId,
      filename: file.name,
      original_filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      extension,
      storage_path: storagePath,
      storage_bucket: 'workspace-files',
      category,
      tags,
      tour_id: tourId,
      customer_id: customerId,
      supplier_id: supplierId,
      source: 'upload',
      description,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    logger.error('[File Upload] Database error:', dbError)
    // 嘗試刪除已上傳的檔案
    await supabase.storage.from('workspace-files').remove([storagePath])
    return ApiError.database('Failed to save file record')
  }

  logger.log('[File Upload] Success:', {
    id: fileRecord.id,
    filename: file.name,
    size: file.size,
  })

  return successResponse({ file: fileRecord }, 201)
})
