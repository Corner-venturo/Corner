/**
 * 檢查報價單資料狀態
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function checkQuotes() {
  console.log('\n=== 檢查報價單資料 ===\n')

  // 查詢所有報價單
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id, code, name, customer_name, quote_type, created_at, is_active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ 查詢失敗:', error.message)
    return
  }

  console.log(`📊 共找到 ${quotes.length} 筆報價單\n`)

  // 依類型分組
  const standardQuotes = quotes.filter(q => q.quote_type !== 'quick')
  const quickQuotes = quotes.filter(q => q.quote_type === 'quick')

  console.log('📋 團體報價單:')
  if (standardQuotes.length === 0) {
    console.log('  (無)')
  } else {
    standardQuotes.forEach(q => {
      console.log(`  - ${q.code || '(無編號)'} | ${q.name || '(無名稱)'} | ${q.created_at}`)
    })
  }

  console.log('\n⚡ 快速報價單:')
  if (quickQuotes.length === 0) {
    console.log('  (無)')
  } else {
    quickQuotes.forEach(q => {
      console.log(
        `  - ${q.code || '(無編號)'} | ${q.customer_name || '(無客戶)'} | ${q.created_at} | active: ${q.is_active}`
      )
    })
  }

  // 檢查編號格式
  console.log('\n🔍 編號格式分析:')
  const invalidCodes = quotes.filter(q => q.code && q.code.startsWith('-'))
  if (invalidCodes.length > 0) {
    console.log(`  ⚠️ 發現 ${invalidCodes.length} 筆無效編號（缺少 workspace code）:`)
    invalidCodes.forEach(q => {
      console.log(`    - ${q.code} (ID: ${q.id})`)
    })
  } else {
    console.log('  ✅ 所有編號格式正確')
  }

  // 檢查重複編號
  const codeCounts = {}
  quotes.forEach(q => {
    if (q.code) {
      codeCounts[q.code] = (codeCounts[q.code] || 0) + 1
    }
  })
  const duplicates = Object.entries(codeCounts).filter(([_, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log('\n  ⚠️ 發現重複編號:')
    duplicates.forEach(([code, count]) => {
      console.log(`    - ${code}: ${count} 筆`)
    })
  }
}

checkQuotes()
  .then(() => {
    console.log('\n✅ 檢查完成\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ 執行失敗:', err)
    process.exit(1)
  })
