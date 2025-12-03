import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用 service role key 作為 admin client（server-side only）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Missing itinerary ID' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    // 使用 admin client 查詢
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Supabase error:', error)
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }

    // 可選：驗證 workspace_id（如果請求帶有 workspace header）
    const requestedWorkspace = request.headers.get('x-workspace-id')
    if (requestedWorkspace && data.workspace_id !== requestedWorkspace) {
      logger.warn('Workspace mismatch:', {
        requested: requestedWorkspace,
        actual: data.workspace_id,
      })
      // 僅記錄警告，不阻擋請求（因為這是公開分享功能）
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
