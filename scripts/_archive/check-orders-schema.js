import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkOrdersSchema() {
  console.log('\n=== Orders 表 Schema 檢查 ===\n')

  // 方法 1: 嘗試插入一個測試資料看錯誤訊息
  const testOrder = {
    id: 'test-' + Date.now(),
    order_number: 'TEST001',
    tour_id: 'test-tour',
    customer_name: 'Test Customer',
    total_amount: 1000,
  }

  console.log('🔍 測試插入資料以檢查必填欄位...\n')
  const { data, error } = await supabase.from('orders').insert([testOrder]).select()

  if (error) {
    console.log('❌ 插入錯誤 (這是預期的):', error.message)
    console.log('📝 錯誤詳情:', error.details)
    console.log('💡 提示:', error.hint || '無')

    // 分析錯誤訊息找出缺少的欄位
    if (error.message.includes('null value in column')) {
      const match = error.message.match(/null value in column "(.+?)"/)
      if (match) {
        console.log(`\n⚠️  必填欄位: ${match[1]}`)
      }
    }
  } else {
    console.log('✅ 插入成功！')
    console.log('資料:', data)

    // 清理測試資料
    await supabase.from('orders').delete().eq('id', testOrder.id)
    console.log('🗑️  已清理測試資料')
  }

  // 方法 2: 如果表有資料，讀取一筆看欄位
  console.log('\n🔍 檢查現有資料...\n')
  const { data: existing, error: readError } = await supabase.from('orders').select('*').limit(1)

  if (readError) {
    console.log('❌ 讀取錯誤:', readError.message)
  } else if (existing && existing.length > 0) {
    console.log('✅ 找到現有資料，欄位列表：')
    console.log(Object.keys(existing[0]).sort().join('\n'))
  } else {
    console.log('ℹ️  表為空，無法直接取得欄位')
  }
}

checkOrdersSchema()
