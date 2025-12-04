// 檢查 payment_requests 資料
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('錯誤:', error)
    return
  }

  console.log('請款單資料 (前 20 筆):')
  console.log('---')

  if (!data || data.length === 0) {
    console.log('沒有找到任何請款單資料')
    return
  }

  // 統計狀態
  const statusCount = {}
  data.forEach(r => {
    statusCount[r.status] = (statusCount[r.status] || 0) + 1
  })

  data.forEach(r => {
    console.log(JSON.stringify(r, null, 2))
  })

  console.log('---')
  console.log('狀態統計:', statusCount)
}

main()
