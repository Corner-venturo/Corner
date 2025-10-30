import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkOrders() {
  console.log('\n=== Orders 表檢查 ===\n')

  // 先建立一個最小的測試資料
  const minimalOrder = {
    id: 'test-' + Date.now(),
  }

  console.log('🔍 嘗試插入最小資料...\n')
  let { data, error } = await supabase.from('orders').insert([minimalOrder]).select()

  if (error) {
    console.log('❌ 錯誤:', error.message)

    // 根據錯誤訊息找出第一個必填欄位
    if (error.message.includes('null value')) {
      const match = error.message.match(/null value in column "(.+?)"/)
      if (match) {
        console.log(`\n⚠️  發現必填欄位: "${match[1]}"\n`)

        // 繼續測試，逐步加入欄位
        console.log('🔄 繼續測試其他必填欄位...\n')
      }
    }
  } else {
    console.log('✅ 成功！表可能沒有必填欄位（除了 id）')
    // 清理
    await supabase.from('orders').delete().eq('id', minimalOrder.id)
  }
}

checkOrders()
