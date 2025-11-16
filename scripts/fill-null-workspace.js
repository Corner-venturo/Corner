/**
 * 使用 Supabase client 填充 NULL workspace_id
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = ['quotes', 'calendar_events', 'todos', 'tours', 'orders', 'customers', 'itineraries', 'channels']

async function fillNullWorkspaceIds() {
  console.log('🔍 開始填充 NULL workspace_id...\n')

  // 1. 取得台北辦公室 ID
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, code, name')
    .eq('code', 'TP')
    .limit(1)

  if (!workspaces || workspaces.length === 0) {
    console.log('❌ 找不到台北辦公室 (TP)')
    return
  }

  const taipeiWorkspace = workspaces[0]
  console.log(`✅ 台北辦公室: ${taipeiWorkspace.name} (${taipeiWorkspace.id})\n`)

  let totalAffected = 0

  // 2. 更新每個表格
  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({ workspace_id: taipeiWorkspace.id })
        .is('workspace_id', null)
        .select('id')

      if (error) {
        console.log(`  ✗ ${table}: ${error.message}`)
        continue
      }

      const count = data?.length || 0
      if (count > 0) {
        console.log(`  ✓ ${table}: ${count} 筆`)
        totalAffected += count
      }
    } catch (error) {
      console.log(`  ✗ ${table}: ${error.message}`)
    }
  }

  console.log(`\n✅ 總共填充了 ${totalAffected} 筆資料到台北辦公室`)

  // 3. 驗證
  console.log('\n🔍 驗證結果...\n')

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .is('workspace_id', null)

      if (error) continue

      const nullCount = data?.length || 0
      if (nullCount > 0) {
        console.log(`  ⚠️  ${table}: 還有 ${nullCount} 筆 NULL`)
      } else {
        console.log(`  ✓ ${table}: 全部都有 workspace_id`)
      }
    } catch (error) {
      // ignore
    }
  }

  console.log('\n✅ 完成！')
}

fillNullWorkspaceIds().catch(console.error)
