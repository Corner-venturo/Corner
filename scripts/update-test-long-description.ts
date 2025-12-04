import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function updateTestData() {
  // 更新幾筆測試資料，加入超長的描述
  const longDescriptions = [
    '日本東京五日遊 - 成田機場接送服務 + 市區觀光巴士全程導覽',
    '北海道滑雪度假村住宿費用（含早晚餐、溫泉設施使用、滑雪裝備租借）',
    '韓國首爾四日遊團體機票 - 華航早去晚回經濟艙 25人團體票',
    '沖繩潛水體驗行程費用含專業教練、全套裝備租借、水下攝影服務',
    '大阪環球影城門票 + 快速通關券 + 園區內午餐套餐券',
  ]

  // 取得現有的測試項目
  const { data: items } = await supabase
    .from('payment_request_items')
    .select('id, description')
    .ilike('description', '%測試項目%')
    .limit(5)

  if (!items?.length) {
    console.log('沒有找到測試項目')
    return
  }

  console.log(`找到 ${items.length} 筆測試項目`)

  // 更新描述
  for (let i = 0; i < Math.min(items.length, longDescriptions.length); i++) {
    const { error } = await supabase
      .from('payment_request_items')
      .update({ description: longDescriptions[i] })
      .eq('id', items[i].id)

    if (error) {
      console.error('更新失敗:', error)
    } else {
      console.log('已更新:', items[i].description)
    }
  }

  console.log('完成')
}

updateTestData()
