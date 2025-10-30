import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()

    // 讀取 migration 文件
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20251026040000_create_user_data_tables.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // 分割 SQL 語句（以分號分隔，但忽略註釋中的分號）
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--')) // 移除註釋行
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    const results = []

    // 逐個執行 SQL 語句
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        })

        if (error) {
          // 如果是 "already exists" 錯誤，視為成功
          if (error.message.includes('already exists')) {
            results.push({
              success: true,
              statement: statement.substring(0, 100) + '...',
              message: 'Already exists (skipped)',
            })
          } else {
            results.push({
              success: false,
              statement: statement.substring(0, 100) + '...',
              error: error.message,
            })
          }
        } else {
          results.push({
            success: true,
            statement: statement.substring(0, 100) + '...',
            data,
          })
        }
      } catch (err: any) {
        results.push({
          success: false,
          statement: statement.substring(0, 100) + '...',
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration execution completed',
      results,
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error,
      },
      { status: 500 }
    )
  }
}
