const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function check() {
  console.log('\n📋 檢查最新的快速報價單完整資料...\n')

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_type', 'quick')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (quoteError) {
    console.error('❌ 查詢失敗:', quoteError)
    return
  }

  console.log('報價單基本資訊:')
  console.log('  code:', quote.code)
  console.log('  quote_type:', quote.quote_type)
  console.log('  customer_name:', quote.customer_name)
  console.log('  total_amount:', quote.total_amount)
  console.log('  received_amount:', quote.received_amount)
  console.log('  balance_amount:', quote.balance_amount)
  console.log('  workspace_id:', quote.workspace_id)
  console.log('  created_at:', quote.created_at)
  console.log('\n快速報價單項目 (quick_quote_items):')
  console.log('  類型:', typeof quote.quick_quote_items)
  console.log('  內容:', JSON.stringify(quote.quick_quote_items, null, 2))

  console.log('\n📦 檢查相關的 quote_items 表格資料...\n')

  const { data: items, error: itemsError } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quote.id)

  if (itemsError) {
    console.error('❌ 查詢失敗:', itemsError)
    return
  }

  console.log('quote_items 數量:', items.length)
  if (items.length > 0) {
    console.log('項目詳情:')
    items.forEach((item, index) => {
      console.log('  ' + (index + 1) + '. ' + (item.description || item.name))
      console.log('     category: ' + item.category)
      console.log('     quantity: ' + item.quantity)
      console.log('     unit_price: ' + item.unit_price)
      console.log('     total_price: ' + item.total_price)
    })
  }
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
