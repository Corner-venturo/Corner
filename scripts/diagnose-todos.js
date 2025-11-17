/**
 * 診斷生產環境的代辦事項問題
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseTodos() {
  console.log('🔍 診斷生產環境代辦事項問題...\n')

  // 1. 查詢所有員工
  console.log('1️⃣ 查詢員工資料...')
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, display_name, email, employee_number, workspace_id')
    .order('created_at', { ascending: false })

  if (empError) {
    console.error('❌ 查詢員工失敗:', empError.message)
    return
  }

  console.log(`✅ 找到 ${employees?.length || 0} 個員工`)
  const williamEmployees = employees?.filter(e =>
    e.display_name?.toLowerCase().includes('william') ||
    e.email?.toLowerCase().includes('william')
  )

  if (williamEmployees && williamEmployees.length > 0) {
    console.log('\n📋 William 相關帳號:')
    williamEmployees.forEach(emp => {
      console.log(`  - ${emp.display_name} (${emp.email})`)
      console.log(`    ID: ${emp.id}`)
      console.log(`    Workspace: ${emp.workspace_id}`)
    })
  } else {
    console.log('❌ 找不到 William 的帳號！')
  }

  // 2. 查詢所有代辦事項
  console.log('\n2️⃣ 查詢代辦事項...')
  const { data: todos, error: todosError } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (todosError) {
    console.error('❌ 查詢代辦事項失敗:', todosError.message)
    console.error('   錯誤詳情:', todosError)
    return
  }

  console.log(`✅ 資料庫中共有 ${todos?.length || 0} 個代辦事項`)

  // 過濾掉軟刪除的
  const activeTodos = todos?.filter(t => !t._deleted)
  console.log(`✅ 其中 ${activeTodos?.length || 0} 個為活動狀態（未刪除）`)

  // 3. 分析每個 William 帳號的可見性
  if (williamEmployees && williamEmployees.length > 0) {
    console.log('\n3️⃣ 分析 William 帳號的代辦事項可見性:')

    williamEmployees.forEach(william => {
      const visibleTodos = activeTodos?.filter(todo => {
        const isCreator = todo.creator === william.id
        const isAssignee = todo.assignee === william.id
        const inVisibility = todo.visibility?.includes(william.id)
        return isCreator || isAssignee || inVisibility
      })

      console.log(`\n   帳號: ${william.display_name} (${william.id})`)
      console.log(`   可見代辦事項數量: ${visibleTodos?.length || 0}`)

      if (visibleTodos && visibleTodos.length > 0) {
        console.log('   前 5 個代辦事項:')
        visibleTodos.slice(0, 5).forEach(todo => {
          console.log(`     - ${todo.title} (${todo.status})`)
        })
      }
    })
  }

  // 4. 顯示所有代辦事項的 creator 分佈
  if (activeTodos && activeTodos.length > 0) {
    console.log('\n4️⃣ 代辦事項的建立者分佈:')
    const creatorMap = new Map()
    activeTodos.forEach(todo => {
      const count = creatorMap.get(todo.creator) || 0
      creatorMap.set(todo.creator, count + 1)
    })

    for (const [creatorId, count] of creatorMap.entries()) {
      const creator = employees?.find(e => e.id === creatorId)
      const name = creator?.display_name || '未知使用者'
      console.log(`   ${name}: ${count} 個`)
    }
  }

  // 5. 檢查是否有 visibility 為空的代辦事項
  const noVisibilityTodos = activeTodos?.filter(t => !t.visibility || t.visibility.length === 0)
  if (noVisibilityTodos && noVisibilityTodos.length > 0) {
    console.log(`\n⚠️  發現 ${noVisibilityTodos.length} 個代辦事項的 visibility 為空！`)
    console.log('   這些代辦事項任何人都看不到（除了建立者/被指派者）')
  }

  console.log('\n✅ 診斷完成')
}

diagnoseTodos().catch(console.error)
