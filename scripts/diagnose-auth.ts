/**
 * 診斷 Auth 同步問題
 * 使用 service_role 來繞過 RLS
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
// Using service_role key
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!serviceKey) {
  console.log('請設置 SUPABASE_SERVICE_ROLE_KEY 環境變數')
  console.log('可以從 Supabase Dashboard > Project Settings > API 取得')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function diagnose() {
  console.log('=== Auth 同步診斷 ===\n')

  // 1. 檢查所有員工的 supabase_user_id
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, chinese_name, workspace_id, supabase_user_id, status')
    .neq('employee_number', 'BOT001')
    .order('employee_number')

  if (empError) {
    console.log('Error fetching employees:', empError)
    return
  }

  console.log('=== 員工 supabase_user_id 狀態 ===')
  console.log('員工總數:', employees?.length || 0)

  const withId = employees?.filter(e => e.supabase_user_id) || []
  const withoutId = employees?.filter(e => !e.supabase_user_id) || []

  console.log('已同步:', withId.length)
  console.log('未同步:', withoutId.length)

  if (withoutId.length > 0) {
    console.log('\n未同步的員工:')
    withoutId.forEach(e => {
      console.log('  - ' + e.employee_number + ': ' + (e.display_name || e.chinese_name))
    })
  }

  // 2. 檢查 auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('\nError fetching auth users:', authError)
    return
  }

  console.log('\n=== Auth Users ===')
  console.log('Auth 用戶總數:', authUsers?.users?.length || 0)

  const usersWithMeta = authUsers?.users?.filter(u => u.user_metadata?.employee_id) || []
  console.log('有 employee_id metadata:', usersWithMeta.length)

  // 3. 比對
  console.log('\n=== 比對結果 ===')
  for (const emp of employees || []) {
    const authUser = authUsers?.users?.find(u => u.id === emp.supabase_user_id)
    const altAuthUser = authUsers?.users?.find(u => u.user_metadata?.employee_id === emp.id)

    if (!emp.supabase_user_id && !altAuthUser) {
      console.log('❌ ' + emp.employee_number + ': 無 supabase_user_id 且無法從 metadata 匹配')
    } else if (!emp.supabase_user_id && altAuthUser) {
      console.log('⚠️ ' + emp.employee_number + ': 可以從 metadata 匹配，需要同步')
    } else if (authUser) {
      console.log('✅ ' + emp.employee_number + ': 已正確同步')
    }
  }

  // 4. 檢查 tours
  const { data: tours, error: tourError } = await supabase
    .from('tours')
    .select('id, code, name, workspace_id')
    .limit(5)

  console.log('\n=== Tours (前 5 筆) ===')
  if (tourError) {
    console.log('Error:', tourError)
  } else {
    console.log('總數:', tours?.length || 0)
    tours?.forEach(t => {
      console.log('  ' + t.code + ': ' + t.name)
    })
  }

  // 5. 檢查 workspace
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, code, name')

  console.log('\n=== Workspaces ===')
  if (wsError) {
    console.log('Error:', wsError)
  } else {
    workspaces?.forEach(ws => {
      console.log('  ' + ws.code + ' (' + ws.id.substring(0, 8) + '...): ' + ws.name)
    })
  }
}

diagnose()
