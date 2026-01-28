/**
 * 資料夾操作 API
 *
 * GET  /api/folders - 取得資料夾列表
 * POST /api/folders - 建立資料夾
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { FileCategory } from '@/types/file-system.types'

/**
 * GET: 取得資料夾列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 取得 workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', session.user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
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
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
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

    return NextResponse.json({ folders: result })
  } catch (error) {
    logger.error('[Folders Get] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * POST: 建立資料夾
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 取得 workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', session.user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    const body = await request.json()
    const { name, parent_id, tour_id, customer_id, supplier_id, icon, color, default_category } = body

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
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
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('[Folders Create] Error:', error)
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    logger.error('[Folders Create] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
