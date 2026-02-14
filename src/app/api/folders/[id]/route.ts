/**
 * 單一資料夾操作 API
 *
 * GET    /api/folders/[id] - 取得資料夾詳情
 * PATCH  /api/folders/[id] - 更新資料夾
 * DELETE /api/folders/[id] - 刪除資料夾
 */

import { NextRequest } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/api/with-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

/**
 * GET: 取得資料夾詳情（含檔案）
 */
export const GET = withAuth(async (request: NextRequest, { supabase }: AuthContext, params: Record<string, string>) => {
  const id = params.id

  const searchParams = request.nextUrl.searchParams
  const withFiles = searchParams.get('with_files') === 'true'
  const withChildren = searchParams.get('with_children') === 'true'

  let selectQuery = '*'
  if (withFiles) {
    selectQuery += ', files(*)'
  }
  if (withChildren) {
    selectQuery += ', children:folders!parent_id(*)'
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .select(selectQuery)
    .eq('id', id)
    .single()

  if (error || !folder) {
    return ApiError.notFound('資料夾')
  }

  return successResponse({ folder })
})

/**
 * PATCH: 更新資料夾
 */
export const PATCH = withAuth(async (request: NextRequest, { supabase }: AuthContext, params: Record<string, string>) => {
  const id = params.id

  // 檢查是否為系統資料夾
  const { data: existing } = await supabase
    .from('folders')
    .select('is_system')
    .eq('id', id)
    .single()

  if (existing?.is_system) {
    return ApiError.forbidden('Cannot modify system folder')
  }

  const body = await request.json()

  // 只允許更新特定欄位
  const allowedFields = ['name', 'icon', 'color', 'default_category', 'sort_order']
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

  const { data: folder, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('[Folder Update] Error:', error)
    return ApiError.database('Failed to update folder')
  }

  return successResponse({ folder })
})

/**
 * DELETE: 刪除資料夾
 */
export const DELETE = withAuth(async (_request: NextRequest, { supabase }: AuthContext, params: Record<string, string>) => {
  const id = params.id

  // 檢查是否為系統資料夾
  const { data: existing } = await supabase
    .from('folders')
    .select('is_system')
    .eq('id', id)
    .single()

  if (existing?.is_system) {
    return ApiError.forbidden('Cannot delete system folder')
  }

  // 檢查是否有子資料夾
  const { data: children } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', id)
    .limit(1)

  if (children && children.length > 0) {
    return ApiError.validation('Cannot delete folder with sub-folders')
  }

  // 檢查是否有檔案
  const { data: files } = await supabase
    .from('files')
    .select('id')
    .eq('folder_id', id)
    .eq('is_deleted', false)
    .limit(1)

  if (files && files.length > 0) {
    return ApiError.validation('Cannot delete folder with files. Move or delete files first.')
  }

  // 刪除資料夾
  const { error } = await supabase.from('folders').delete().eq('id', id)

  if (error) {
    logger.error('[Folder Delete] Error:', error)
    return ApiError.database('Failed to delete folder')
  }

  return successResponse({ success: true })
})
