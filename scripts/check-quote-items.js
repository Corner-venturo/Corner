// 檢查 quote_items 資料
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function check() {
  console.log('\n📋 檢查最新的快速報價單...\n')

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, code, customer_name, quote_type')
    .eq('quote_type', 'quick')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (quoteError) {
    console.error('❌ 查詢失敗:', quoteError)
    return
  }

  console.log('報價單: ' + quote.code + ' - ' + quote.customer_name)
  console.log('ID: ' + quote.id + '\n')

  console.log('📦 檢查相關的 quote_items...\n')

  const { data: items, error: itemsError } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quote.id)

  if (itemsError) {
    console.error('❌ 查詢失敗:', itemsError)
    return
  }

  if (items.length === 0) {
    console.log('⚠️ 沒有找到任何 quote_items')
  } else {
    console.log('✅ 找到 ' + items.length + ' 個項目：\n')
    items.forEach(function (item, idx) {
      console.log('  ' + (idx + 1) + '. ' + item.description)
      console.log(
        '     數量: ' + item.quantity + ', 單價: ' + item.unit_price + ', 總價: ' + item.total_price
      )
      console.log('     備註: ' + (item.notes || '(無)') + '\n')
    })
  }
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
