/**
 * 單一資料夾操作 API
 *
 * GET    /api/folders/[id] - 取得資料夾詳情
 * PATCH  /api/folders/[id] - 更新資料夾
 * DELETE /api/folders/[id] - 刪除資料夾
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET: 取得資料夾詳情（含檔案）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    logger.error('[Folder Get] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: 更新資料夾
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 檢查是否為系統資料夾
    const { data: existing } = await supabase
      .from('folders')
      .select('is_system')
      .eq('id', id)
      .single()

    if (existing?.is_system) {
      return NextResponse.json(
        { error: 'Cannot modify system folder' },
        { status: 403 }
      )
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
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    logger.error('[Folder Update] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: 刪除資料夾
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 檢查是否為系統資料夾
    const { data: existing } = await supabase
      .from('folders')
      .select('is_system')
      .eq('id', id)
      .single()

    if (existing?.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system folder' },
        { status: 403 }
      )
    }

    // 檢查是否有子資料夾
    const { data: children } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with sub-folders' },
        { status: 400 }
      )
    }

    // 檢查是否有檔案
    const { data: files } = await supabase
      .from('files')
      .select('id')
      .eq('folder_id', id)
      .eq('is_deleted', false)
      .limit(1)

    if (files && files.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with files. Move or delete files first.' },
        { status: 400 }
      )
    }

    // 刪除資料夾
    const { error } = await supabase.from('folders').delete().eq('id', id)

    if (error) {
      logger.error('[Folder Delete] Error:', error)
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[Folder Delete] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
