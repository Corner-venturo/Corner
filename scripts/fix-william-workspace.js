/**
 * 修復 William 帳號的 workspace_id
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixWilliamWorkspace() {
  console.log('🔧 修復 William 帳號的 workspace_id...\n')

  // 1. 找到 William
  const { data: william, error: queryError } = await supabase
    .from('employees')
    .select('*')
    .or('display_name.ilike.%william%,email.ilike.%william%')
    .single()

  if (queryError || !william) {
    console.error('❌ 找不到 William 帳號:', queryError?.message)
    return
  }

  console.log('✅ 找到 William:')
  console.log(`   ID: ${william.id}`)
  console.log(`   Name: ${william.display_name}`)
  console.log(`   Email: ${william.email}`)
  console.log(`   Workspace ID: ${william.workspace_id || '❌ 缺失！'}`)

  if (william.workspace_id) {
    console.log('\n✅ workspace_id 已存在，無需修復')
    return
  }

  // 2. 查詢所有 workspace
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error('❌ 找不到任何 workspace:', wsError?.message)
    return
  }

  console.log(`\n📋 找到 ${workspaces.length} 個 workspace:`)
  workspaces.forEach((ws, index) => {
    console.log(`   ${index + 1}. ${ws.name} (${ws.code}) - ID: ${ws.id}`)
  })

  // 3. 使用第一個 workspace
  const targetWorkspace = workspaces[0]
  console.log(`\n🎯 將 William 加入 workspace: ${targetWorkspace.name}`)

  // 4. 更新 William 的 workspace_id
  const { error: updateError } = await supabase
    .from('employees')
    .update({ workspace_id: targetWorkspace.id })
    .eq('id', william.id)

  if (updateError) {
    console.error('❌ 更新失敗:', updateError.message)
    return
  }

  console.log('✅ 更新成功！')
  console.log(`   William 的 workspace_id 已設為: ${targetWorkspace.id}`)

  // 5. 驗證
  const { data: updated } = await supabase
    .from('employees')
    .select('id, display_name, workspace_id')
    .eq('id', william.id)
    .single()

  console.log('\n✅ 驗證結果:')
  console.log(`   ${updated.display_name} - workspace_id: ${updated.workspace_id}`)

  console.log('\n🎉 修復完成！請在生產環境：')
  console.log('   1. 登出')
  console.log('   2. 重新登入')
  console.log('   3. 代辦事項應該就會正常顯示了')
}

fixWilliamWorkspace().catch(console.error)
