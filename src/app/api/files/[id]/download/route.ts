/**
 * 檔案下載 API
 *
 * GET /api/files/[id]/download
 */

import { NextRequest } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/api/with-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export const GET = withAuth(async (_request: NextRequest, { supabase }: AuthContext, params: Record<string, string>) => {
  // 取得檔案資訊
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('*')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single()

  if (fileError || !file) {
    return ApiError.notFound('檔案')
  }

  // 生成簽名 URL
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 60 * 60) // 1 小時有效

  if (urlError || !signedUrl) {
    logger.error('[File Download] Failed to create signed URL:', urlError)
    return ApiError.internal('Failed to generate download URL')
  }

  // 更新下載次數
  await supabase
    .from('files')
    .update({
      download_count: (file.download_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  return successResponse({
    url: signedUrl.signedUrl,
    filename: file.original_filename,
    content_type: file.content_type,
  })
})
