/**
 * 檔案操作 API
 *
 * GET    /api/files/[id] - 取得檔案詳情
 * PATCH  /api/files/[id] - 更新檔案資訊
 * DELETE /api/files/[id] - 刪除檔案（軟刪除）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET: 取得檔案詳情
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

    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        folder:folders(id, name, path),
        tour:tours(id, code, name)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 更新最後存取時間
    await supabase
      .from('files')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ file })
  } catch (error) {
    logger.error('[File Get] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: 更新檔案資訊
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

    const body = await request.json()

    // 只允許更新特定欄位
    const allowedFields = [
      'filename',
      'folder_id',
      'category',
      'tags',
      'description',
      'notes',
      'is_starred',
      'is_archived',
      'tour_id',
      'customer_id',
      'supplier_id',
    ]

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
    updates.updated_by = session.user.id

    const { data: file, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single()

    if (error) {
      logger.error('[File Update] Error:', error)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    return NextResponse.json({ file })
  } catch (error) {
    logger.error('[File Update] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: 軟刪除檔案
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

    // 軟刪除
    const { error } = await supabase
      .from('files')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq('id', id)

    if (error) {
      logger.error('[File Delete] Error:', error)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[File Delete] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
