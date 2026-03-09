// 檢查 quote_items 表格結構
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function checkSchema() {
  console.log('\n🔍 檢查 quote_items 表格結構...\n')

  // 嘗試查詢一筆資料來看結構
  const { data, error } = await supabase.from('quote_items').select('*').limit(1)

  if (error) {
    console.error('❌ 查詢失敗:', error)
    console.log('\n嘗試插入測試資料來看錯誤訊息...\n')

    const { error: insertError } = await supabase.from('quote_items').insert({
      name: 'test',
      quantity: 1,
      unit_price: 100,
      total: 100,
    })

    if (insertError) {
      console.error('❌ 插入失敗:', insertError)
    }
    return
  }

  if (data && data.length > 0) {
    console.log('✅ 找到現有資料，欄位結構：')
    console.log(Object.keys(data[0]))
  } else {
    console.log('⚠️ 表格是空的，無法確定欄位結構')
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
