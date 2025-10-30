// 檢查資料狀態
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 檢查資料狀態...\n')

  try {
    // 1. 檢查 tours
    const { data: tours, error: toursError } = await supabase
      .from('tours')
      .select('id, code, name, departure_date')
      .order('created_at', { ascending: false })
      .limit(5)

    if (toursError) throw toursError

    console.log('📊 Tours 資料:')
    if (tours && tours.length > 0) {
      tours.forEach(t => {
        console.log(`   ✅ ${t.code} - ${t.name} (${t.departure_date})`)
      })
    } else {
      console.log('   ⚠️  沒有 tours 資料')
    }
    console.log('')

    // 2. 檢查 channels
    const { data: channels, error: chError } = await supabase
      .from('channels')
      .select('id, name, type, tour_id')
      .order('created_at', { ascending: true })

    if (chError) throw chError

    console.log('📢 Channels 資料:')
    if (channels && channels.length > 0) {
      channels.forEach(ch => {
        const tourInfo = ch.tour_id ? ` (tour: ${ch.tour_id})` : ''
        console.log(`   ✅ ${ch.name} [${ch.type}]${tourInfo}`)
      })
    } else {
      console.log('   ⚠️  沒有 channels 資料')
    }
    console.log('')

    // 3. 檢查 messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, channel_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (msgError) throw msgError

    console.log('💬 Messages 資料:')
    if (messages && messages.length > 0) {
      messages.forEach(m => {
        const preview = m.content.substring(0, 30)
        console.log(`   ✅ [${m.channel_id.substring(0, 8)}...] ${preview}`)
      })
    } else {
      console.log('   ⚠️  沒有 messages 資料')
    }
    console.log('')

    console.log('📊 統計：')
    console.log(`   - Tours: ${tours?.length || 0}`)
    console.log(`   - Channels: ${channels?.length || 0}`)
    console.log(`   - Messages: ${messages?.length || 0}`)
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
    process.exit(1)
  }
}

checkData()
