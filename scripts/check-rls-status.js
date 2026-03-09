/**
 * 檢查所有表格的 RLS 狀態
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSStatus() {
  console.log('🔍 檢查所有表格的 RLS 狀態...\n')

  try {
    // 查詢所有啟用 RLS 的表格
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `,
    })

    if (error) {
      // 如果 exec_sql 不存在，用另一個方法
      console.log('⚠️ 無法使用 RPC，改用直接查詢...\n')

      // 直接查詢系統表
      const query = `
        SELECT
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `

      console.log('📋 請在 Supabase SQL Editor 執行以下查詢：\n')
      console.log(query)
      console.log('\n')

      // 至少列出我們知道的核心表格
      const knownTables = [
        'employees',
        'workspaces',
        'user_roles',
        'channels',
        'channel_members',
        'messages',
        'tours',
        'orders',
        'quotes',
        'itineraries',
        'customers',
        'todos',
        'calendar_events',
        'suppliers',
        'payments',
        'receipts',
      ]

      console.log('📊 已知的核心表格：')
      knownTables.forEach(table => {
        console.log(`  - ${table}`)
      })

      return
    }

    // 統計
    const rlsEnabled = tables.filter(t => t.rls_enabled)
    const rlsDisabled = tables.filter(t => !t.rls_enabled)

    console.log('📊 統計結果：')
    console.log(`  總表格數：${tables.length}`)
    console.log(`  RLS 啟用：${rlsEnabled.length}`)
    console.log(`  RLS 禁用：${rlsDisabled.length}\n`)

    if (rlsEnabled.length > 0) {
      console.log('🔒 RLS 已啟用的表格：')
      rlsEnabled.forEach(t => {
        console.log(`  ✗ ${t.tablename}`)
      })
      console.log('')
    }

    if (rlsDisabled.length > 0) {
      console.log('✅ RLS 已禁用的表格：')
      rlsDisabled.forEach(t => {
        console.log(`  ✓ ${t.tablename}`)
      })
      console.log('')
    }

    // 檢查是否有 policies
    console.log('🔍 檢查是否有 RLS policies...\n')

    const policiesQuery = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `

    console.log('📋 請在 Supabase SQL Editor 執行以下查詢檢查 policies：\n')
    console.log(policiesQuery)
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
  }
}

checkRLSStatus()
