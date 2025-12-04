const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function summary() {
  const requestIds = [
    'b8771f18-fe96-4a39-8d26-80255983f834',
    '8765c5bb-4bb0-4070-8ef2-3b578c05405b'
  ]

  // 請款單
  const { data: requests } = await supabase
    .from('payment_requests')
    .select('*')
    .in('id', requestIds)

  // 請款項目
  const { data: items } = await supabase
    .from('payment_request_items')
    .select('*')
    .in('request_id', requestIds)
    .order('supplier_name')

  console.log('=== 出納單 DO51203-001 測試資料 ===\n')
  console.log('請款單: 2 筆')
  requests.forEach(r => console.log(`  - ${r.code} (${r.tour_name})`))

  console.log('\n請款項目: ' + items.length + ' 筆')
  console.log('\n按供應商分組預覽:')

  // 按供應商分組
  const grouped = {}
  items.forEach(item => {
    const supplier = item.supplier_name
    if (!grouped[supplier]) grouped[supplier] = []
    grouped[supplier].push(item)
  })

  Object.keys(grouped).sort().forEach(supplier => {
    const supplierItems = grouped[supplier]
    const total = supplierItems.reduce((sum, i) => sum + i.subtotal, 0)
    console.log(`\n【${supplier}】小計: ${total.toLocaleString()}`)
    supplierItems.forEach(item => {
      const req = requests.find(r => r.id === item.request_id)
      console.log(`  - ${req?.code || '-'} | ${item.description} | ${item.subtotal.toLocaleString()}`)
    })
  })

  const grandTotal = items.reduce((sum, i) => sum + i.subtotal, 0)
  console.log(`\n=== TOTAL: ${grandTotal.toLocaleString()} ===`)
}

summary()
