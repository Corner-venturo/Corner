import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function addTestData() {
  // 先查詢現有的 payment_request_items 看看有什麼欄位
  const { data: existingItems } = await supabase
    .from('payment_request_items')
    .select('*')
    .limit(1)

  console.log('現有項目欄位:', existingItems?.[0] ? Object.keys(existingItems[0]) : '無資料')

  // 先取得現有的出納單
  const { data: orders } = await supabase
    .from('disbursement_orders')
    .select('id, order_number, payment_request_ids')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!orders?.length) {
    console.log('沒有找到出納單')
    return
  }

  const order = orders[0]
  console.log('找到出納單:', order.order_number)

  // 取得請款單 IDs
  const requestIds = order.payment_request_ids || []
  if (requestIds.length === 0) {
    console.log('出納單沒有關聯的請款單')
    return
  }

  console.log('關聯的請款單:', requestIds)

  // 為每個請款單新增多筆測試項目（模擬不同供應商）
  const suppliers = [
    '台灣巴士租車公司',
    '日本航空',
    '東京希爾頓飯店',
    '大阪環球餐廳',
    '京都觀光巴士',
    '北海道雪場',
    '沖繩潛水中心',
    '台北國際機票代理',
    '花蓮遊覽車行',
    '墾丁渡假村',
  ]

  const categories = ['交通費', '住宿費', '餐費', '門票', '導遊費', '保險費', '雜支']

  const testItems: Array<{
    request_id: string
    category: string
    description: string
    supplier_name: string
    quantity: number
    unitprice: number
    subtotal: number
  }> = []

  // 為第一個請款單新增 15 筆項目（測試跨頁）
  for (let i = 0; i < 15; i++) {
    const qty = Math.floor(Math.random() * 10) + 1
    const unitPrice = Math.floor(Math.random() * 5000) + 1000
    testItems.push({
      request_id: requestIds[0],
      category: categories[i % categories.length],
      description: `測試項目 ${i + 1} - ${categories[i % categories.length]}`,
      supplier_name: suppliers[i % suppliers.length],
      quantity: qty,
      unitprice: unitPrice,
      subtotal: qty * unitPrice,
    })
  }

  // 如果有多個請款單，也加一些
  if (requestIds.length > 1) {
    for (let i = 0; i < 5; i++) {
      const qty = Math.floor(Math.random() * 5) + 1
      const unitPrice = Math.floor(Math.random() * 3000) + 500
      testItems.push({
        request_id: requestIds[1],
        category: categories[i % categories.length],
        description: `第二張請款單項目 ${i + 1}`,
        supplier_name: suppliers[(i + 3) % suppliers.length],
        quantity: qty,
        unitprice: unitPrice,
        subtotal: qty * unitPrice,
      })
    }
  }

  console.log(`準備新增 ${testItems.length} 筆測試項目...`)

  const { data, error } = await supabase
    .from('payment_request_items')
    .insert(testItems)
    .select()

  if (error) {
    console.error('新增失敗:', error)
  } else {
    console.log(`成功新增 ${data?.length} 筆測試項目`)
  }
}

addTestData()
