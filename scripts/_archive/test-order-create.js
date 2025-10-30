import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testOrderCreate() {
  console.log('\n=== Order 建立測試 ===\n')

  const timestamp = Date.now()
  const testOrder = {
    id: 'order-test-' + timestamp,
    code: 'O' + timestamp.toString().slice(-6),
    order_number: 'ORD' + timestamp.toString().slice(-6),
    tour_id: 'test-tour-id',
    tour_name: '測試旅遊團',
    contact_person: '測試聯絡人',
    sales_person: 'william01',
    assistant: 'william01',
    member_count: 2,
    payment_status: '未收款',
    status: 'pending',
    total_amount: 90000,
    paid_amount: 0,
    remaining_amount: 90000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('測試資料：')
  console.log(JSON.stringify(testOrder, null, 2))
  console.log('\n嘗試插入...\n')

  const { data, error } = await supabase.from('orders').insert([testOrder]).select()

  if (error) {
    console.log('錯誤:', error.message)

    if (error.message.includes('null value')) {
      const match = error.message.match(/null value in column "(.+?)"/)
      if (match) {
        console.log('缺少必填欄位:', match[1])
      }
    } else if (error.message.includes('not found')) {
      const match = error.message.match(/Could not find the '(.+?)' column/)
      if (match) {
        console.log('欄位不存在:', match[1])
      }
    }
  } else {
    console.log('建立成功！')
    console.log('訂單 ID:', data[0].id)
    console.log('訂單編號:', data[0].code)

    await supabase.from('orders').delete().eq('id', testOrder.id)
    console.log('已清理測試資料')
  }
}

testOrderCreate()
