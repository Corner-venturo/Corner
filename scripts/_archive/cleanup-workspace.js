// 執行清理 SQL
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('🧹 開始清理工作空間資料...\n')

  try {
    // 1. 清空訊息
    console.log('📝 清空訊息...')
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (msgError) throw msgError
    console.log('✅ 訊息已清空\n')

    // 2. 清空頻道
    console.log('📢 清空頻道...')
    const { error: chError } = await supabase
      .from('channels')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (chError) throw chError
    console.log('✅ 頻道已清空\n')

    // 3. 清空代墊清單項目
    console.log('💰 清空代墊清單項目...')
    const { error: itemError } = await supabase
      .from('advance_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (itemError) throw itemError
    console.log('✅ 代墊清單項目已清空\n')

    // 4. 清空代墊清單
    console.log('💼 清空代墊清單...')
    const { error: advError } = await supabase
      .from('advance_lists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (advError) throw advError
    console.log('✅ 代墊清單已清空\n')

    // 5. 清空共享訂單
    console.log('🛒 清空共享訂單...')
    const { error: ordError } = await supabase
      .from('shared_order_lists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (ordError) throw ordError
    console.log('✅ 共享訂單已清空\n')

    // 6. 清空公告
    console.log('📣 清空公告...')
    const { error: bulError } = await supabase
      .from('bulletins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (bulError) throw bulError
    console.log('✅ 公告已清空\n')

    // 7. 清空頻道群組
    console.log('📁 清空頻道群組...')
    const { error: grpError } = await supabase
      .from('channel_groups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (grpError) throw grpError
    console.log('✅ 頻道群組已清空\n')

    console.log('✅ 所有工作空間資料已清空！')
  } catch (error) {
    console.error('❌ 清理失敗:', error.message)
    process.exit(1)
  }
}

cleanup()
