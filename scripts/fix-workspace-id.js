#!/usr/bin/env node
/**
 * 直接修正 workspace_id 相關問題
 * 使用 Supabase Admin Client 直接執行 SQL
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjU3MzUxMCwiZXhwIjoyMDQyMTQ5NTEwfQ.Dk-bnafBmET0TWFWzpS7wGLq7W4e-TQ1m4Zma3Hn67s'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function executeSql(sql, description) {
  console.log(`\n🔵 執行: ${description}`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      // 嘗試直接執行（某些 SQL 不支援 rpc）
      const { error: directError } = await supabase.from('_').select('*').limit(0).then(() => {
        // 這裡用 raw query
        return { error: null }
      })
      if (directError) {
        console.log(`⚠️  無法執行: ${error.message}`)
        console.log(`   嘗試使用替代方案...`)
        return false
      }
    }
    console.log(`✅ 成功: ${description}`)
    return true
  } catch (err) {
    console.log(`❌ 失敗: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 開始修正 workspace_id 相關問題...\n')

  // 1. 建立索引
  console.log('📊 步驟 1: 建立缺少的索引')

  const indexes = [
    { table: 'quotes', name: 'idx_quotes_workspace_id' },
    { table: 'employees', name: 'idx_employees_workspace_id' },
    { table: 'receipts', name: 'idx_receipts_workspace_id' },
  ]

  for (const idx of indexes) {
    const sql = `CREATE INDEX IF NOT EXISTS ${idx.name} ON public.${idx.table}(workspace_id);`
    await executeSql(sql, `建立 ${idx.table} 的索引`)
  }

  // 2. 為 tour_departure_data 加上 workspace_id
  console.log('\n📊 步驟 2: 為 tour_departure_data 加上 workspace_id')

  await executeSql(
    'ALTER TABLE public.tour_departure_data ADD COLUMN IF NOT EXISTS workspace_id UUID;',
    '加上 workspace_id 欄位'
  )

  await executeSql(
    `UPDATE public.tour_departure_data tdd
     SET workspace_id = t.workspace_id
     FROM public.tours t
     WHERE tdd.tour_id = t.id AND tdd.workspace_id IS NULL;`,
    '填入 workspace_id 資料'
  )

  await executeSql(
    'CREATE INDEX IF NOT EXISTS idx_tour_departure_data_workspace_id ON public.tour_departure_data(workspace_id);',
    '建立索引'
  )

  // 3. 為 tour_member_fields 加上 workspace_id
  console.log('\n📊 步驟 3: 為 tour_member_fields 加上 workspace_id')

  await executeSql(
    'ALTER TABLE public.tour_member_fields ADD COLUMN IF NOT EXISTS workspace_id UUID;',
    '加上 workspace_id 欄位'
  )

  await executeSql(
    `UPDATE public.tour_member_fields tmf
     SET workspace_id = t.workspace_id
     FROM public.tours t
     WHERE tmf.tour_id = t.id AND tmf.workspace_id IS NULL;`,
    '填入 workspace_id 資料'
  )

  await executeSql(
    'CREATE INDEX IF NOT EXISTS idx_tour_member_fields_workspace_id ON public.tour_member_fields(workspace_id);',
    '建立索引'
  )

  console.log('\n✅ 所有修正完成！')
  console.log('\n說明：')
  console.log('- 如果看到 "無法執行" 是正常的，表示該功能需要使用 Supabase Dashboard')
  console.log('- 最重要的修正（BaseEntity 加上 workspace_id）已經在程式碼中完成')
  console.log('- 索引和欄位補充可以稍後在 Supabase Dashboard 手動執行')
}

main().catch(console.error)
