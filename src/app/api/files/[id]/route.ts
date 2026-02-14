/**
 * 檔案操作 API
 *
 * GET    /api/files/[id] - 取得檔案詳情
 * PATCH  /api/files/[id] - 更新檔案資訊
 * DELETE /api/files/[id] - 刪除檔案（軟刪除）
 */

import { NextRequest } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/api/with-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

/**
 * GET: 取得檔案詳情
 */
export const GET = withAuth(async (_request: NextRequest, { supabase }: AuthContext, params: Record<string, string>) => {
  const { data: file, error } = await supabase
    .from('files')
    .select(`
      *,
      folder:folders(id, name, path),
      tour:tours(id, code, name)
    `)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single()

  if (error || !file) {
    return ApiError.notFound('檔案')
  }

  // 更新最後存取時間
  await supabase
    .from('files')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', params.id)

  return successResponse({ file })
})

/**
 * PATCH: 更新檔案資訊
 */
export const PATCH = withAuth(async (request: NextRequest, { user, supabase }: AuthContext, params: Record<string, string>) => {
  const body = await request.json()

  const allowedFields = [
    'filename', 'folder_id', 'category', 'tags', 'description',
    'notes', 'is_starred', 'is_archived', 'tour_id', 'customer_id', 'supplier_id',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return ApiError.validation('No valid fields to update')
  }

  updates.updated_at = new Date().toISOString()
  updates.updated_by = user.id

  const { data: file, error } = await supabase
    .from('files')
    .update(updates)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .select()
    .single()

  if (error) {
    logger.error('[File Update] Error:', error)
    return ApiError.database('Failed to update file')
  }

  return successResponse({ file })
})

/**
 * DELETE: 軟刪除檔案
 */
export const DELETE = withAuth(async (_request: NextRequest, { user, supabase }: AuthContext, params: Record<string, string>) => {
  const { error } = await supabase
    .from('files')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', params.id)

  if (error) {
    logger.error('[File Delete] Error:', error)
    return ApiError.database('Failed to delete file')
  }

  return successResponse({ success: true })
})
