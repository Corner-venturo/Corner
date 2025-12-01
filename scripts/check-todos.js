const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function checkTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('id, title, creator, assignee, visibility, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('錯誤:', error)
    return
  }

  console.log('\n最近 20 筆待辦事項：\n')
  data.forEach((todo, index) => {
    const num = index + 1
    console.log(num + '. ' + todo.title)
    console.log('   ID: ' + todo.id)
    console.log('   建立者: ' + todo.creator)
    console.log('   指派: ' + (todo.assignee || '(無)'))
    console.log('   可見: ' + (todo.visibility ? JSON.stringify(todo.visibility) : '(無)'))
    console.log('   建立時間: ' + todo.created_at)
    console.log('')
  })

  // 檢查是否有「香港」相關的待辦
  const hongkong = data.filter(t => t.title.includes('香港'))
  if (hongkong.length > 0) {
    console.log('\n找到 ' + hongkong.length + ' 筆包含「香港」的待辦事項')
  } else {
    console.log('\n⚠️ 沒有找到包含「香港」的待辦事項')
  }
}

checkTodos()
