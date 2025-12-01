const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function checkHongKongTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .or('title.ilike.%香港%,title.ilike.%Sally%')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('錯誤:', error)
    return
  }

  console.log('\n找到 ' + data.length + ' 筆包含「香港」或「Sally」的待辦事項：\n')

  data.forEach((todo, index) => {
    const num = index + 1
    console.log(num + '. ' + todo.title)
    console.log('   ID: ' + todo.id)
    console.log('   狀態: ' + todo.status)
    console.log('   完成: ' + (todo.completed ? '是' : '否'))
    console.log('   建立者: ' + todo.creator)
    console.log('   指派: ' + (todo.assignee || '(無)'))
    console.log('   可見: ' + (todo.visibility ? JSON.stringify(todo.visibility) : '(無)'))
    console.log('   優先級: ' + (todo.priority || '無'))
    console.log('   建立時間: ' + todo.created_at)
    console.log('')
  })

  // 檢查是否有已完成的
  const completed = data.filter(t => t.completed || t.status === 'completed')
  if (completed.length > 0) {
    console.log('⚠️ 有 ' + completed.length + ' 筆已標記為完成')
    completed.forEach(t => console.log('   - ' + t.title + ' (狀態: ' + t.status + ')'))
  }
}

checkHongKongTodos()
