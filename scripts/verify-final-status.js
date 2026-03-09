/**
 * 驗證最終狀態：檢查是否有資料因為 workspace_id 而看不到
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey)

// 需要檢查的核心表格
const CORE_TABLES = [
  'tours',
  'orders',
  'quotes',
  'customers',
  'itineraries',
  'calendar_events',
  'todos',
  'channels',
  'messages',
]

async function verifyDataVisibility() {
  console.log('🔍 檢查資料可見性...\n')

  // 1. 取得台北 workspace ID
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, code, name')
    .order('created_at')

  if (!workspaces || workspaces.length === 0) {
    console.log('❌ 找不到任何 workspace')
    return
  }

  console.log('📊 Workspaces:')
  workspaces.forEach(ws => {
    console.log(`  - ${ws.name} (${ws.code}): ${ws.id}`)
  })
  console.log('')

  const taipeiWorkspace = workspaces[0]
  console.log(`✅ 預設 workspace: ${taipeiWorkspace.name}\n`)

  // 2. 檢查每個表格的資料
  console.log('📋 檢查各表格的 workspace_id 狀況：\n')

  for (const table of CORE_TABLES) {
    try {
      // 查詢所有資料
      const { data: allData, error: allError } = await supabase
        .from(table)
        .select('id, workspace_id')
        .order('created_at', { ascending: false })
        .limit(100)

      if (allError) {
        console.log(`  ⚠️  ${table}: 查詢失敗 - ${allError.message}`)
        continue
      }

      if (!allData || allData.length === 0) {
        console.log(`  ○  ${table}: 無資料`)
        continue
      }

      // 統計
      const total = allData.length
      const withWorkspace = allData.filter(item => item.workspace_id).length
      const nullWorkspace = allData.filter(item => !item.workspace_id).length

      // 顯示結果
      if (nullWorkspace > 0) {
        console.log(`  ⚠️  ${table}: 總共 ${total} 筆`)
        console.log(`      - 有 workspace_id: ${withWorkspace} 筆`)
        console.log(`      - NULL workspace_id: ${nullWorkspace} 筆 ⚠️`)

        // 顯示 NULL 的資料 ID
        const nullIds = allData
          .filter(item => !item.workspace_id)
          .map(item => item.id.substring(0, 8))
          .slice(0, 5)

        console.log(`      - NULL 資料範例: ${nullIds.join(', ')}${nullWorkspace > 5 ? '...' : ''}`)
      } else {
        console.log(`  ✅ ${table}: ${total} 筆資料都有 workspace_id`)
      }
    } catch (error) {
      console.log(`  ❌ ${table}: 檢查失敗 - ${error.message}`)
    }
  }

  console.log('\n')

  // 3. 總結
  console.log('📊 總結：')
  console.log('─'.repeat(50))
  console.log('')
  console.log('如果有 NULL workspace_id 的資料：')
  console.log('  ⚠️  這些資料在一般員工登入時會看不到')
  console.log('  ✅ Super Admin 可以看到（因為可以選擇「查看全部」）')
  console.log('')
  console.log('建議：')
  console.log('  1. 執行 migration 填充 NULL 的 workspace_id')
  console.log('  2. 或者修改前端 filter 邏輯，允許顯示 NULL 的資料')
  console.log('')
}

verifyDataVisibility().catch(console.error)
