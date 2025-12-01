const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function checkCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('錯誤:', error)
    return
  }

  console.log('\n找到 ' + data.length + ' 筆客戶資料：\n')

  data.forEach((customer, index) => {
    const num = index + 1
    console.log(num + '. ' + customer.name + ' (ID: ' + customer.id + ')')
    console.log('   編號: ' + customer.code)
    console.log('   電話: ' + (customer.phone || '(無)'))
    console.log('   Email: ' + (customer.email || '(無)'))
    console.log('   建立時間: ' + customer.created_at)
    console.log('')
  })
}

checkCustomers()
