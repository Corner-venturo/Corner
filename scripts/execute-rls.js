/**
 * 直接執行 RLS 禁用（使用 Supabase client）
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

// 所有核心表格
const TABLES = [
  // 系統表
  'employees', 'workspaces', 'user_roles',
  // Workspace
  'channels', 'channel_members', 'messages',
  // 核心業務
  'tours', 'orders', 'order_members', 'quotes', 'itineraries',
  'customers', 'suppliers',
  // 財務
  'payments', 'receipts', 'finance_requests',
  // 其他
  'todos', 'calendar_events', 'esims', 'visas', 'contracts',
  // 輔助
  'cost_templates', 'price_lists', 'bank_codes'
]

async function disableAllRLS() {
  console.log('🚀 開始禁用所有 RLS...\n')

  let successCount = 0
  let failCount = 0

  // Step 1: 禁用 RLS
  console.log('📋 Step 1: 禁用所有表格的 RLS\n')

  for (const table of TABLES) {
    try {
      const sql = `ALTER TABLE IF EXISTS public.${table} DISABLE ROW LEVEL SECURITY;`

      const { error } = await supabase.rpc('exec_sql', { sql })

      if (error) {
        console.log(`  ✗ ${table}: ${error.message}`)
        failCount++
      } else {
        console.log(`  ✓ ${table}`)
        successCount++
      }
    } catch (error) {
      console.log(`  ✗ ${table}: ${error.message}`)
      failCount++
    }
  }

  console.log(`\n✅ RLS 禁用完成：成功 ${successCount}，失敗 ${failCount}\n`)

  // Step 2: 刪除所有 policies
  console.log('📋 Step 2: 刪除所有 RLS policies\n')

  try {
    const dropPoliciesSQL = `
      DO $$
      DECLARE
        policy_record RECORD;
        policy_count INTEGER := 0;
      BEGIN
        FOR policy_record IN
          SELECT schemaname, tablename, policyname
          FROM pg_policies
          WHERE schemaname = 'public'
          ORDER BY tablename, policyname
        LOOP
          BEGIN
            EXECUTE format(
              'DROP POLICY IF EXISTS %I ON %I.%I',
              policy_record.policyname,
              policy_record.schemaname,
              policy_record.tablename
            );
            policy_count := policy_count + 1;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to drop policy: %.%', policy_record.tablename, policy_record.policyname;
          END;
        END LOOP;
        RAISE NOTICE 'Dropped % policies', policy_count;
      END $$;
    `

    const { error } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL })

    if (error) {
      console.log('  ✗ 刪除 policies 失敗:', error.message)
      console.log('\n⚠️ 可能需要在 Supabase SQL Editor 手動執行')
    } else {
      console.log('  ✓ 所有 policies 已刪除')
    }
  } catch (error) {
    console.log('  ✗ 刪除 policies 失敗:', error.message)
  }

  console.log('\n✅ RLS 完全禁用完成！')
  console.log('\n📋 Venturo 權限控制架構：')
  console.log('  1. Supabase Auth - 登入驗證')
  console.log('  2. employees.permissions - 功能權限控制')
  console.log('  3. employees.workspace_id - 資料隔離（前端 filter）')
  console.log('  4. user.roles - 角色標籤（admin, tour_leader 等）')
}

disableAllRLS().catch(console.error)
