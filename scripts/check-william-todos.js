/**
 * 檢查 william 帳號的代辦事項
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODcwOTMxOCwiZXhwIjoyMDQ0Mjg1MzE4fQ.T-hP6f6fXmYLn8Z1YEKqL2O7_9LkbXJ6Z3XqGqvCQxI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkWilliamTodos() {
  console.log('🔍 檢查 william 帳號的代辦事項...\n')

  // 1. 先找到 william 的 user_id
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, display_name, email, employee_number')
    .or('display_name.ilike.%william%,email.ilike.%william%,employee_number.ilike.%william%')

  if (empError) {
    console.error('❌ 查詢員工失敗:', empError.message)
    return
  }

  if (!employees || employees.length === 0) {
    console.log('❌ 找不到 william 帳號')
    return
  }

  console.log('📋 找到以下可能的帳號:')
  employees.forEach((emp, index) => {
    console.log(`  ${index + 1}. ${emp.display_name} (${emp.email}) - ID: ${emp.id}`)
  })

  // 使用第一個帳號
  const williamId = employees[0].id
  console.log(`\n✅ 使用帳號: ${employees[0].display_name} (${williamId})\n`)

  // 2. 查詢所有代辦事項
  const { data: allTodos, error: todosError } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (todosError) {
    console.error('❌ 查詢代辦事項失敗:', todosError.message)
    return
  }

  console.log(`📊 資料庫中共有 ${allTodos?.length || 0} 個代辦事項\n`)

  // 3. 分析可見性
  const visibleTodos = allTodos?.filter(todo => {
    const isCreator = todo.creator === williamId
    const isAssignee = todo.assignee === williamId
    const inVisibility = todo.visibility?.includes(williamId)
    return isCreator || isAssignee || inVisibility
  })

  const invisibleTodos = allTodos?.filter(todo => {
    const isCreator = todo.creator === williamId
    const isAssignee = todo.assignee === williamId
    const inVisibility = todo.visibility?.includes(williamId)
    return !isCreator && !isAssignee && !inVisibility
  })

  console.log('✅ William 可見的代辦事項:')
  console.log(`   總數: ${visibleTodos?.length || 0}`)
  if (visibleTodos && visibleTodos.length > 0) {
    visibleTodos.slice(0, 5).forEach(todo => {
      console.log(`   - ${todo.title} (狀態: ${todo.status})`)
      console.log(`     Creator: ${todo.creator === williamId ? '✓ William' : todo.creator}`)
      console.log(
        `     Assignee: ${todo.assignee === williamId ? '✓ William' : todo.assignee || '無'}`
      )
      console.log(
        `     Visibility: ${todo.visibility?.includes(williamId) ? '✓ 包含 William' : '不包含'}`
      )
    })
    if (visibleTodos.length > 5) {
      console.log(`   ... 還有 ${visibleTodos.length - 5} 個`)
    }
  }

  console.log('\n❌ William 看不到的代辦事項:')
  console.log(`   總數: ${invisibleTodos?.length || 0}`)
  if (invisibleTodos && invisibleTodos.length > 0) {
    invisibleTodos.slice(0, 5).forEach(todo => {
      console.log(`   - ${todo.title} (狀態: ${todo.status})`)
      console.log(`     Creator: ${todo.creator}`)
      console.log(`     Assignee: ${todo.assignee || '無'}`)
      console.log(`     Visibility: ${JSON.stringify(todo.visibility)}`)
    })
    if (invisibleTodos.length > 5) {
      console.log(`   ... 還有 ${invisibleTodos.length - 5} 個`)
    }
  }

  // 4. 提供修正建議
  if (invisibleTodos && invisibleTodos.length > 0) {
    console.log('\n💡 修正建議:')
    console.log('   如果這些代辦事項應該讓 William 看到，執行以下指令修正:')
    console.log(`   node scripts/fix-william-todos.js`)
  }
}

checkWilliamTodos().catch(console.error)
