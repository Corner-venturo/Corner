/**
 * 資料夾操作 API
 *
 * GET  /api/folders - 取得資料夾列表
 * POST /api/folders - 建立資料夾
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import type { FileCategory } from '@/types/file-system.types'

/**
 * GET: 取得資料夾列表
 */
export const GET = withAuth(async (request: NextRequest, { user, supabase }) => {
  // 取得 workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return ApiError.forbidden('No workspace found')
  }

  const searchParams = request.nextUrl.searchParams
  const tourId = searchParams.get('tour_id')
  const parentId = searchParams.get('parent_id')
  const withFileCount = searchParams.get('with_file_count') === 'true'

  let query = supabase
    .from('folders')
    .select(withFileCount ? `*, files(count)` : '*')
    .eq('workspace_id', member.workspace_id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (tourId) {
    query = query.eq('tour_id', tourId)
  }

  if (parentId !== null) {
    if (parentId === 'root' || parentId === '') {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', parentId)
    }
  }

  const { data: folders, error } = await query

  if (error) {
    logger.error('[Folders Get] Error:', error)
    return ApiError.database('Failed to fetch folders')
  }

  // 處理 file_count
  const result = folders?.map((folder) => {
    const folderRecord = folder as unknown as Record<string, unknown>
    const files = folderRecord.files as Array<{ count: number }> | undefined
    return {
      ...folderRecord,
      file_count: withFileCount && files ? files[0]?.count || 0 : undefined,
      files: undefined,
    }
  })

  return successResponse({ folders: result })
})

/**
 * POST: 建立資料夾
 */
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

  const body = await request.json()
  const { name, parent_id, tour_id, customer_id, supplier_id, icon, color, default_category } = body

  if (!name) {
    return ApiError.missingField('name')
  }

  // 計算路徑和深度
  let path = '/'
  let depth = 0

  if (parent_id) {
    const { data: parentFolder } = await supabase
      .from('folders')
      .select('path, depth')
      .eq('id', parent_id)
      .single()

    if (parentFolder) {
      path = `${parentFolder.path}${parent_id}/`
      depth = parentFolder.depth + 1
    }
  }

  // 決定 folder_type
  let folderType = 'custom'
  if (tour_id) folderType = 'tour'
  else if (customer_id) folderType = 'customer'
  else if (supplier_id) folderType = 'supplier'
  else if (!parent_id) folderType = 'root'

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({
      workspace_id: member.workspace_id,
      name,
      folder_type: folderType,
      parent_id: parent_id || null,
      path,
      depth,
      tour_id: tour_id || null,
      customer_id: customer_id || null,
      supplier_id: supplier_id || null,
      icon: icon || null,
      color: color || null,
      default_category: (default_category as FileCategory) || null,
      is_system: false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    logger.error('[Folders Create] Error:', error)
    return ApiError.database('Failed to create folder')
  }

  return successResponse({ folder }, 201)
})
