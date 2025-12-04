const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestData() {
  // 先查詢已建立的請款單
  const { data: existingRequests } = await supabase
    .from('payment_requests')
    .select('*')
    .in('code', ['PR-2412-001', 'PR-2412-002', 'PR-2412-003'])

  if (!existingRequests || existingRequests.length === 0) {
    console.error('找不到請款單')
    return
  }

  console.log('找到請款單:', existingRequests.length, '筆')

  const createdRequests = existingRequests.sort((a, b) => a.code.localeCompare(b.code))

  // 2. 建立請款項目 (使用正確欄位名稱 unitprice)
  const paymentRequestItems = []

  // PR-001 的項目（日本團）
  paymentRequestItems.push(
    {
      request_id: createdRequests[0].id,
      item_number: 'ITEM-001',
      description: '東京飯店住宿 4晚',
      category: '住宿',
      supplier_name: '東京帝國飯店',
      unitprice: 15000,
      quantity: 4,
      subtotal: 60000,
    },
    {
      request_id: createdRequests[0].id,
      item_number: 'ITEM-002',
      description: '成田機場接送',
      category: '交通',
      supplier_name: '日本觀光巴士',
      unitprice: 8000,
      quantity: 2,
      subtotal: 16000,
    },
    {
      request_id: createdRequests[0].id,
      item_number: 'ITEM-003',
      description: '迪士尼門票',
      category: '門票',
      supplier_name: '東京迪士尼',
      unitprice: 2450,
      quantity: 20,
      subtotal: 49000,
    }
  )

  // PR-002 的項目（韓國團）
  paymentRequestItems.push(
    {
      request_id: createdRequests[1].id,
      item_number: 'ITEM-004',
      description: '首爾飯店住宿 3晚',
      category: '住宿',
      supplier_name: '首爾樂天飯店',
      unitprice: 12000,
      quantity: 3,
      subtotal: 36000,
    },
    {
      request_id: createdRequests[1].id,
      item_number: 'ITEM-005',
      description: '仁川機場接送',
      category: '交通',
      supplier_name: '韓國觀光巴士',
      unitprice: 6000,
      quantity: 2,
      subtotal: 12000,
    },
    {
      request_id: createdRequests[1].id,
      item_number: 'ITEM-006',
      description: '樂天世界門票',
      category: '門票',
      supplier_name: '樂天世界',
      unitprice: 2000,
      quantity: 20,
      subtotal: 40000,
    }
  )

  // PR-003 的項目（泰國團）
  paymentRequestItems.push(
    {
      request_id: createdRequests[2].id,
      item_number: 'ITEM-007',
      description: '曼谷飯店住宿 5晚',
      category: '住宿',
      supplier_name: '曼谷四季酒店',
      unitprice: 18000,
      quantity: 5,
      subtotal: 90000,
    },
    {
      request_id: createdRequests[2].id,
      item_number: 'ITEM-008',
      description: '素萬那普機場接送',
      category: '交通',
      supplier_name: '泰國觀光巴士',
      unitprice: 5000,
      quantity: 2,
      subtotal: 10000,
    },
    {
      request_id: createdRequests[2].id,
      item_number: 'ITEM-009',
      description: '大皇宮門票',
      category: '門票',
      supplier_name: '泰國觀光局',
      unitprice: 700,
      quantity: 20,
      subtotal: 14000,
    },
    {
      request_id: createdRequests[2].id,
      item_number: 'ITEM-010',
      description: '泰式按摩體驗',
      category: '體驗',
      supplier_name: 'Lets Relax Spa',
      unitprice: 2100,
      quantity: 20,
      subtotal: 42000,
    }
  )

  console.log('建立請款項目...')
  const { data: createdItems, error: itemError } = await supabase
    .from('payment_request_items')
    .insert(paymentRequestItems)
    .select()

  if (itemError) {
    console.error('建立請款項目失敗:', itemError.message)
    return
  }
  console.log('✅ 請款項目已建立:', createdItems.length, '筆')

  // 3. 先清除舊的出納單
  await supabase.from('disbursement_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // 4. 建立出納單（包含前兩張請款單）
  console.log('建立出納單...')
  const { data: disbursement, error: disError } = await supabase
    .from('disbursement_orders')
    .insert({
      order_number: 'DO51203-001',
      disbursement_date: '2024-12-05',
      payment_request_ids: [createdRequests[0].id, createdRequests[1].id],
      amount: 213000,
      status: 'pending',
    })
    .select()
    .single()

  if (disError) {
    console.error('建立出納單失敗:', disError.message)
    return
  }
  console.log('✅ 出納單已建立:', disbursement.order_number)

  console.log('')
  console.log('=== 測試資料建立完成 ===')
  console.log('請款單: 3 筆')
  console.log('請款項目: 10 筆')
  console.log('出納單: 1 筆 (包含 2 張請款單, 6 個項目)')
}

createTestData()
