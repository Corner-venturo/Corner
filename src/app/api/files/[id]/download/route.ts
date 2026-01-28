/**
 * 檔案下載 API
 *
 * GET /api/files/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

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

    // 取得檔案資訊
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 生成簽名 URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 60 * 60) // 1 小時有效

    if (urlError || !signedUrl) {
      logger.error('[File Download] Failed to create signed URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // 更新下載次數
    await supabase
      .from('files')
      .update({
        download_count: (file.download_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      url: signedUrl.signedUrl,
      filename: file.original_filename,
      content_type: file.content_type,
    })
  } catch (error) {
    logger.error('[File Download] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
