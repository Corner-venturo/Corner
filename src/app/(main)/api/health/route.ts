import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Health Check API
 * 檢查系統各項服務狀態
 *
 * GET /api/health
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

    if (!supabaseUrl || !supabaseKey) {
      checks.services.database.status = 'error'
      checks.services.database.message = 'Supabase credentials not configured'
      checks.status = 'degraded'
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey)

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
    }
  } catch (error) {
    checks.services.database.status = 'error'
    checks.services.database.message = error instanceof Error ? error.message : 'Unknown error'
    checks.status = 'unhealthy'
  }

  const totalTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...checks,
      responseTime: totalTime,
    },
    {
      status: checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503,
    }
  )
}
