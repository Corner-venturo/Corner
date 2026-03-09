/**
 * 檢查所有報價單資料
 * 包含 IndexedDB 和 Supabase 的資料
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ 請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllQuotes() {
  try {
    console.log('📊 檢查所有報價單資料...\n')
    console.log('='.repeat(80))

    // 1. 查詢所有報價單
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (quotesError) throw quotesError

    console.log(`\n📋 Supabase - quotes 表格：共 ${quotes.length} 筆\n`)

    quotes.forEach((quote, index) => {
      console.log(`${index + 1}. ${quote.code} - ${quote.customer_name}`)
      console.log(`   類型: ${quote.quote_type}`)
      console.log(`   狀態: ${quote.status}`)
      console.log(`   總金額: ${quote.total_amount || 0}`)

      if (quote.quote_type === 'quick') {
        const itemCount = quote.quick_quote_items ? quote.quick_quote_items.length : 0
        console.log(`   ✅ quick_quote_items: ${itemCount} 個項目`)

        if (itemCount > 0) {
          quote.quick_quote_items.forEach((item, i) => {
            console.log(
              `      ${i + 1}. ${item.description} - 數量:${item.quantity} 單價:${item.unit_price} 金額:${item.amount}`
            )
          })
        }
      }
      console.log('')
    })

    console.log('='.repeat(80))

    // 2. 查詢所有 quote_items（應該只有標準報價單的）
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('*, quotes!inner(code, quote_type, customer_name)')
      .order('created_at', { ascending: false })

    if (itemsError) throw itemsError

    console.log(`\n📦 Supabase - quote_items 表格：共 ${quoteItems.length} 筆\n`)

    if (quoteItems.length === 0) {
      console.log('   ✅ 無資料（正確：快速報價單不應該有 quote_items）\n')
    } else {
      // 按報價單分組
      const itemsByQuote = {}
      quoteItems.forEach(item => {
        const quoteCode = item.quotes.code
        if (!itemsByQuote[quoteCode]) {
          itemsByQuote[quoteCode] = {
            quote: item.quotes,
            items: [],
          }
        }
        itemsByQuote[quoteCode].items.push(item)
      })

      Object.entries(itemsByQuote).forEach(([code, data]) => {
        console.log(`${code} (${data.quote.quote_type}) - ${data.quote.customer_name}`)
        data.items.forEach((item, i) => {
          console.log(
            `   ${i + 1}. ${item.description || item.name} - 數量:${item.quantity} 單價:${item.unit_price} 總價:${item.total_price}`
          )
        })
        console.log('')
      })
    }

    console.log('='.repeat(80))

    // 3. 驗證資料一致性
    console.log('\n🔍 資料一致性檢查：\n')

    let hasIssues = false

    // 檢查快速報價單是否有 quote_items
    const quickQuotesWithItems = quoteItems.filter(item => item.quotes.quote_type === 'quick')
    if (quickQuotesWithItems.length > 0) {
      console.log(
        `   ❌ 發現 ${quickQuotesWithItems.length} 筆快速報價單仍有 quote_items（應該刪除）`
      )
      hasIssues = true
    } else {
      console.log('   ✅ 快速報價單沒有 quote_items（正確）')
    }

    // 檢查快速報價單是否有 quick_quote_items
    const quickQuotes = quotes.filter(q => q.quote_type === 'quick')
    quickQuotes.forEach(q => {
      if (!q.quick_quote_items || q.quick_quote_items.length === 0) {
        console.log(`   ⚠️  ${q.code} 沒有 quick_quote_items（可能是空報價單）`)
      } else {
        console.log(`   ✅ ${q.code} 有 ${q.quick_quote_items.length} 個 quick_quote_items`)
      }
    })

    // 檢查標準報價單
    const standardQuotes = quotes.filter(q => q.quote_type === 'standard')
    standardQuotes.forEach(q => {
      const items = quoteItems.filter(item => item.quotes.code === q.code)
      if (items.length === 0) {
        console.log(`   ℹ️  ${q.code} 沒有 quote_items（可能是空報價單）`)
      } else {
        console.log(`   ✅ ${q.code} 有 ${items.length} 個 quote_items`)
      }
    })

    console.log('\n' + '='.repeat(80))

    if (hasIssues) {
      console.log('\n⚠️  發現資料不一致的問題，請檢查！')
    } else {
      console.log('\n✅ 所有資料一致性檢查通過！')
    }
  } catch (error) {
    console.error('\n❌ 檢查失敗:', error.message)
    process.exit(1)
  }
}

checkAllQuotes()
