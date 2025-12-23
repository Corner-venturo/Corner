import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Detailed Health Check API
 * 詳細的系統健康檢查，包含各表資料統計
 *
 * GET /api/health/detailed
 */
export async function GET() {
  const startTime = Date.now()

  const checks = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'unknown' as 'ok' | 'error' | 'unknown' | 'degraded',
        responseTime: 0,
        message: '',
        tables: {} as Record<string, { count: number | null; error?: string }>,
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
    environment: process.env.NODE_ENV || 'development',
  }

  // 核心表列表
  const coreTables = [
    'employees',
    'tours',
    'orders',
    'members',
    'customers',
    'quotes',
    'quote_items',
    'payments',
    'todos',
  ]

  // 檢查 Supabase 連線和表資料
  try {
    const dbStartTime = Date.now()
    const supabase = getSupabaseAdminClient()

    // 並行查詢所有表的數量
    const tablePromises = coreTables.map(async tableName => {
      try {
        // 使用 type assertion 因為 tableName 是動態的
        const { count, error } = await supabase
          .from(tableName as 'employees')
          .select('*', { count: 'exact', head: true })

        if (error) {
          return {
            tableName,
            result: { count: null, error: error.message },
          }
        }

        return {
          tableName,
          result: { count },
        }
      } catch (err) {
        return {
          tableName,
          result: {
            count: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          },
        }
      }
    })

    const results = await Promise.all(tablePromises)

    // 整理結果
    results.forEach(({ tableName, result }) => {
      checks.services.database.tables[tableName] = result
    })

    checks.services.database.responseTime = Date.now() - dbStartTime

    // 檢查是否有錯誤
    const hasErrors = results.some(r => r.result.error)

    if (hasErrors) {
      checks.services.database.status = 'degraded'
      checks.services.database.message = 'Some tables have errors'
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
