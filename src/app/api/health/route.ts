import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Health Check API
 * 檢查系統各項服務狀態
 *
 * GET /api/health
 *
 * 注意：此 API 使用自定義狀態碼 (200/207/503)，不使用統一回應格式
 */
export async function GET() {
  const startTime = Date.now()

  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'unknown' as 'ok' | 'error' | 'unknown',
        responseTime: 0,
        message: '',
      },
      cache: {
        status: 'ok' as 'ok' | 'error' | 'unknown',
        message: 'IndexedDB (client-side)',
      },
    },
    version: {
      app: '5.8.0',
      node: process.version,
    },
  }

  // 檢查 Supabase 連線
  try {
    const dbStartTime = Date.now()
    const supabase = getSupabaseAdminClient()

    // 簡單查詢測試連線
    const { error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })

    checks.services.database.responseTime = Date.now() - dbStartTime

    if (error) {
      checks.services.database.status = 'error'
      checks.services.database.message = error.message
      checks.status = 'degraded'
    } else {
      checks.services.database.status = 'ok'
      checks.services.database.message = `Connected (${checks.services.database.responseTime}ms)`
    }
  } catch (error) {
    checks.services.database.status = 'error'
    checks.services.database.message = error instanceof Error ? error.message : 'Unknown error'
    checks.status = 'unhealthy'
  }

  const totalTime = Date.now() - startTime

  // 健康檢查使用特殊狀態碼：200=健康, 207=部分降級, 503=不健康
  return NextResponse.json(
    {
      success: checks.status === 'healthy',
      data: {
        ...checks,
        responseTime: totalTime,
      },
    },
    {
      status: checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503,
    }
  )
}
