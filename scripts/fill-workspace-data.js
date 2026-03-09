/**
 * 填充 employees 表的 workspace_id
 * 使用 Supabase client 直接更新
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE' // service_role key

const supabase = createClient(supabaseUrl, supabaseKey)

async function fillWorkspaceId() {
  try {
    console.log('🔍 查詢第一個 workspace...')

    // 1. 取得第一個 workspace
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select('id, code, name')
      .order('created_at')
      .limit(1)

    if (wsError) {
      console.error('❌ 查詢 workspaces 失敗:', wsError)
      return
    }

    if (!workspaces || workspaces.length === 0) {
      console.error('❌ 找不到任何 workspace')
      return
    }

    const defaultWorkspace = workspaces[0]
    console.log('✅ 找到 workspace:', defaultWorkspace)

    // 2. 查詢有多少員工的 workspace_id 是 NULL
    const { data: nullEmployees, error: nullError } = await supabase
      .from('employees')
      .select('id, display_name, workspace_id')
      .is('workspace_id', null)

    if (nullError) {
      console.error('❌ 查詢 NULL workspace_id 員工失敗:', nullError)
      return
    }

    console.log(`📊 找到 ${nullEmployees?.length || 0} 位員工的 workspace_id 是 NULL`)

    if (!nullEmployees || nullEmployees.length === 0) {
      console.log('✅ 所有員工的 workspace_id 都已填充！')
      return
    }

    // 3. 更新所有 NULL 的員工
    const { error: updateError } = await supabase
      .from('employees')
      .update({ workspace_id: defaultWorkspace.id })
      .is('workspace_id', null)

    if (updateError) {
      console.error('❌ 更新失敗:', updateError)
      return
    }

    console.log(
      `✅ 成功將 ${nullEmployees.length} 位員工設定為 workspace: ${defaultWorkspace.name} (${defaultWorkspace.id})`
    )

    // 4. 驗證結果
    const { data: verifyNull, error: verifyError } = await supabase
      .from('employees')
      .select('id')
      .is('workspace_id', null)

    if (verifyError) {
      console.error('⚠️ 驗證查詢失敗:', verifyError)
    } else {
      console.log(`🔍 驗證：剩餘 ${verifyNull?.length || 0} 位員工的 workspace_id 是 NULL`)
    }
  } catch (error) {
    console.error('❌ 執行失敗:', error)
  }
}

fillWorkspaceId()
