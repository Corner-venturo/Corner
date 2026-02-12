import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Health Check API
 * 檢查系統各項服務狀態
 *
 * GET /api/health
 *
 * 公開端點 — 只回傳 healthy/unhealthy，不暴露內部細節
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { status: 'degraded' },
        { status: 207 }
      )
    }

    return NextResponse.json(
      { status: 'healthy' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: 'unhealthy' },
      { status: 503 }
    )
  }
}
